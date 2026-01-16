"use client"

import React, {useEffect} from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, Loader2, Building2, ShieldCheck, Zap, Users } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {signIn, useSession} from "next-auth/react";
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import {DefaultRedirect} from "@/hooks/useDefaultRedirect";
import Image from "next/image"

export default function SignInPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isLoading, setIsLoading] = useState(false)
    const [isCredentialsLoading, setIsCredentialsLoading] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const callbackUrl = searchParams.get("callbackUrl") || "/"

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (status === "authenticated" && session) {
            router.push(callbackUrl)
        }
    }, [session, status, router, callbackUrl])

    const handleGoogleSignIn = async () => {
        setIsLoading(true)
        setError(null)
        try {
            await signIn("google", { callbackUrl })
        } catch (error) {
            console.error("Sign in error:", error)
            setError("Failed to sign in with Google. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleCredentialsSignIn = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsCredentialsLoading(true)
        setError(null)

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            })

            if (result?.error) {
                setError("Invalid email or password. Please try again.")
            } else if (result?.ok) {
                router.push(callbackUrl)
            }
        } catch (error) {
            console.error("Sign in error:", error)
            setError("An error occurred. Please try again.")
        } finally {
            setIsCredentialsLoading(false)
        }
    }

    if (!mounted || status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (session) {
        return ( <DefaultRedirect /> )
    }


    const features = [
        {
            icon: Building2,
            title: "Smart Management",
            desc: "Efficiency at your fingertips.",
        },
        {
            icon: ShieldCheck,
            title: "Secure Payments",
            desc: "Instant M-Pesa collection.",
        },
        {
            icon: Users,
            title: "Tenant Portal",
            desc: "Direct, clear communication.",
        },
    ]

    return (
        <div className="min-h-[calc(100vh-64px)] grid lg:grid-cols-2 bg-background dotted-bg">
            {/* Left Side - Hero Section */}
            {/*<div className="hidden lg:flex flex-col justify-center p-12 xl:p-24 relative overflow-hidden border-r border-border/40 bg-muted/20 ">*/}
            {/*    <div className="relative z-10 max-w-lg space-y-12 bg-background p-10">*/}
            {/*        <div className="space-y-6">*/}
            {/*            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">*/}
            {/*                <Zap className="w-3.5 h-3.5" />*/}
            {/*                <span>V2 Now Live</span>*/}
            {/*            </div>*/}
            {/*            <h2 className="text-5xl font-extrabold tracking-tight leading-[1.1]">*/}
            {/*                Manage with <span className="text-primary italic">Intelligence</span>.*/}
            {/*            </h2>*/}
            {/*            <p className="text-xl text-muted-foreground leading-relaxed max-w-md">*/}
            {/*                The modern standard for apartment management in Kenya. Simple, fast, and automated.*/}
            {/*            </p>*/}
            {/*        </div>*/}

            {/*        <div className="grid gap-4">*/}
            {/*            {features.map((feature, i) => (*/}
            {/*                <div*/}
            {/*                    key={i}*/}
            {/*                    className="flex gap-4 items-center p-4 rounded-2xl bg-card border border-border/50 shadow-sm transition-all hover:border-primary/30 group"*/}
            {/*                >*/}
            {/*                    <div className="p-2.5 rounded-xl bg-primary/5 text-primary transition-colors group-hover:bg-primary/10">*/}
            {/*                        <feature.icon className="w-5 h-5" />*/}
            {/*                    </div>*/}
            {/*                    <div>*/}
            {/*                        <h3 className="font-semibold">{feature.title}</h3>*/}
            {/*                        <p className="text-sm text-muted-foreground">{feature.desc}</p>*/}
            {/*                    </div>*/}
            {/*                </div>*/}
            {/*            ))}*/}
            {/*        </div>*/}
            {/*    </div>*/}
            {/*</div>*/}

            {/* Right Side - Form */}
            <div className="flex items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-[420px] space-y-8">
                    {/* Logo */}
                    <div className="flex justify-center lg:justify-start">
                        {/*<Image*/}
                        {/*    src="/logo.png"*/}
                        {/*    alt="Malipo Agents Logo"*/}
                        {/*    width={60}*/}
                        {/*    height={60}*/}
                        {/*    className="object-contain"*/}
                        {/*    priority*/}
                        {/*/>*/}
                        <div className="space-y-2 text-center lg:text-left">
                            <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
                            <p className="text-muted-foreground">Enter your credentials to access your dashboard</p>
                        </div>
                    </div>



                    <Card className="border-none shadow-2xl shadow-primary/5 bg-card/50 backdrop-blur-sm">
                        <CardContent className="p-8 space-y-6">
                            {error && (
                                <Alert
                                    variant="destructive"
                                    className="bg-destructive/10 border-none text-destructive animate-in fade-in zoom-in duration-300"
                                >
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <form onSubmit={handleCredentialsSignIn} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={isCredentialsLoading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={isCredentialsLoading}
                                    />
                                </div>
                                <Button type="submit" disabled={isCredentialsLoading} className="w-full bg-transparent" variant="outline">
                                    {isCredentialsLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Signing in...
                                        </>
                                    ) : (
                                        "Sign in with Email"
                                    )}
                                </Button>
                            </form>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <Separator className="bg-border/60" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-card px-4 text-muted-foreground font-medium tracking-wider">Secure Access</span>
                                </div>
                            </div>

                            <Button onClick={handleGoogleSignIn} disabled={isLoading} className="w-full" size="lg">
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                            <path
                                                fill="currentColor"
                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            />
                                            <path
                                                fill="currentColor"
                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            />
                                            <path
                                                fill="currentColor"
                                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                            />
                                            <path
                                                fill="currentColor"
                                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            />
                                        </svg>
                                        Continue with Google
                                    </>
                                )}
                            </Button>

                        </CardContent>
                    </Card>


                    <p className="text-center text-sm text-muted-foreground">
                        New to crack mode?{" "}
                        <button
                            onClick={handleGoogleSignIn}
                            disabled={isLoading}
                            className="text-primary hover:text-primary/80 underline-offset-4 hover:underline font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Create an account
                        </button>
                    </p>
                </div>
            </div>
        </div>
    )
}