// Fill in your Firebase web config (Project settings → General).
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js"
);
firebase.initializeApp({ apiKey: "", projectId: "", messagingSenderId: "", appId: "" });
const messaging = firebase.messaging();

messaging.onBackgroundMessage(({ data }) => {
  self.registration.showNotification(data.title, {
    body: data.body,
    data,
    actions: [
      { action: "approve", title: "✓ Approve" },
      { action: "reject", title: "✕ Reject" },
      { action: "receipt", title: "⬇ Receipt" },
    ],
  });
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(clients.openWindow(`/?ticket=${e.notification.data.ticketId}&do=${e.action || "open"}`));
});
