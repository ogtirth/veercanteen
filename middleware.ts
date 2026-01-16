import { auth } from "./auth";

export default auth;

export const config = {
  matcher: ["/admin/:path*", "/cart", "/checkout", "/my-orders", "/profile"],
};
