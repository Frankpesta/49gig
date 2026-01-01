import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Proxy (Next.js 16+)
 * Handles route-level logic before requests are processed
 * 
 * This proxy enforces verification checks for freelancers accessing dashboard routes.
 * It sets headers that the client-side can use to determine if verification is required.
 * 
 * Note: In Next.js 16, "proxy" is used instead of "middleware"
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require verification checks
  const publicRoutes = [
    "/",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/oauth/callback",
  ];

  // Check if this is a public route
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // Check if this is a dashboard route (excluding verification page)
  const isDashboardRoute =
    pathname.startsWith("/dashboard") && !pathname.startsWith("/verification");

  // Create response
  const response = NextResponse.next();

  // For dashboard routes, set a header to indicate verification check is needed
  // The client-side will use this to enforce verification redirects
  if (isDashboardRoute && !isPublicRoute) {
    response.headers.set("x-require-verification", "true");
  }

  // For verification page, allow access
  if (pathname.startsWith("/verification")) {
    response.headers.set("x-verification-page", "true");
  }

  return response;
}

/**
 * Configure which routes the proxy should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

