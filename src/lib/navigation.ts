import { Role } from "@/lib/roles"
import type { Session } from "next-auth"
import {BellIcon, CoinsIcon, House, LockIcon, LucideIcon, Mailbox, Search, ShareIcon, UsersIcon} from "lucide-react"
import {
    LayoutGrid,
    Building2,
    Shield,
    Wrench,
    Home,
    LogIn,
    Settings,
    User,
    Bell,
    CreditCard,
} from "lucide-react"

export type NavItem = {
    name: string
    href: string
    icon: LucideIcon

    /**
     * undefined → public
     * [] → authenticated users
     * [roles] → role restricted
     */
    roles?: Role[]

    /**
     * Sublinks for nested navigation
     */
    subItems?: NavItem[]

    /**
     * If true, this item is dynamic (e.g., Sign In/Out)
     */
    isDynamic?: boolean
}

export const NAVIGATION: NavItem[] = [

// 🛡 Admin
    {
        name: "Admin",
        href: "/admin",
        icon: Shield,
        roles: [Role.ADMIN],
        subItems: [
            {
                name: "Make Admin",
                href: "/admin/users",
                icon: LayoutGrid,
                roles: [Role.ADMIN],
            },
            {
                name: "Password Management",
                href: "/admin/password-management",
                icon: LockIcon,
                roles: [Role.ADMIN],
            },
            {
                name: "Handle Notifications",
                href: "/admin/handle-notifications",
                icon: BellIcon,
                roles: [Role.ADMIN],
            },
            {
                name: "Handle Emails",
                href: "/admin/handle-emails",
                icon: Mailbox,
                roles: [Role.ADMIN],
            },
            {
                name: "Houses Management",
                href: "/admin/houses",
                icon: House,
                roles: [Role.ADMIN],
            },
            {
                name: "Users",
                href: "/admin/users",
                icon: UsersIcon,
                roles: [Role.ADMIN],
            },
            {
                name: "Payments",
                href: "/admin/payments",
                icon: CoinsIcon,
                roles: [Role.ADMIN],
            },
            {
                name: "Plots",
                href: "/admin/plots",
                icon: LayoutGrid,
                roles: [Role.ADMIN],
            },
        ],
    },

    // 🏢 Landlord
    {
        name: "Dashboard",
        href: "/",
        icon: LayoutGrid,
        roles: [Role.LANDLORD],
        subItems: [
            {
                name: "Create Plot",
                href: "/dashboard/new",
                icon: LayoutGrid,
                roles: [Role.LANDLORD],
            },
            {
                name: "Add/Remove Tenant",
                href: "/dashboard/add-remove",
                icon: House,
                roles: [Role.CARETAKER, Role.LANDLORD, Role.ADMIN],
            },
        ],
    },




    // 🧰 Caretaker
    {
        name: "Maintenance",
        href: "/caretaker/maintenance",
        icon: Wrench,
        roles: [Role.CARETAKER],
    },

    // 👤 Tenant
    {
        name: "My House",
        href: "/my-house",
        icon: Building2,
        roles: [Role.TENANT],
    },
    // 🔐 Apartment Based
    {
        name: "Houses",
        href: "/houses",
        icon: House,
        roles: [Role.CARETAKER, Role.LANDLORD, Role.ADMIN],
    },
    {
        name: "Tenants",
        href: "/tenants",
        icon: UsersIcon,
        roles: [Role.CARETAKER, Role.LANDLORD, Role.ADMIN],
    },
    {
        name: "Payments",
        href: "/payments",
        icon: CoinsIcon,
        roles: [Role.CARETAKER, Role.LANDLORD, Role.ADMIN],
    },
    // 🔐 Authenticated
    {
        name: "Find Vacancy",
        href: "/join-apartment",
        icon: Search,
        roles: [],
    },

    {
        name: "Account",
        href: "/account",
        icon: User,
        roles: [],
        subItems: [
            {
                name: "Profile",
                href: "/account/profile",
                icon: User,
                roles: [],
            },
            {
                name: "Notifications",
                href: "/account/notifications",
                icon: Bell,
                roles: [],
            },
        ],
    },

    // 🌍 Public
    {
        name: "Home",
        href: "/home",
        icon: Home,
    },
    {
        name: "Share The App",
        href: "/share",
        icon: ShareIcon,
    },
    {
        name: "Sign In",
        href: "/signin",
        icon: LogIn,
        isDynamic: true, // This will be replaced with Sign Out when authenticated
    },
]

/**
 * Get the default route for a user based on their roles
 */
export function getDefaultRoute(session: Session | null): string {
    if (!session?.user) return "/home"

    const userRoles = session.user.roles ?? []

    // Priority order: ADMIN → LANDLORD → CARETAKER → TENANT → default
    if (userRoles.includes(Role.ADMIN)) return "/admin"
    if (userRoles.includes(Role.LANDLORD)) return "/tenants"
    if (userRoles.includes(Role.CARETAKER)) return "/caretaker/maintenance"
    if (userRoles.includes(Role.TENANT)) return "/my-house"
    if (userRoles.includes(Role.USER)) return "/my-house"

    return "/"
}
