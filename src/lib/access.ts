// lib/access.ts
import { Role } from "@/lib/roles"
import { NavItem } from "@/lib/navigation"
import { Session } from "next-auth"

export function canAccessRoute(
    item: NavItem,
    session: Session | null
) {
    // 🌍 Public
    if (item.roles === undefined) return true

    // 🔐 Requires authentication
    if (!session?.user) return false

    // 🔐 Any authenticated user
    if (item.roles.length === 0) return true

    // 🎭 Role-based (additive)
    const userRoles = session.user.roles ?? []
    return item.roles.some(role => userRoles.includes(role))
}
