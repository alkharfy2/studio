// Firebase Cloud Messaging Service Worker
// This file runs in the background and handles push notifications

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyD8uKLqYqJw-Ep3Zj3oq3pFc7BRQYNzZ_o",
  authDomain: "cveeez.firebaseapp.com",
  projectId: "cveeez",
  storageBucket: "cveeez.firebasestorage.app",
  messagingSenderId: "518451695670",
  appId: "1:518451695670:web:c16a14c4b7e8d20cf9f9f9",
  measurementId: "G-38PV3FYGVL"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'إشعار جديد';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/logo.png',
    badge: '/logo.png',
    data: {
      url: payload.data?.link || '/dashboard/notifications',
      ...payload.data,
    },
    tag: payload.data?.notificationId || Date.now().toString(),
    requireInteraction: false,
    vibrate: [200, 100, 200],
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click:', event);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/dashboard/notifications';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window open
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
