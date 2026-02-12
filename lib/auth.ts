import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { dbGet } from "./db";
import { verifyPassword } from "./auth-helpers";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const user = await dbGet<{
          id: number;
          username: string;
          display_name: string;
          avatar_url: string | null;
          password_hash: string;
        }>(
          "SELECT id, username, display_name, avatar_url, password_hash FROM users WHERE username = ?",
          [credentials.username as string]
        );

        if (!user) return null;

        const valid = await verifyPassword(
          credentials.password as string,
          user.password_hash
        );
        if (!valid) return null;

        return {
          id: String(user.id),
          name: user.display_name || user.username,
          username: user.username,
          image: user.avatar_url,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.username = (user as { username: string }).username;
        token.userId = user.id as string;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.username = token.username as string;
      session.user.id = token.userId as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
});
