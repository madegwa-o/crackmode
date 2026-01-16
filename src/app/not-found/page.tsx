// app/not-found/page.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, Building2, User, ArrowRight, Construction } from "lucide-react";

export default function Page() {
    const quickLinks = [
        {
            href: "/",
            icon: Home,
            label: "Home",
            description: "Return to the homepage"
        },
        {
            href: "/join-apartment",
            icon: Building2,
            label: "Find a Home",
            description: "Browse available properties"
        },
        {
            href: "/account",
            icon: User,
            label: "My Account",
            description: "Manage your profile"
        }
    ];

    return (
        <main className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--background)' }}>
            <div className="max-w-2xl w-full text-center">
                {/* Icon and Error Code */}
                <div className="mb-8">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-6" style={{
                        background: 'var(--surface-secondary)',
                        border: '2px solid var(--border)'
                    }}>
                        <Construction className="w-12 h-12" style={{ color: 'var(--text-secondary)' }} />
                    </div>
                    <h1 className="text-6xl md:text-8xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                        404
                    </h1>
                    <h2 className="text-2xl md:text-3xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                        Page Not Found
                    </h2>
                    <p className="text-lg mb-2" style={{ color: 'var(--text-secondary)' }}>
                        This page either doesn&#39;t exist or is still under development.
                    </p>
                    <p className="text-base" style={{ color: 'var(--text-tertiary)' }}>
                        We&#39;re constantly improving Malipo Agents to serve you better.
                    </p>
                </div>

                {/* Quick Links */}
                <div className="mb-8">
                    <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>
                        WHERE WOULD YOU LIKE TO GO?
                    </h3>
                    <div className="grid gap-3">
                        {quickLinks.map((link, index) => (
                            <Link key={index} href={link.href}>
                                <Card className="shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer" style={{
                                    background: 'var(--surface)',
                                    border: '1px solid var(--border)'
                                }}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{
                                                background: 'var(--surface-secondary)'
                                            }}>
                                                <link.icon className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <div className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                                                    {link.label}
                                                </div>
                                                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                    {link.description}
                                                </div>
                                            </div>
                                            <ArrowRight className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Primary CTA */}
                <Link href="/public">
                    <Button
                        size="lg"
                        className="px-8 py-6 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                        style={{
                            background: 'var(--foreground)',
                            color: 'var(--background)'
                        }}
                    >
                        <Home className="w-5 h-5 mr-2" />
                        Back to Home
                    </Button>
                </Link>

                {/* Help Text */}
                <p className="mt-8 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    Need help? Contact us at{" "}
                    <a
                        href="mailto:malipotharura@gmail.com"
                        className="font-medium hover:underline"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        malipotharura@gmail.com
                    </a>
                </p>
            </div>
        </main>
    );
}