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
// Metadata
// -----------------
export const metadata: Metadata = {
    metadataBase: new URL("https://paysuit.aistartupclub.com"),

    title: {
        default: "Paysuit — M-Pesa Payments for Developers",
        template: "%s | Paysuit Fintech",
    },

    description:
        "Add M-Pesa payments to your applications in minutes. One API, instant settlement, zero bureaucracy.",

    applicationName: "Paysuit",
    generator: "Next.js",
    manifest: "/manifest.json",

    keywords: [
        "Paysuit",
        "Paysuit Fintech",
        "M-Pesa API",
        "Daraja API",
        "payments API",
        "mobile money integration",
        "developer payments",
        "payments infrastructure",
        "African fintech",
        "fintech",
        "M-Pesa STK Push",
        "Paysuit SDK"
    ],

    authors: [
        {
            name: "Oscar Madegwa",
            url: "https://madegwa.pages.dev",
        },
    ],

    creator: "Paysuit Fintech",
    publisher: "Paysuit Fintech",

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
                color: "#00C853"
            }
        ],
    },

    openGraph: {
        type: "website",
        url: "https://paysuit.aistartupclub.com",
        title: "Paysuit — M-Pesa Payments for Developers",
        description:
            "The fastest way to integrate M-Pesa payments. Clean APIs, instant settlement, built for developers.",
        siteName: "Paysuit",
        images: [
            {
                url: "https://paysuit.aistartupclub.com/og-image.png",
                width: 1200,
                height: 630,
                alt: "Paysuit — M-Pesa Payments for Developers"
            }
        ],
    },

    twitter: {
        card: "summary_large_image",
        title: "Paysuit — M-Pesa Payments for Developers",
        description:
            "Integrate M-Pesa payments in minutes using clean APIs and modern SDKs.",
        images: ["https://paysuit.aistartupclub.com/og-image.png"],
        creator: "@paysuit"
    },

    category: "finance",
    alternates: {
        canonical: "https://paysuit.aistartupclub.com/"
    },

    appleWebApp: {
        capable: true,
        title: "Paysuit",
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
                    name: "Paysuit",
                    applicationCategory: "FinanceApplication",
                    operatingSystem: "Web",
                    description:
                        "Developer-first M-Pesa payments API. Integrate mobile money instantly using secure, modern SDKs.",
                    url: "https://paysuit.aistartupclub.com",
                    creator: {
                        "@type": "Organization",
                        name: "Paysuit Fintech",
                        url: "https://paysuit.aistartupclub.com"
                    }
                }),
            }}
        />
        </body>
        </html>
    );
}
