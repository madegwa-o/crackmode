

//  worker/index.js
self.addEventListener("push", (event) => {

    // Parse the JSON payload
     const data = event.data.json();
    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: "/icons/android-chrome-192x192.png",
            data: {
               url: data.url || "/"
           },
        })
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    // Get the URL from the notification data
    const urlToOpen = event.notification.data?.url || "/";

    event.waitUntil(
        self.clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((clientList) => {
                // Check if there's already a window open with this URL
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if (client.url === new URL(urlToOpen, self.location.origin).href && 'focus' in client) {
                        return client.focus();
                    }
                }
                // If no window is open, open a new one
                if (self.clients.openWindow) {
                    return self.clients.openWindow(urlToOpen);
                }
            })
    );
});