import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE } from "./lib/auth-cookie";

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const hasSession = !!req.cookies.get(AUTH_COOKIE)?.value;
  const isAuthPage = pathname.startsWith("/auth");

  if (!hasSession && !isAuthPage) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  if (hasSession && isAuthPage) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/auth"],
};
