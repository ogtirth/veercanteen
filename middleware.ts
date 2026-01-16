import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Use the Edge-compatible auth config (no bcrypt/prisma)
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/admin/:path*", "/cart", "/checkout", "/my-orders", "/profile"],
};
