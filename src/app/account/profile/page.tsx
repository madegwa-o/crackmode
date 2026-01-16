"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { User, CreditCard, History, Settings, Bell, Shield, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import {usePushNotifications} from "@/hooks/use-push-notifications";

export default function AccountPage() {
	const { data: session, status, update } = useSession()
	const { isSupported, isSubscribed, subscribeToPush, unsubscribeFromPush } = usePushNotifications();
	const router = useRouter()
	const [emailNotifications, setEmailNotifications] = useState(true)
	const [newPassword, setNewPassword] = useState("")
	const [confirmPassword, setConfirmPassword] = useState("")
	const [passwordError, setPasswordError] = useState<string | null>(null)
	const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
	const [isSettingPassword, setIsSettingPassword] = useState(false)
	const [isProcessingPush, setIsProcessingPush] = useState(false);

	// Phone number state
	const [phoneNumber, setPhoneNumber] = useState("")
	const [isLoadingPhone, setIsLoadingPhone] = useState(true)
	const [isUpdatingPhone, setIsUpdatingPhone] = useState(false)
	const [phoneError, setPhoneError] = useState<string | null>(null)
	const [phoneSuccess, setPhoneSuccess] = useState<string | null>(null)


	useEffect(() => {
		if (status === "unauthenticated") {
			router.push("/signin?callbackUrl=/account")
		}
	}, [status, router])

	// Fetch phone number on mount
	useEffect(() => {
		const fetchPhoneNumber = async () => {
			if (status === "authenticated") {
				setIsLoadingPhone(true)
				try {
					const response = await fetch("/api/user/update-phone")
					if (response.ok) {
						const data = await response.json()
						setPhoneNumber(data.phone || "")
					}
				} catch (error) {
					console.error("Error fetching phone number:", error)
				} finally {
					setIsLoadingPhone(false)
				}
			}
		}

		fetchPhoneNumber()
	}, [status])

	const handleSetPassword = async (e: React.FormEvent) => {
		e.preventDefault()
		setPasswordError(null)
		setPasswordSuccess(null)

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
			const response = await fetch("/api/user/set-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ password: newPassword }),
			})

			const data = await response.json()

			if (!response.ok) {
				setPasswordError(data.error || "Failed to set password")
			} else {
				setPasswordSuccess("Password set successfully! You can now sign in with email and password.")
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

	const handleUpdatePhone = async (e: React.FormEvent) => {
		e.preventDefault()
		setPhoneError(null)
		setPhoneSuccess(null)
		setIsUpdatingPhone(true)

		try {
			const response = await fetch("/api/user/update-phone", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ phone: phoneNumber }),
			})

			const data = await response.json()

			if (!response.ok) {
				setPhoneError(data.error || "Failed to update phone number")
			} else {
				setPhoneSuccess("Phone number updated successfully!")
				// Update session to reflect new phone number
				setPhoneNumber(data.phone || "")
				await update()
			}
		} catch (error) {
			console.error("Phone update error:", error)
			setPhoneError("An error occurred. Please try again.")
		} finally {
			setIsUpdatingPhone(false)
		}
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
		<main className="container px-4 py-8 max-w-5xl mx-auto">
			<div className="mb-8">
				<h1 className="font-bold text-3xl mb-2">My Profile</h1>
				<p className="text-muted-foreground">Manage your profile Here.</p>
			</div>


					<Card className="gap-1 m-1">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<User className="h-5 w-5" />
								Profile Information
							</CardTitle>
							<CardDescription>Update your personal information and contact details.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="name">Full Name</Label>
								<Input id="name" defaultValue={session.user?.name || ""} />
							</div>
							<div className="space-y-2">
								<Label htmlFor="email">Email Address</Label>
								<Input id="email" type="email" defaultValue={session.user?.email || ""} disabled />
							</div>

							{phoneError && (
								<Alert variant="destructive">
									<AlertDescription>{phoneError}</AlertDescription>
								</Alert>
							)}
							{phoneSuccess && (
								<Alert className="border-primary bg-primary/10">
									<AlertDescription className="text-primary">{phoneSuccess}</AlertDescription>
								</Alert>
							)}

							<form onSubmit={handleUpdatePhone} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="phone">Phone Number</Label>
									<div className="relative">
										<Input
											id="phone"
											type="tel"
											placeholder="070-000-0000"
											value={phoneNumber}
											onChange={(e) => setPhoneNumber(e.target.value)}
											disabled={isUpdatingPhone || isLoadingPhone}
										/>
										{isLoadingPhone && (
											<div className="absolute right-3 top-1/2 -translate-y-1/2">
												<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
											</div>
										)}
									</div>
								</div>
								<Button type="submit" disabled={isUpdatingPhone || isLoadingPhone}>
									{isUpdatingPhone ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Updating...
										</>
									) : (
										"Save Changes"
									)}
								</Button>
							</form>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Shield className="h-5 w-5" />
								Set Up Password
							</CardTitle>
							<CardDescription>
								Set up a password to enable email/password sign-in as an alternative to Google OAuth.
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
									<AlertDescription className="text-primary">{passwordSuccess}</AlertDescription>
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
										placeholder="Re-enter your password"
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										disabled={isSettingPassword}
										required
									/>
								</div>
								<Button type="submit" disabled={isSettingPassword}>
									{isSettingPassword ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Setting Password...
										</>
									) : (
										"Set Password"
									)}
								</Button>
							</form>
						</CardContent>
					</Card>

		</main>
	)
}