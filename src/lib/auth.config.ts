import type { NextAuthConfig } from "next-auth";

// authConfig ini dijalankan di Edge Middleware (Vercel Edge Network).
// PENTING: Jangan import Prisma atau bcrypt di sini agar tidak crash di Edge runtime Vercel!
export const authConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "hotelops-guard-secret-fallback-key-2026",
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [], // Diisi di Node.js runtime (src/auth.ts), dibiarkan kosong di Edge middleware
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isLogin = nextUrl.pathname.startsWith("/login");
      if (isLogin) {
        return isLoggedIn ? Response.redirect(new URL("/dashboard", nextUrl)) : true;
      }
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.id = user.id;
        token.propertyId = (user as { propertyId?: string }).propertyId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.propertyId = token.propertyId as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
