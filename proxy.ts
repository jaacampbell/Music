import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE = "music-os-auth";

export function proxy(request: NextRequest): NextResponse {
  const path = request.nextUrl.pathname;
  const hasSession = Boolean(request.cookies.get(AUTH_COOKIE)?.value);
  const protectedRoute = path.startsWith("/dashboard");

  if (protectedRoute && !hasSession) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${path}${request.nextUrl.search}`);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"]
};
