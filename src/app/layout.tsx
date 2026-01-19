import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";

import { Header } from "@/components/header";
import { AuthProvider } from "@/components/auth-provider";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme-provider";
import { Suspense } from "react";
import MobileBottomNav from "@/components/MobileBottomNav";
import InstallPrompt from "@/components/InstallPrompt";
import AuthErrorHandlerWrapper from "@/components/auth-error-handler-wrapper";
import { NotificationDisplay } from "@/components/notifications/notification-display";

// -----------------
// Font Configuration
// -----------------
const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

// -----------------
// Viewport (Next.js 15+)
// -----------------
export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
        { media: "(prefers-color-scheme: dark)", color: "#000000" }
    ],
    colorScheme: "light dark"
};

// -----------------
// Metadata (SEO)
// -----------------
export const metadata: Metadata = {
    metadataBase: new URL("https://crackmode.aistartupclub.com/"),

    title: {
        default: "CrackMode — LeetCode Leaderboard & Coding Accountability",
        template: "%s | CrackMode",
    },

    description:
        "CrackMode is a competitive LeetCode leaderboard that tracks real progress, enforces integrity, and builds strong problem-solving habits through live verification.",

    applicationName: "CrackMode",
    generator: "Next.js",
    manifest: "/manifest.json",

    keywords: [
        "CrackMode",
        "LeetCode leaderboard",
        "DSA practice",
        "competitive programming",
        "coding accountability",
        "interview preparation",
        "software engineering practice",
        "algorithm challenges",
        "daily coding",
        "LeetCode progress tracker"
    ],

    authors: [
        {
            name: "Oscar Madegwa",
            url: "https://madegwa.pages.dev",
        },
    ],

    creator: "CrackMode",
    publisher: "CrackMode",

    icons: {
        icon: [
            { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
            { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" }
        ],
        apple: "/icons/apple-touch-icon.png",
        other: [
            {
                rel: "mask-icon",
                url: "/icons/android-chrome-192x192.png",
                color: "#111827"
            }
        ],
    },

    openGraph: {
        type: "website",
        url: "https://crackmode.aistartupclub.com/",
        title: "CrackMode — LeetCode Leaderboard & Coding Accountability",
        description:
            "Track LeetCode progress, climb the leaderboard, and prove real understanding through live problem-solving.",
        siteName: "CrackMode",
        images: [
            {
                url: "https://crackmode.vercel.app/og-image.png",
                width: 1200,
                height: 630,
                alt: "CrackMode LeetCode Leaderboard"
            }
        ],
    },

    twitter: {
        card: "summary_large_image",
        title: "CrackMode — LeetCode Leaderboard",
        description:
            "A competitive LeetCode leaderboard focused on real skill, consistency, and integrity.",
        images: ["https://crackmode.vercel.app/og-image.png"],
        creator: "@crackmode"
    },

    category: "education",
    alternates: {
        canonical: "https://crackmode.aistartupclub.com/"
    },

    appleWebApp: {
        capable: true,
        title: "CrackMode",
        statusBarStyle: "black-translucent"
    },

    formatDetection: { telephone: false }
};

// -----------------
// Root Layout
// -----------------
export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
            <ThemeProvider defaultTheme="system" storageKey="theme-pref">
                <Suspense fallback={null}>
                    <Header />
                    {children}
                    <Analytics />
                </Suspense>

                <NotificationDisplay />
                <AuthErrorHandlerWrapper />
                <InstallPrompt />
                <MobileBottomNav />
            </ThemeProvider>
        </AuthProvider>

        {/* SEO Structured Data */}
        <Script
            id="structured-data"
            type="application/ld+json"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "SoftwareApplication",
                    name: "CrackMode",
                    applicationCategory: "EducationalApplication",
                    operatingSystem: "Web",
                    description:
                        "A LeetCode leaderboard and accountability platform designed to promote genuine problem-solving through consistency and live verification.",
                    url: "https://crackmode.aistartupclub.com/",
                    creator: {
                        "@type": "Organization",
                        name: "CrackMode",
                        url: "https://crackmode.aistartupclub.com/"
                    }
                }),
            }}
        />
        </body>
        </html>
    );
}
