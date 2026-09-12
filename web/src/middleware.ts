import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const PROTECTED_PREFIXES = ["/dashboard", "/profile", "/opportunities/new", "/admin"];
const ADMIN_ONLY_PREFIXES = ["/opportunities/new", "/admin"];

export default auth((req) => {
  const isProtected = PROTECTED_PREFIXES.some((p) => req.nextUrl.pathname.startsWith(p));
  if (isProtected && !req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  const isAdminOnly = ADMIN_ONLY_PREFIXES.some((p) => req.nextUrl.pathname.startsWith(p));
  if (isAdminOnly && req.auth && req.auth.user.role !== "admin") {
    return NextResponse.redirect(new URL("/opportunities", req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/opportunities/new", "/admin/:path*"],
};
