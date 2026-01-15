import { NextRequest, NextResponse } from "next/server";
import { auth } from "./auth";

export default async function middleware(request: NextRequest) {
  const session = await auth();

  // Admin routes protection
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!session || !(session.user as any)?.isAdmin) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Protected routes (user must be logged in)
  if (
    ["/cart", "/checkout", "/my-orders", "/profile"].includes(
      request.nextUrl.pathname
    )
  ) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/cart", "/checkout", "/my-orders", "/profile"],
};
