import { NextResponse } from "next/server"

const BASE_URL = "https://crackmode.aistartupclub.com"

type SitemapRoute = {
    path: string
    priority: number
    changefreq: "daily" | "weekly" | "monthly"
    index?: boolean
}

const routes: SitemapRoute[] = [
    // Public marketing pages
    { path: "", priority: 1.0, changefreq: "daily" },
    { path: "/home", priority: 0.9, changefreq: "weekly" },
    { path: "/share", priority: 0.8, changefreq: "weekly" },

    // Discovery / onboarding
    { path: "/join-apartment", priority: 0.8, changefreq: "weekly" },

    // Core platform (indexable but lower priority)
    { path: "/apartments", priority: 0.7, changefreq: "weekly" },
    { path: "/houses", priority: 0.7, changefreq: "weekly" },

    // Tenant / landlord features (usually authenticated)
    { path: "/payments", priority: 0.6, changefreq: "monthly" },
    { path: "/tenants", priority: 0.6, changefreq: "monthly" },

    // Auth & internal pages — explicitly excluded from indexing
    { path: "/signin", priority: 0.3, changefreq: "monthly", index: false },
    { path: "/account", priority: 0.3, changefreq: "monthly", index: false },
    { path: "/dashboard", priority: 0.3, changefreq: "monthly", index: false },
    { path: "/admin", priority: 0.1, changefreq: "monthly", index: false },
]

export async function GET() {
    const now = new Date().toISOString()

    const urls = routes
        .filter(route => route.index !== false)
        .map(
            route => `
	<url>
		<loc>${BASE_URL}${route.path}</loc>
		<lastmod>${now}</lastmod>
		<changefreq>${route.changefreq}</changefreq>
		<priority>${route.priority.toFixed(1)}</priority>
	</url>`
        )
        .join("")

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`

    return new NextResponse(xml, {
        headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
        },
    })
}
