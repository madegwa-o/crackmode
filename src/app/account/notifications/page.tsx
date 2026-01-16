"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Bell, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useRouter } from "next/navigation"
import { usePushNotifications } from "@/hooks/use-push-notifications"

export default function AccountPage() {
	const { data: session, status } = useSession()
	const { isSupported, isSubscribed, subscribeToPush, unsubscribeFromPush } = usePushNotifications()
	const router = useRouter()

	const [emailNotifications, setEmailNotifications] = useState(true)
	const [isProcessingPush, setIsProcessingPush] = useState(false)

	useEffect(() => {
		if (status === "unauthenticated") {
			router.push("/signin?callbackUrl=/account/notifications")
		}
	}, [status, router])

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

	const handleToggle = async (checked: boolean) => {
		setIsProcessingPush(true)
		try {
			if (checked) {
				await subscribeToPush()
			} else {
				await unsubscribeFromPush()
			}
		} catch (err) {
			console.error("Notification toggle error:", err)
		} finally {
			setIsProcessingPush(false)
		}
	}

	return (
		<main className="container px-4 py-8 max-w-5xl mx-auto">
			<div className="mb-8">
				<h1 className="font-bold text-3xl mb-2">Notification Settings</h1>
				<p className="text-muted-foreground">
					Control how Malipo Agents keeps you informed about your properties and account.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Bell className="h-5 w-5" />
						Notifications
					</CardTitle>
					<CardDescription>
						Manage how you receive updates from Malipo Agents.
					</CardDescription>
				</CardHeader>

				<CardContent className="space-y-6">
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label htmlFor="email-notifications">Email Notifications</Label>
							<p className="text-muted-foreground text-sm">
								Receive rent updates, apartment activity, and important account messages.
							</p>
						</div>
						<Switch
							id="email-notifications"
							checked={emailNotifications}
							onCheckedChange={setEmailNotifications}
						/>
					</div>

					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label htmlFor="push-notifications">Push Notifications</Label>
							{!isSupported ? (
								<p className="text-muted-foreground text-sm">
									Push notifications are not supported on this device.
								</p>
							) : (
								<p className="text-muted-foreground text-sm">
									{isSubscribed
										? "You’ll receive real-time alerts about your apartments and account."
										: "Enable alerts for rent payments, property updates, and reminders."}
								</p>
							)}
						</div>

						{isProcessingPush ? (
							<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
						) : (
							<Switch
								id="push-notifications"
								disabled={!isSupported}
								checked={isSubscribed}
								onCheckedChange={handleToggle}
							/>
						)}
					</div>
				</CardContent>
			</Card>
		</main>
	)
}
