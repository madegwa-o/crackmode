import type {Metadata, Viewport} from "next";
import "./globals.css";
import {Header} from "@/components/header";
import { AuthProvider } from "@/components/auth-provider";
import { NotificationDisplay } from "@/components/notifications/notification-display";
import AuthErrorHandlerWrapper from "@/components/auth-error-handler-wrapper";
import InstallPrompt from "@/components/InstallPrompt";
import MobileBottomNav from "@/components/MobileBottomNav";

import React, {Suspense} from "react"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider";
import Script from "next/script";
import {SidebarNav} from "@/components/sidebar-nav";
import {ApartmentProvider} from "@/hooks/use-apartment-context";
import {ApartmentSelector} from "@/components/apartment-selector";
import {ThemeToggle} from "@/components/theme-toggle";
import {SidebarTrigger} from "@/components/SidebarTrigger";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
        { media: "(prefers-color-scheme: dark)", color: "#000000" },
    ],
    colorScheme: "light dark",
};


export const metadata: Metadata = {
    metadataBase: new URL("https://homes.aistartupclub.com"),

    title: {
        default: "Malipo Agents — Smart Property & Tenant Management",
        template: "%s | Malipo Agents",
    },

    description:
        "Smart property management platform for landlords and agents. Collect rent, manage tenants, and track payments with ease.",

    applicationName: "Malipo Agents",
    generator: "Next.js",
    manifest: "/manifest.json",

    keywords: [
        "Malipo Agents",
        "property management Kenya",
        "tenant management system",
        "rent collection platform",
        "landlord software",
        "real estate management",
        "M-Pesa rent payments",
        "property agents Kenya",
    ],

    authors: [
        {
            name: "Malipo Agents",
        },
    ],

    creator: "Malipo Agents",
    publisher: "Malipo Agents",

    icons: {
        icon: [
            { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
            { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        ],
        apple: "/icons/apple-touch-icon.png",
        other: [
            {
                rel: "mask-icon",
                url: "/icons/android-chrome-192x192.png",
                color: "#00C853",
            },
        ],
    },

    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-snippet": -1,
            "max-image-preview": "large",
            "max-video-preview": -1,
        },
    },

    openGraph: {
        type: "website",
        url: "https://homes.aistartupclub.com",
        title: "Malipo Agents — Smart Property Management",
        description:
            "Manage tenants, collect rent, and track payments from one simple dashboard.",
        siteName: "Malipo Agents",
        images: [
            {
                url: "https://homes.aistartupclub.com/og-image.png",
                width: 1200,
                height: 630,
                alt: "Malipo Agents — Smart Property Management",
            },
        ],
    },

    twitter: {
        card: "summary_large_image",
        title: "Malipo Agents — Smart Property Management",
        description:
            "The easiest way for landlords and agents to manage tenants and rent payments.",
        images: ["https://homes.aistartupclub.com/og-image.png"],
        creator: "@malipoagents",
    },

    category: "real estate",
    alternates: {
        canonical: "https://homes.aistartupclub.com/",
    },

    appleWebApp: {
        capable: true,
        title: "Malipo Agents",
        statusBarStyle: "black-translucent",
    },

    formatDetection: {
        telephone: false,
    },
};


export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background`+ "dotted-bg"}>
        <AuthProvider>
            <ThemeProvider defaultTheme="system" storageKey="theme-pref">
                <ApartmentProvider>
                    <Suspense fallback={null}>
                        <div className="flex h-screen">
                            <SidebarNav />

                            <main className="flex-1 overflow-auto dotted-bg">
                                <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-background px-4">
                                    <div className="flex justify-between ">
                                        <div className="flex items-center gap-2">
                                            <SidebarTrigger />
                                        </div>

                                        <ApartmentSelector />
                                    </div>

                                    <ThemeToggle />
                                </header>

                                {children}
                            </main>
                        </div>

                        <Analytics />
                    </Suspense>

                    <NotificationDisplay />
                    <AuthErrorHandlerWrapper />
                    <InstallPrompt />
                    <MobileBottomNav />
                </ApartmentProvider>
            </ThemeProvider>
        </AuthProvider>

        <Script
            id="structured-data"
            type="application/ld+json"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "SoftwareApplication",
                    name: "Malipo Agents",
                    applicationCategory: "BusinessApplication",
                    operatingSystem: "Web",
                    description:
                        "Smart property and tenant management platform for landlords and agents.",
                    url: "https://homes.aistartupclub.com",
                    creator: {
                        "@type": "Organization",
                        name: "Malipo Agents",
                        url: "https://homes.aistartupclub.com",
                    },
                    offers: {
                        "@type": "Offer",
                        price: "0",
                        priceCurrency: "KES",
                    },
                }),
            }}
        />

        </body>
        </html>
    )
}
