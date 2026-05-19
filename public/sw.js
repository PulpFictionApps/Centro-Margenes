// Centro Márgenes — Service Worker
// Handles Web Push notifications and basic PWA caching.

self.addEventListener("push", function (event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Centro Márgenes", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Centro Márgenes";
  const options = {
    body: data.body || "",
    // Icon shown beside the notification (192×192 recommended)
    icon: "/images/Isotipo1.png",
    // Small monochrome badge shown in Android status bar
    badge: "/images/badge-96.svg",
    tag: data.tag || "default",
    // renotify: show the alert even if the same tag already exists
    renotify: true,
    // Keep the notification visible on lock screen until user interacts
    requireInteraction: true,
    // Vibration pattern (Android): buzz, pause, buzz
    vibrate: [200, 100, 200],
    // Silent false = play the default notification sound
    silent: false,
    data: { url: data.url || "/dashboard", gcalUrl: data.gcalUrl || null },
    // Quick-action buttons shown below the notification body
    actions: [
      { action: "open", title: "Ver cita" },
      ...(data.gcalUrl ? [{ action: "gcal", title: "\uD83D\uDCC5 Google Calendar" }] : []),
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  // Determine destination URL based on which action was tapped
  const url =
    event.action === "gcal"
      ? event.notification.data?.gcalUrl || "/dashboard"
      : event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        // Focus existing tab if open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // Otherwise open new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Basic install/activate lifecycle
self.addEventListener("install", function (event) {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(clients.claim());
});
