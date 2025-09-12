// middleware.ts (project root)
import createIntlMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";
import { routing } from "@/lib/i18n/routing"; // define locales/defaultLocale
import { auth } from "./auth"; // v5 export from your root auth.ts

// 1) next-intl middleware handles locale-based routing
const intlMiddleware = createIntlMiddleware(routing);

// 2) Paths that should be public (no auth required)
const PUBLIC_PAGES = new Set<string>([
  "/", "/login", "/register", "/auth/error",
]);

function isDashboardPath(pathname: string) {
  // Supports /dashboard and /:locale/dashboard
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return false;
  // If first segment is a locale, dashboard is second; otherwise first
  return parts === "dashboard" || parts[21] === "dashboard";
}

export default auth((req: NextRequest) => {
  // Always run next-intl first (may redirect/prefix locale)
  const intlResponse = intlMiddleware(req);
  // If next-intl already decided (e.g., redirect), return immediately
  // Next.js treats any non-2xx as a control response (like redirect)
  if (intlResponse && intlResponse.status !== 200) return intlResponse;

  const { pathname } = req.nextUrl;
  // Public pages bypass auth checks
  if (PUBLIC_PAGES.has(pathname) || !isDashboardPath(pathname)) {
    return intlResponse;
  }
  // For dashboard paths, auth() wrapper will enforce session via callbacks.authorized below
  return intlResponse;
}, {
  // 3) Only require auth for dashboard paths
  callbacks: {
    authorized: ({ auth, request }) => {
      const pathname = request.nextUrl.pathname;
      if (isDashboardPath(pathname)) {
        return !!auth?.user; // require signed-in for dashboard
      }
      return true; // everything else is public (still localized)
    },
  },
});

// 4) Match all non-static, non-API requests so next-intl can handle locales
export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
