import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

let messaging: Messaging | null = null;

/**
 * Initialize Firebase Cloud Messaging
 */
export function initializeFCM(firebaseApp: any) {
  if (typeof window === 'undefined') {
    // Server-side, FCM not available
    return null;
  }

  try {
    messaging = getMessaging(firebaseApp);
    return messaging;
  } catch (error) {
    console.error('Error initializing FCM:', error);
    return null;
  }
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.log('Notifications not supported');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted');
      return true;
    } else {
      console.log('Notification permission denied');
      return false;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

/**
 * Get FCM token for this device
 */
export async function getFCMToken(vapidKey: string): Promise<string | null> {
  if (!messaging) {
    console.log('Messaging not initialized');
    return null;
  }

  try {
    const token = await getToken(messaging, { vapidKey });
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

/**
 * Save FCM token to user document in Firestore
 */
export async function saveFCMTokenToUser(
  firestore: Firestore,
  userId: string,
  token: string
): Promise<void> {
  try {
    await updateDoc(doc(firestore, 'users', userId), {
      fcmToken: token,
      fcmTokenUpdatedAt: new Date(),
    });
    console.log('FCM token saved to user document');
  } catch (error) {
    console.error('Error saving FCM token:', error);
  }
}

/**
 * Setup FCM for a user
 * Call this after user logs in
 */
export async function setupFCM(
  firebaseApp: any,
  firestore: Firestore,
  userId: string,
  vapidKey: string
): Promise<void> {
  // Initialize FCM
  const fcm = initializeFCM(firebaseApp);
  if (!fcm) return;

  // Request permission
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  // Get token
  const token = await getFCMToken(vapidKey);
  if (!token) return;

  // Save to Firestore
  await saveFCMTokenToUser(firestore, userId, token);

  // Listen for foreground messages
  setupForegroundListener();
}

/**
 * Listen for messages when app is in foreground
 */
export function setupForegroundListener(): void {
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);

    const notificationTitle = payload.notification?.title || 'إشعار جديد';
    const notificationBody = payload.notification?.body || '';

    // Show a browser notification
    if (Notification.permission === 'granted') {
      new Notification(notificationTitle, {
        body: notificationBody,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        data: {
          url: payload.data?.link || '/dashboard/notifications'
        }
      }).onclick = function(event) {
        event.preventDefault();
        const url = (event.target as any)?.data?.url || '/dashboard/notifications';
        window.open(url, '_blank');
      };
    }

    // You can also show a toast/snackbar in your app
    // dispatch({ type: 'SHOW_NOTIFICATION', payload });
  });
}

/**
 * Unsubscribe from FCM notifications
 */
export async function unsubscribeFCM(
  firestore: Firestore,
  userId: string
): Promise<void> {
  try {
    await updateDoc(doc(firestore, 'users', userId), {
      fcmToken: null,
      fcmTokenUpdatedAt: new Date(),
    });
    console.log('FCM token removed from user document');
  } catch (error) {
    console.error('Error removing FCM token:', error);
  }
}
