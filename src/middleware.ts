// middleware.ts
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

// Define public routes that don't require authentication
const PUBLIC_ROUTES = [
    "/",
    "/signin",
    "/home",
    "/api/payments/direct/callback",
    // Add any other public routes here
];

// Define static asset patterns that should always be accessible
const STATIC_ASSETS = [
    "/sw.js",
    "/manifest.json",
    "/logo.png",
    "/favicon.ico",
    "/workbox-",
    "/_next/static",
    "/_next/image",
    "/icons/",
];

// Helper function to check if path matches any pattern
const matchesPattern = (pathname: string, patterns: string[]): boolean => {
    return patterns.some(pattern => pathname.startsWith(pattern));
};

export default withAuth(
    function middleware(req) {
        const { pathname } = req.nextUrl;

        // Allow static assets through without any processing
        if (matchesPattern(pathname, STATIC_ASSETS)) {
            return NextResponse.next();
        }

        // You can add custom logic here for authenticated users
        // For example, redirect authenticated users away from signin page
        const token = req.nextauth.token;

        if (token && pathname === "/signin") {
            return NextResponse.redirect(new URL("/", req.url));
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                const { pathname } = req.nextUrl;

                // Always allow static assets
                if (matchesPattern(pathname, STATIC_ASSETS)) {
                    return true;
                }

                // Allow public routes
                if (PUBLIC_ROUTES.includes(pathname)) {
                    return true;
                }

                // Auth endpoints are always allowed
                if (pathname.startsWith("/api/auth")) {
                    return true;
                }

                // API routes can have their own auth logic
                // But by default, protect them
                if (pathname.startsWith("/api/")) {
                    return !!token;
                }

                // Everything else requires authentication
                return !!token;
            },
        },
        pages: {
            signIn: "/signin",
            // You can also define error pages
            // error: "/auth/error",
        },
    }
);

// Specify which routes this middleware should run on
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (public folder)
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};