import sharp from "sharp";
import path from "path";
import { writeFile, mkdir } from "fs/promises";
import { randomUUID } from "crypto";

export async function processImage(buffer: Buffer): Promise<string> {
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const filename = randomUUID() + ".jpg";
  await sharp(buffer)
    .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toFile(path.join(uploadsDir, filename));

  return "/uploads/" + filename;
}
