import NextAuth, { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import prisma from "@/lib/prisma";

const config: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("Authorize called with:", credentials?.email);
        
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials");
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) {
          console.log("User not found:", credentials.email);
          throw new Error("Invalid email or password");
        }

        const passwordMatch = await compare(
          credentials.password as string,
          user.password
        );

        if (!passwordMatch) {
          console.log("Password mismatch for:", credentials.email);
          throw new Error("Invalid email or password");
        }

        if (!user.isActive) {
          console.log("User inactive:", credentials.email);
          throw new Error("Account is deactivated");
        }

        console.log("Login successful for:", credentials.email);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = (user as any).isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).isAdmin = token.isAdmin;
      }
      return session;
    },
    async authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isAdmin = (auth?.user as any)?.isAdmin;
      const { pathname } = request.nextUrl;

      // Admin routes require admin role
      if (pathname.startsWith("/admin")) {
        if (!isLoggedIn) return false;
        if (!isAdmin) return Response.redirect(new URL("/", request.nextUrl));
        return true;
      }

      // Protected routes require login
      if (["/cart", "/checkout", "/my-orders", "/profile"].includes(pathname)) {
        return isLoggedIn;
      }

      return true;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
};

export const { handlers, auth, signIn, signOut } = NextAuth(config) as any;
