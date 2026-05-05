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
    icon: "/images/Imagotipo1.png",
    badge: "/images/Imagotipo1.png",
    tag: data.tag || "default",
    renotify: true,
    data: { url: data.url || "/dashboard" },
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";

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
