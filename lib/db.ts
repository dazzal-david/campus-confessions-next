import { createClient, type Client, type InStatement } from "@libsql/client";

let client: Client | null = null;
let initialized = false;

function getClient(): Client {
  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return client;
}

async function ensureTables(): Promise<void> {
  if (initialized) return;
  const c = getClient();
  await c.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL DEFAULT 'Anonymous',
      bio TEXT DEFAULT '',
      avatar_url TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);

    CREATE TABLE IF NOT EXISTS posts_v2 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      mood TEXT DEFAULT 'none',
      image_url TEXT DEFAULT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_posts_v2_user ON posts_v2(user_id);
    CREATE INDEX IF NOT EXISTS idx_posts_v2_timestamp ON posts_v2(timestamp DESC);

    CREATE TABLE IF NOT EXISTS reactions_v2 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts_v2(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(post_id, user_id, type)
    );

    CREATE TABLE IF NOT EXISTS replies_v2 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts_v2(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_replies_v2_post ON replies_v2(post_id);

    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      post_id INTEGER NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (post_id) REFERENCES posts_v2(id),
      UNIQUE(user_id, post_id)
    );
    CREATE INDEX IF NOT EXISTS idx_likes_post ON likes(post_id);

    CREATE TABLE IF NOT EXISTS reposts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      post_id INTEGER NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (post_id) REFERENCES posts_v2(id),
      UNIQUE(user_id, post_id)
    );
    CREATE INDEX IF NOT EXISTS idx_reposts_post ON reposts(post_id);

    CREATE TABLE IF NOT EXISTS follows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      follower_id INTEGER NOT NULL,
      following_id INTEGER NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (follower_id) REFERENCES users(id),
      FOREIGN KEY (following_id) REFERENCES users(id),
      UNIQUE(follower_id, following_id)
    );
    CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
    CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(sender_id, receiver_id, timestamp);
    CREATE INDEX IF NOT EXISTS idx_messages_recv ON messages(receiver_id, is_read);

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      actor_id INTEGER NOT NULL,
      reference_id INTEGER,
      is_read INTEGER DEFAULT 0,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (actor_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, is_read, timestamp DESC);

    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      post_id INTEGER NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (post_id) REFERENCES posts_v2(id),
      UNIQUE(user_id, post_id)
    );
    CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
  `);
  initialized = true;
}

type DbValue = string | number | bigint | null;

export async function dbGet<T = Record<string, unknown>>(
  sql: string,
  args: DbValue[] = []
): Promise<T | undefined> {
  await ensureTables();
  const result = await getClient().execute({ sql, args });
  return result.rows[0] as T | undefined;
}

export async function dbAll<T = Record<string, unknown>>(
  sql: string,
  args: DbValue[] = []
): Promise<T[]> {
  await ensureTables();
  const result = await getClient().execute({ sql, args });
  return result.rows as T[];
}

export async function dbRun(
  sql: string,
  args: DbValue[] = []
): Promise<{ lastInsertRowid: number; changes: number }> {
  await ensureTables();
  const result = await getClient().execute({ sql, args });
  return {
    lastInsertRowid: Number(result.lastInsertRowid),
    changes: result.rowsAffected,
  };
}

export async function dbBatch(statements: InStatement[]): Promise<void> {
  await ensureTables();
  await getClient().batch(statements, "write");
}

export async function createNotification(
  userId: number,
  type: string,
  actorId: number,
  referenceId: number | null
) {
  if (userId === actorId) return;
  await dbRun(
    "INSERT INTO notifications (user_id, type, actor_id, reference_id) VALUES (?, ?, ?, ?)",
    [userId, type, actorId, referenceId]
  );
}

export async function getReactionsForPosts(
  ids: number[],
  userId: number
): Promise<{
  reactionsMap: Record<number, Record<string, number>>;
  userReactionsMap: Record<number, string[]>;
}> {
  if (ids.length === 0) return { reactionsMap: {}, userReactionsMap: {} };

  const placeholders = ids.map(() => "?").join(",");

  const rows = await dbAll<{ post_id: number; type: string; count: number }>(
    `SELECT post_id, type, COUNT(*) as count FROM reactions_v2 WHERE post_id IN (${placeholders}) GROUP BY post_id, type`,
    ids
  );

  const reactionsMap: Record<number, Record<string, number>> = {};
  for (const r of rows) {
    if (!reactionsMap[r.post_id]) reactionsMap[r.post_id] = {};
    reactionsMap[r.post_id][r.type] = r.count;
  }

  const userRows = await dbAll<{ post_id: number; type: string }>(
    `SELECT post_id, type FROM reactions_v2 WHERE user_id = ? AND post_id IN (${placeholders})`,
    [userId, ...ids]
  );

  const userReactionsMap: Record<number, string[]> = {};
  for (const r of userRows) {
    if (!userReactionsMap[r.post_id]) userReactionsMap[r.post_id] = [];
    userReactionsMap[r.post_id].push(r.type);
  }

  return { reactionsMap, userReactionsMap };
}
