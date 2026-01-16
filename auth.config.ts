import type { NextAuthConfig } from "next-auth";

// This config is used by the middleware (Edge runtime)
// It doesn't include providers that use Node.js APIs like bcrypt or Prisma
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isAdmin = (auth?.user as any)?.isAdmin;
      const { pathname } = request.nextUrl;

      // Admin routes require admin role
      if (pathname.startsWith("/admin")) {
        if (!isLoggedIn) return false;
        if (!isAdmin) {
          return Response.redirect(new URL("/", request.nextUrl));
        }
        return true;
      }

      // Protected routes require login
      if (["/cart", "/checkout", "/my-orders", "/profile"].includes(pathname)) {
        return isLoggedIn;
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = (user as any).isAdmin;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).isAdmin = token.isAdmin;
      }
      return session;
    },
  },
  providers: [], // Providers are added in auth.ts (Node.js runtime)
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
};
