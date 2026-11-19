import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// Penanganan database otomatis untuk Vercel Serverless
if (process.env.VERCEL && (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith("file:"))) {
  const tmpDbPath = path.join("/tmp", "dev.db");
  const localDbPath = path.join(process.cwd(), "prisma", "dev.db");

  if (!fs.existsSync(tmpDbPath) && fs.existsSync(localDbPath)) {
    try {
      fs.copyFileSync(localDbPath, tmpDbPath);
    } catch (e) {
      console.warn("Gagal menyalin database SQLite ke /tmp:", e);
    }
  }

  if (fs.existsSync(tmpDbPath)) {
    process.env.DATABASE_URL = `file:${tmpDbPath}`;
  } else if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "file:./dev.db";
  }
} else if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
