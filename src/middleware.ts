import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secretKey = process.env.JWT_SECRET || "super-secret-jwt-key-for-skedio-auth-replace-in-production";
const key = new TextEncoder().encode(secretKey);

export async function middleware(request: NextRequest) {
  const session = request.cookies.get("session")?.value;

  // Paths that require authentication
  const isDashboardRoute = request.nextUrl.pathname.startsWith("/") && 
                           !request.nextUrl.pathname.startsWith("/login") && 
                           !request.nextUrl.pathname.startsWith("/register") && 
                           !request.nextUrl.pathname.startsWith("/api") && 
                           !request.nextUrl.pathname.startsWith("/_next");

  // Paths that are only for unauthenticated users
  const isAuthRoute = request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register";

  let isAuthenticated = false;

  if (session) {
    try {
      await jwtVerify(session, key, { algorithms: ["HS256"] });
      isAuthenticated = true;
    } catch (err) {
      // Invalid token
    }
  }

  if (isDashboardRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
