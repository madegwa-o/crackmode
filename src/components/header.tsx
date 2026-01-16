"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { Menu, X, Moon, Sun, User, LogIn, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import { useSession, signOut } from "next-auth/react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Header() {
    const { data: session, status } = useSession()
    const menuRef = useRef<HTMLDivElement>(null)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const { theme, setTheme } = useTheme()

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false)
            }
        }

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isMenuOpen])

    const navLinks = [
        { label: "Home", href: "/" },
        { label: "Find Vacancy", href: "/join-apartment" },
        { label: "Account", href: "/account" }
    ]

    const handleSignOut = async () => {
        await signOut({ callbackUrl: "/" })
    }

    const getUserInitials = (name: string | null | undefined) => {
        if (!name) return "U"
        const names = name.split(" ")
        if (names.length >= 2) {
            return `${names[0][0]}${names[1][0]}`.toUpperCase()
        }
        return name.substring(0, 2).toUpperCase()
    }

    return (
        <header
            ref={menuRef}
            className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        >
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link href="/" className="flex items-center gap-2">
                    <span className="font-bold text-xl text-primary">Malipo Agents</span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-6">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-2">
                    {/* Theme Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="h-9 w-9"
                    >
                        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>

                    {/* User Avatar & Auth (Desktop) */}
                    <div className="hidden md:flex items-center gap-2">
                        {status === "loading" ? (
                            <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
                        ) : session?.user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage
                                                src={session.user.image || undefined}
                                                alt={session.user.name || "User"}
                                            />
                                            <AvatarFallback className="bg-primary text-primary-foreground">
                                                {getUserInitials(session.user.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {session.user.name}
                                            </p>
                                            <p className="text-xs leading-none text-muted-foreground">
                                                {session.user.email}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href="/account" className="cursor-pointer">
                                            <User className="mr-2 h-4 w-4" />
                                            My Account
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={handleSignOut}
                                        className="cursor-pointer text-destructive focus:text-destructive"
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Sign Out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/signin">
                                    <LogIn className="mr-2 h-4 w-4" />
                                    Sign In
                                </Link>
                            </Button>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden h-9 w-9"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        <span className="sr-only">Toggle menu</span>
                    </Button>
                </div>
            </div>

            {/* Mobile Navigation */}
            {isMenuOpen && (
                <div className="md:hidden border-t border-border/40 bg-background">
                    <nav className="container flex flex-col gap-4 px-4 py-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}

                        <div className="border-t border-border/40 pt-4 mt-2">
                            {status === "loading" ? (
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-muted rounded animate-pulse" />
                                        <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                                    </div>
                                </div>
                            ) : session?.user ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage
                                                src={session.user.image || undefined}
                                                alt={session.user.name || "User"}
                                            />
                                            <AvatarFallback className="bg-primary text-primary-foreground">
                                                {getUserInitials(session.user.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {session.user.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {session.user.email}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start text-destructive hover:text-destructive"
                                        onClick={() => {
                                            setIsMenuOpen(false)
                                            handleSignOut()
                                        }}
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Sign Out
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    variant="default"
                                    className="w-full justify-start"
                                    asChild
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <Link href="/signin">
                                        <LogIn className="mr-2 h-4 w-4" />
                                        Sign In
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </nav>
                </div>
            )}
        </header>
    )
}