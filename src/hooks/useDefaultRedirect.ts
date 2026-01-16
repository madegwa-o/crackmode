// hooks/useDefaultRedirect.ts
"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { getDefaultRoute } from "@/lib/navigation"

/**
 * Hook to redirect users to their default route based on role
 * Use this in your root page or after sign in
 */
export function useDefaultRedirect(options?: { enabled?: boolean }) {
    const router = useRouter()
    const pathname = usePathname()
    const { data: session, status } = useSession()
    const enabled = options?.enabled ?? true

    useEffect(() => {
        if (!enabled || status === "loading") return

        const defaultRoute = getDefaultRoute(session)

        // Only redirect if we're at root and have a better default
        if (pathname === "/" && defaultRoute !== "/") {
            router.replace(defaultRoute)
        }
    }, [session, status, pathname, router, enabled])
}

/**
 * Component version - drop this into your page for automatic redirects
 */
export function DefaultRedirect() {
    useDefaultRedirect()
    return null
}
