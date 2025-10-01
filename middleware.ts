import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/app/lib/i18n/routing";
import { auth } from "./auth";
import type { Session } from "next-auth";

// 1) Handle locale negotiation first
const intlMiddleware = createIntlMiddleware(routing);

// 2) Public pages (anyone can access)
const PUBLIC_PATHS = new Set<string>(["/", "/login", "/register", "/auth/error"]);

// 3) Protected paths (only for logged-in users)
const PROTECTED_PREFIXES: readonly string[] = ["/dashboard"];

// Helpers
function stripLocale(pathname: string): { locale: string; pathname: string } {
  const parts = pathname.split("/").filter(Boolean);
  const first = parts[0] ?? "";
  const locales = routing.locales as readonly string[];
  if (locales.includes(first)) {
    const rest = "/" + parts.slice(1).join("/");
    return { locale: first, pathname: rest === "/" ? "/" : rest };
  }
  return { locale: routing.defaultLocale, pathname };
}

function isProtectedPathname(pathname: string): boolean {
  const clean = stripLocale(pathname).pathname;
  return PROTECTED_PREFIXES.some(
    (prefix) => clean === prefix || clean.startsWith(prefix + "/")
  );
}

function withLocale(pathname: string, locale: string): string {
  const p = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `/${locale}${p === "/" ? "" : p}`;
}

// Middleware handler
const middlewareHandler = (req: NextRequest) => {
  const intlRes = intlMiddleware(req);
  if (intlRes) return intlRes;
  return NextResponse.next();
};

// Main middleware export
export default auth(middlewareHandler, {
  callbacks: {
    authorized: ({
      auth: session,
      request,
    }: {
      auth: Session | null;
      request: NextRequest;
    }): true | NextResponse => {
      const { pathname } = request.nextUrl;
      const { locale, pathname: clean } = stripLocale(pathname);

      const isPublic = PUBLIC_PATHS.has(clean);
      const needsAuth = isProtectedPathname(pathname);

      const isLoggedIn = !!session?.user;

      // 1️⃣ Redirect logged-in users away from login/register
      if (isPublic && isLoggedIn && (clean === "/login" || clean === "/register")) {
        return NextResponse.redirect(new URL(withLocale("/dashboard", locale), request.url));
      }

      // 2️⃣ Redirect non-logged-in users trying to access protected routes
      if (needsAuth && !isLoggedIn) {
        const loginUrl = new URL(withLocale("/login", locale), request.url);
        loginUrl.searchParams.set("callbackUrl", request.nextUrl.href);
        return NextResponse.redirect(loginUrl);
      }

      return true;
    },
  },
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|_vercel|.*\\..*).*)"],
};
