import type { Metadata } from "next"
import Image from "next/image"
import ShareComponent from "@/components/share-component";

const BASE_URL = "https://homes.aistartupclub.com"

export const metadata: Metadata = {
    title: "Share Malipo Agents | Smart Property Management",
    description:
        "Discover Malipo Agents — a modern platform for managing apartments, tenants, and rental payments with ease.",
    keywords: [
        "Malipo Agents",
        "property management",
        "apartments",
        "rent collection",
        "landlords",
        "tenants",
        "Kenya real estate",
    ],
    authors: [{ name: "Malipo Agents" }],
    creator: "Malipo Agents",
    publisher: "Malipo Agents",
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
    openGraph: {
        type: "website",
        locale: "en_KE",
        url: `${BASE_URL}/share`,
        siteName: "Malipo Agents",
        title: "Malipo Agents – Smart Property Management",
        description:
            "Manage apartments, tenants, and rent payments from one powerful platform.",
        images: [
            {
                url: `${BASE_URL}/logo.png`,
                width: 1200,
                height: 630,
                alt: "Malipo Agents logo",
                type: "image/png",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Malipo Agents – Smart Property Management",
        description:
            "Manage apartments, tenants, and rent payments from one powerful platform.",
        images: `${BASE_URL}/logo.png`,
    },
    alternates: {
        canonical: `${BASE_URL}/share`,
    },
    category: "Real Estate",
}

export default function SharePage() {
    return (
        <main className="container max-w-3xl mx-auto px-4 py-16 text-center">
            <div className="flex justify-center mb-6">
                <div className="bg-white p-4 rounded-lg shadow-md border-2 border-border">
                    <Image
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(BASE_URL)}`}
                        alt="Scan to visit Malipo Agents"
                        width={120}
                        height={120}
                        className="w-30 h-30"
                        priority
                    />
                    <p className="text-center text-xs text-muted-foreground mt-2">
                        Scan to visit
                    </p>
                </div>
            </div>

            <h1 className="text-3xl font-bold mb-4">
                Share Malipo Agents
            </h1>

            <p className="text-muted-foreground mb-8">
                Help others discover a smarter way to manage apartments,
                tenants, and rent payments.
            </p>

            <div className="flex justify-center">
                <ShareComponent variant="buttons" />
            </div>
        </main>
    )
}