import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Map of app routes to their slugs for authorization
const appRouteMap: Record<string, string> = {
  "/apps/geoloc193": "geoloc193",
  "/apps/viaturas": "viaturas",
  "/apps/contingencia": "contingencia",
  "/apps/chat": "chat",
  "/apps/headsets": "headsets",
  "/apps/info-cobom": "info-cobom",
  "/apps/agenda": "agenda",
  "/apps/gestao-dejem": "gestao-dejem",
  "/apps/mapa-offline": "mapa-offline",
  "/apps/auditoria": "auditoria",
};

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Admin routes - only ADMINISTRADOR can access
    if (pathname.startsWith("/admin")) {
      if (token?.role !== "ADMINISTRADOR") {
        return NextResponse.redirect(new URL("/workspace", req.url));
      }
    }

    // App routes - check if user has access to the app
    for (const [routePrefix, appSlug] of Object.entries(appRouteMap)) {
      if (pathname.startsWith(routePrefix)) {
        const userApps = (token?.allowedApps as string[]) || [];
        if (!userApps.includes(appSlug)) {
          return NextResponse.redirect(new URL("/workspace", req.url));
        }
        break;
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // Public routes - accessible without authentication
        if (pathname.startsWith("/solicitacao/")) {
          return true;
        }

        // All other protected routes require authentication
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/workspace/:path*",
    "/dashboard/:path*",
    "/admin/:path*",
    "/apps/:path*",
  ],
};