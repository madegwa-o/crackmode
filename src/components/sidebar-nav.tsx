"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { LogOut, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { signOut, useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { NAVIGATION, type NavItem, getDefaultRoute } from "@/lib/navigation"
import { canAccessRoute } from "@/lib/access"
import { useApartment } from "@/hooks/use-apartment-context"

function NavItemComponent({
                              item,
                              isActive,
                              hasSubItems,
                              isExpanded,
                              onToggle,
                              onNavigate,
                              level = 0,
                          }: {
    item: NavItem
    isActive: boolean
    hasSubItems: boolean
    isExpanded: boolean
    onToggle: () => void
    onNavigate?: () => void
    level?: number
}) {
    const Icon = item.icon
    const paddingLeft = level === 0 ? "px-3" : "pl-8 pr-3"

    if (hasSubItems) {
        return (
            <div>
                <button
                    onClick={onToggle}
                    className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-lg py-2 text-sm font-medium",
                        paddingLeft,
                        isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "hover:bg-sidebar-accent"
                    )}
                >
                    <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        {item.name}
                    </div>
                    {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                    ) : (
                        <ChevronRight className="h-4 w-4" />
                    )}
                </button>
            </div>
        )
    }

    return (
        <Link
            href={item.href}
            onClick={onNavigate}
            className={cn(
                "flex items-center gap-3 rounded-lg py-2 text-sm font-medium",
                paddingLeft,
                isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "hover:bg-sidebar-accent"
            )}
        >
            <Icon className="h-4 w-4" />
            {item.name}
        </Link>
    )
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    const { apartment, isLoaded } = useApartment()
    const { data: session, status } = useSession()
    const pathname = usePathname()
    const router = useRouter()
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
    const [isMounted, setIsMounted] = useState(false)

    // Redirect to default route on mount if at root
    useEffect(() => {
        if (status === "loading") return

        if (pathname === "/") {
            const defaultRoute = getDefaultRoute(session)
            if (defaultRoute !== "/") {
                router.replace(defaultRoute)
            }
        }
    }, [session, status, pathname, router])

    // Track client-side mount to prevent hydration mismatch
    useEffect(() => {
        setIsMounted(true)
    }, [])

    const getUserInitials = (name?: string | null) =>
        name
            ? name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
            : "U"

    const toggleExpanded = (href: string) => {
        setExpandedItems(prev => {
            const next = new Set(prev)
            if (next.has(href)) {
                next.delete(href)
            } else {
                next.add(href)
            }
            return next
        })
    }

    // Process navigation: filter by access and handle dynamic items
    const visibleNav = NAVIGATION.filter(item => {
        // Skip Sign In if authenticated (we'll add Sign Out separately)
        if (item.isDynamic && item.name === "Sign In" && session?.user) {
            return false
        }
        return canAccessRoute(item, session)
    }).map(item => {
        // Filter subItems by access
        if (item.subItems) {
            return {
                ...item,
                subItems: item.subItems.filter(subItem =>
                    canAccessRoute(subItem, session)
                ),
            }
        }
        return item
    })

    // Add Sign Out for authenticated users
    const navWithAuth = session?.user
        ? [
            ...visibleNav,
            // Sign Out is handled in the user section below, not in main nav
        ]
        : visibleNav

    // Determine what to display in the header
    // Only show apartment name after client mount to avoid hydration mismatch
    const displayName = isMounted && isLoaded && apartment?.name
        ? apartment.name
        : "Malipo Agents"

    return (
        <>
            <div className="flex h-14 items-center border-b px-6">
                <h1 className="text-lg font-semibold text-primary truncate" suppressHydrationWarning>
                    {displayName}
                </h1>
            </div>

            <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
                {navWithAuth.map(item => {
                    const hasSubItems = item.subItems && item.subItems.length > 0
                    const isExpanded = expandedItems.has(item.href)
                    const isActive =
                        pathname === item.href ||
                        pathname.startsWith(item.href + "/")

                    return (
                        <div key={item.href} className="space-y-1">
                            <NavItemComponent
                                item={item}
                                isActive={isActive}
                                hasSubItems={!!hasSubItems}
                                isExpanded={isExpanded}
                                onToggle={() => toggleExpanded(item.href)}
                                onNavigate={onNavigate}
                            />

                            {/* Render subItems if expanded */}
                            {hasSubItems && isExpanded && (
                                <div className="space-y-1 mt-1">
                                    {item.subItems!.map(subItem => {
                                        const subIsActive =
                                            pathname === subItem.href ||
                                            pathname.startsWith(subItem.href + "/")

                                        return (
                                            <NavItemComponent
                                                key={subItem.href}
                                                item={subItem}
                                                isActive={subIsActive}
                                                hasSubItems={false}
                                                isExpanded={false}
                                                onToggle={() => {}}
                                                onNavigate={onNavigate}
                                                level={1}
                                            />
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )
                })}
            </nav>

            <div className="border-t p-4">
                {status === "loading" ? null : session?.user ? (
                    <>
                        <div className="flex items-center gap-3 mb-3">
                            <Avatar>
                                <AvatarImage src={session.user.image ?? undefined} />
                                <AvatarFallback>
                                    {getUserInitials(session.user.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                                <p className="text-sm font-medium truncate">
                                    {session.user.name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {session.user.email}
                                </p>
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-2"
                            onClick={() => signOut()}
                        >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                        </Button>
                    </>
                ) : (
                    <Button asChild className="w-full justify-start gap-2" variant="ghost">
                        <Link href="/signin">
                            <span className="flex items-center gap-2">
                                Sign In
                            </span>
                        </Link>
                    </Button>
                )}
            </div>
        </>
    )
}

export function SidebarNav() {
    const [open, setOpen] = useState(false)

    return (
        <>
            {/* Mobile */}
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent side="left" className="w-64 p-0">
                    <VisuallyHidden>
                        <DialogTitle>Navigation Menu</DialogTitle>
                        <DialogDescription>
                            Main application navigation
                        </DialogDescription>
                    </VisuallyHidden>

                    <div className="flex h-full flex-col bg-sidebar-background">
                        <SidebarContent onNavigate={() => setOpen(false)} />
                    </div>
                </SheetContent>
            </Sheet>

            {/* Desktop */}
            <aside className="hidden md:flex w-64 flex-col border-r border-border/40 bg-sidebar-background">
                <SidebarContent />
            </aside>

            {/* Expose controller */}
            <SidebarController setOpen={setOpen} />
        </>
    )
}

/* This is just context-based control */
export function SidebarController({
                                      setOpen,
                                  }: {
    setOpen: (v: boolean) => void
}) {
    globalThis.__openSidebar = setOpen
    return null
}