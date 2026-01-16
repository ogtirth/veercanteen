import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read the session token cookie directly
  const sessionToken = request.cookies.get("authjs.session-token")?.value 
    || request.cookies.get("__Secure-authjs.session-token")?.value;

  // If no session token, redirect to login for protected routes
  if (!sessionToken) {
    if (pathname.startsWith("/admin") || ["/cart", "/checkout", "/my-orders", "/profile"].includes(pathname)) {
      const url = new URL("/login", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // For routes that need session validation, let the page handle it
  // This avoids Edge runtime issues with JWT verification
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/cart", "/checkout", "/my-orders", "/profile"],
};
