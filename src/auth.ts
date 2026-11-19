import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { authConfig } from "@/lib/auth.config";

const DEMO_USERS: Record<string, { id: string; name: string; email: string; role: string; propertyId: string }> = {
  "owner@hotelops.test": {
    id: "U-OWNER",
    name: "Pemilik Hotel",
    email: "owner@hotelops.test",
    role: "OWNER",
    propertyId: "prop-demo",
  },
  "receptionist@hotelops.test": {
    id: "U-REC",
    name: "Siti Aminah",
    email: "receptionist@hotelops.test",
    role: "RECEPTIONIST",
    propertyId: "prop-demo",
  },
  "security@hotelops.test": {
    id: "U-SEC",
    name: "Rudi Hartono",
    email: "security@hotelops.test",
    role: "SECURITY",
    propertyId: "prop-demo",
  },
  "housekeeping@hotelops.test": {
    id: "U-HK",
    name: "Joko Susilo",
    email: "housekeeping@hotelops.test",
    role: "HOUSEKEEPING",
    propertyId: "prop-demo",
  },
  "gm@hotelops.test": {
    id: "U-GM",
    name: "Budi Santoso",
    email: "gm@hotelops.test",
    role: "GENERAL_MANAGER",
    propertyId: "prop-demo",
  },
  "engineering@hotelops.test": {
    id: "U-ENG",
    name: "Andi Wijaya",
    email: "engineering@hotelops.test",
    role: "ENGINEERING",
    propertyId: "prop-demo",
  },
  "finance@hotelops.test": {
    id: "U-FIN",
    name: "Dewi Lestari",
    email: "finance@hotelops.test",
    role: "FINANCE",
    propertyId: "prop-demo",
  },
  "auditor@hotelops.test": {
    id: "U-AUD",
    name: "Tono Prasojo",
    email: "auditor@hotelops.test",
    role: "AUDITOR",
    propertyId: "prop-demo",
  },
  "deviceadmin@hotelops.test": {
    id: "U-DEV",
    name: "Agus Kurniawan",
    email: "deviceadmin@hotelops.test",
    role: "DEVICE_ADMIN",
    propertyId: "prop-demo",
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Kredensial",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Kata sandi", type: "password" },
      },
      async authorize(credentials) {
        const rawEmail = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!rawEmail || !password) return null;

        const email = rawEmail.trim().toLowerCase();

        // 1. Cek di Database
        try {
          const user = await prisma.user.findUnique({
            where: { email },
            include: { property: true },
          });
          if (user && user.isActive) {
            const valid = await bcrypt.compare(password, user.passwordHash);
            if (valid) {
              return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                propertyId: user.propertyId,
              };
            }
          }
        } catch (error) {
          console.error("Authorize DB error:", error);
        }

        // 2. Fallback Demo Accounts (memastikan akun demo selalu bisa login)
        if (password === "rahasia1234" && DEMO_USERS[email]) {
          return DEMO_USERS[email];
        }

        return null;
      },
    }),
  ],
});
