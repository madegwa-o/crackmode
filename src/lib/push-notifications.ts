import webpush from "web-push"

// Configure web-push with VAPID keys
webpush.setVapidDetails(
    process.env.VAPID_EMAIL!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
)

export interface PushSubscription {
    endpoint: string
    keys: {
        p256dh: string
        auth: string
    }
}

export interface NotificationPayload {
    title: string
    body: string
    icon?: string
    badge?: string
    data?: Record<string, unknown>
    actions?: Array<{
        action: string
        title: string
    }>
}

export async function sendPushNotification(subscription: PushSubscription, payload: NotificationPayload) {
    try {
        await webpush.sendNotification(subscription, JSON.stringify(payload))
        return { success: true }
    } catch (error) {
        console.error("Error sending push notification:", error)
        return { success: false, error }
    }
}

export async function sendBulkPushNotifications(subscriptions: PushSubscription[], payload: NotificationPayload) {
    const results = await Promise.allSettled(subscriptions.map((sub) => sendPushNotification(sub, payload)))

    const successful = results.filter((r) => r.status === "fulfilled").length
    const failed = results.filter((r) => r.status === "rejected").length

    return { successful, failed, total: subscriptions.length }
}
