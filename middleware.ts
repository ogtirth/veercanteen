import { NextRequest, NextResponse } from "next/server";
import { auth } from "./auth";

export default async function middleware(request: NextRequest) {
  const session = await auth();
  
  // Skip API routes
  if (request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Admin routes protection
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!session?.user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    if (!(session.user as any)?.isAdmin) {
      return NextResponse.redirect(new URL("/", request.url));
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
