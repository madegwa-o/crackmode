"use client"

import { useSession } from "next-auth/react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import LoadingSkeleton from "@/components/loadingSkeleton"
import { getDefaultRoute } from "@/lib/navigation"
import {EditModal} from "@/components/home/EditUserModal";
import {Edit2} from "lucide-react";

export default function RootPage() {
    const { data: session, status } = useSession()
    const router = useRouter()

    useEffect(() => {
        if (status !== "authenticated") return
        if (!session?.user) return

        const roles = session.user.roles

        // Important: wait for roles (new OAuth users)
        if (!roles || roles.length === 0) return

        const target = getDefaultRoute(session)
        router.replace(target)
    }, [status, session, router])

    if (status === "loading") {
        return <LoadingSkeleton />
    }

    return (
        <div className="flex h-screen items-center justify-center bg-background">
            <LoadingSkeleton />
        </div>
    )
}

