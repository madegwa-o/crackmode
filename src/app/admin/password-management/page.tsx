"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Shield, Search, Loader2, Key } from "lucide-react"
import { Role, hasRole } from "@/lib/roles"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface UserSearchResult {
    email: string
    name: string
    phone?: string
    roles: Role[]
}

export default function AdminPasswordManagement() {
    const { data: session, status } = useSession()
    const router = useRouter()

    const [searchEmail, setSearchEmail] = useState("")
    const [foundUser, setFoundUser] = useState<UserSearchResult | null>(null)
    const [isSearching, setIsSearching] = useState(false)
    const [searchError, setSearchError] = useState<string | null>(null)

    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isSettingPassword, setIsSettingPassword] = useState(false)
    const [passwordError, setPasswordError] = useState<string | null>(null)
    const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

    /* Authorization check */
    useEffect(() => {
        if (status === "loading") return

        if (!session) {
            router.replace("/")
            return
        }

        const roles = session.user.roles ?? [Role.USER]
        if (!hasRole(roles, Role.ADMIN)) {
            router.replace("/")
            return
        }
    }, [session, status, router])

    const handleSearchUser = async (e: React.FormEvent) => {
        e.preventDefault()
        setSearchError(null)
        setFoundUser(null)
        setPasswordError(null)
        setPasswordSuccess(null)
        setNewPassword("")
        setConfirmPassword("")

        if (!searchEmail) {
            setSearchError("Please enter an email address")
            return
        }

        setIsSearching(true)

        try {
            const response = await fetch(`/api/admin/users?search=${encodeURIComponent(searchEmail)}&limit=1`)
            const data = await response.json()

            if (!response.ok) {
                setSearchError(data.error || "Failed to search for user")
                return
            }

            if (data.users.length === 0) {
                setSearchError("No user found with that email address")
                return
            }

            const user = data.users[0]
            setFoundUser({
                email: user.email,
                name: user.name,
                phone: user.phone,
                roles: user.roles
            })
        } catch (error) {
            console.error("Search error:", error)
            setSearchError("An error occurred while searching")
        } finally {
            setIsSearching(false)
        }
    }

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setPasswordError(null)
        setPasswordSuccess(null)

        if (!foundUser) {
            setPasswordError("Please search for a user first")
            return
        }

        if (newPassword.length < 6) {
            setPasswordError("Password must be at least 6 characters")
            return
        }

        if (newPassword !== confirmPassword) {
            setPasswordError("Passwords do not match")
            return
        }

        setIsSettingPassword(true)

        try {
            const response = await fetch("/api/admin/set-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: foundUser.email,
                    password: newPassword
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                setPasswordError(data.error || "Failed to set password")
            } else {
                setPasswordSuccess(`Password updated successfully for ${foundUser.email}`)
                setNewPassword("")
                setConfirmPassword("")
            }
        } catch (error) {
            console.error("Password setup error:", error)
            setPasswordError("An error occurred. Please try again.")
        } finally {
            setIsSettingPassword(false)
        }
    }

    const handleReset = () => {
        setSearchEmail("")
        setFoundUser(null)
        setSearchError(null)
        setPasswordError(null)
        setPasswordSuccess(null)
        setNewPassword("")
        setConfirmPassword("")
    }

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!session) {
        return null
    }

    return (
        <main className="container px-4 py-8 max-w-3xl mx-auto">
            <div className="mb-8">
                <h1 className="font-bold text-3xl mb-2 flex items-center gap-2">
                    <Key className="h-8 w-8" />
                    Password Management
                </h1>
                <p className="text-muted-foreground">
                    Search for users and set or change their passwords
                </p>
            </div>

            <div className="space-y-6">
                {/* Search Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="h-5 w-5" />
                            Search User
                        </CardTitle>
                        <CardDescription>
                            Enter the email address of the user whose password you want to manage
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {searchError && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertDescription>{searchError}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleSearchUser} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="search-email">Email Address</Label>
                                <Input
                                    id="search-email"
                                    type="email"
                                    placeholder="user@example.com"
                                    value={searchEmail}
                                    onChange={(e) => setSearchEmail(e.target.value)}
                                    disabled={isSearching}
                                    required
                                />
                            </div>
                            <Button type="submit" disabled={isSearching}>
                                {isSearching ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Searching...
                                    </>
                                ) : (
                                    <>
                                        <Search className="mr-2 h-4 w-4" />
                                        Search User
                                    </>
                                )}
                            </Button>
                        </form>

                        {foundUser && (
                            <div className="mt-6 p-4 border rounded-lg bg-muted/50">
                                <h3 className="font-semibold mb-2">User Found</h3>
                                <div className="space-y-1 text-sm">
                                    <p><span className="text-muted-foreground">Name:</span> {foundUser.name}</p>
                                    <p><span className="text-muted-foreground">Email:</span> {foundUser.email}</p>
                                    {foundUser.phone && (
                                        <p><span className="text-muted-foreground">Phone:</span> {foundUser.phone}</p>
                                    )}
                                    <div className="flex gap-2 flex-wrap mt-2">
                                        {foundUser.roles.map(role => (
                                            <span
                                                key={role}
                                                className="px-2 py-1 text-xs bg-primary/10 text-primary rounded"
                                            >
                                                {role}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Password Update Card - Only shown when user is found */}
                {foundUser && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Set New Password
                            </CardTitle>
                            <CardDescription>
                                Create a new password for {foundUser.email}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {passwordError && (
                                <Alert variant="destructive" className="mb-4">
                                    <AlertDescription>{passwordError}</AlertDescription>
                                </Alert>
                            )}
                            {passwordSuccess && (
                                <Alert className="mb-4 border-primary bg-primary/10">
                                    <AlertDescription className="text-primary">
                                        {passwordSuccess}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <form onSubmit={handleSetPassword} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="new-password">New Password</Label>
                                    <Input
                                        id="new-password"
                                        type="password"
                                        placeholder="At least 6 characters"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        disabled={isSettingPassword}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password">Confirm Password</Label>
                                    <Input
                                        id="confirm-password"
                                        type="password"
                                        placeholder="Re-enter the password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        disabled={isSettingPassword}
                                        required
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button type="submit" disabled={isSettingPassword}>
                                        {isSettingPassword ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Setting Password...
                                            </>
                                        ) : (
                                            <>
                                                <Shield className="mr-2 h-4 w-4" />
                                                Set Password
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleReset}
                                        disabled={isSettingPassword}
                                    >
                                        Reset Form
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Back to Admin Dashboard */}
                <Button
                    variant="outline"
                    onClick={() => router.push("/admin")}
                    className="w-full"
                >
                    ← Back to Admin Dashboard
                </Button>
            </div>
        </main>
    )
}