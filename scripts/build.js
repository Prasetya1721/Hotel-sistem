const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// 1. Fallback Environment Variables untuk Vercel / Production Build
if (!process.env.DATABASE_URL) {
  console.log("[Build] Menyetel fallback DATABASE_URL ke file:./dev.db");
  process.env.DATABASE_URL = "file:./dev.db";
}

if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
  console.log("[Build] Menyetel fallback AUTH_SECRET");
  process.env.AUTH_SECRET = "hotelops-guard-secret-key-production-cuan-2026-very-long";
}

if (!process.env.AUTH_TRUST_HOST) {
  process.env.AUTH_TRUST_HOST = "true";
}

// 2. Jalankan Prisma Generate
console.log("[Build] Menjalankan: npx prisma generate");
execSync("npx prisma generate", { stdio: "inherit", env: process.env });

// 3. Jalankan Prisma DB Push (membuat tabel secara otomatis di SQLite lokal atau Postgres cloud)
console.log("[Build] Menjalankan: npx prisma db push --accept-data-loss");
try {
  execSync("npx prisma db push --accept-data-loss", { stdio: "inherit", env: process.env });
} catch (e) {
  console.warn("[Build] Warning: prisma db push dilewati:", e.message);
}

// 4. Jalankan Seed Database
console.log("[Build] Menjalankan: seed data awal...");
try {
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit", env: process.env });
} catch (e) {
  console.warn("[Build] Warning: Seed database dilewati:", e.message);
}

// 5. Jalankan Next.js Build
console.log("[Build] Menjalankan: next build");
execSync("next build", { stdio: "inherit", env: process.env });
