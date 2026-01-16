"use client";

import { Home, Building2, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function MobileBottomNav() {
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    const tabs = [
        {
            href: "/",
            icon: Home,
            label: "Home",
        },
        {
            href: "/join-apartment",
            icon: Building2,
            label: "Find Home",
        },
        {
            href: "/account",
            icon: User,
            label: "Account",
        },
    ];


    // Hide/show nav on scroll
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY > lastScrollY && currentScrollY > 80) {
                // Scrolling down & past threshold
                setIsVisible(false);
            } else {
                // Scrolling up
                setIsVisible(true);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY]);

    const isActive = (href: string) => {
        if (href === "/") {
            return pathname === "/";
        }
        return pathname?.startsWith(href);
    };

    return (
        <nav
            className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 ${
                isVisible ? "translate-y-0" : "translate-y-full"
            }`}
            style={{
                background: "var(--surface)",
                borderTop: "1px solid var(--border)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
            }}
        >
            <div className="flex items-center justify-around h-16 px-4 max-w-md mx-auto">
                {tabs.map((tab) => {
                    const active = isActive(tab.href);
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className="flex flex-col items-center justify-center flex-1 h-full relative group"
                        >
                            {/* Active indicator */}
                            {active && (
                                <div
                                    className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-12 rounded-full"
                                    style={{
                                        background: "var(--foreground)",
                                        animation: "slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                    }}
                                />
                            )}

                            {/* Icon container */}
                            <div
                                className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${
                                    active ? "scale-105" : "group-hover:scale-105"
                                }`}
                                style={{
                                    background: active ? "var(--surface-secondary)" : "transparent",
                                }}
                            >
                                <tab.icon
                                    className={`w-6 h-6 transition-all duration-200 ${
                                        active ? "" : "group-hover:scale-110"
                                    }`}
                                    style={{
                                        color: active ? "var(--foreground)" : "var(--text-secondary)",
                                        strokeWidth: active ? 2.5 : 2,
                                    }}
                                />
                            </div>

                            {/* Label */}
                            <span
                                className={`text-xs mt-1 font-medium transition-all duration-200 ${
                                    active ? "opacity-100" : "opacity-60"
                                }`}
                                style={{
                                    color: active ? "var(--text-primary)" : "var(--text-secondary)",
                                }}
                            >
								{tab.label}
							</span>
                        </Link>
                    );
                })}
            </div>

            {/* Safe area spacer for iOS devices */}
            <div className="h-[env(safe-area-inset-bottom)]" />
        </nav>
    );
}