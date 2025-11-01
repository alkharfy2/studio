import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

// VAPID Key from environment variables
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

/**
 * Check if FCM is supported in the current browser
 */
export async function isFCMSupported(): Promise<boolean> {
  try {
    return await isSupported();
  } catch (error) {
    console.error('Error checking FCM support:', error);
    return false;
  }
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

/**
 * Get FCM token for the current device
 */
export async function getFCMToken(firebaseApp: any): Promise<string | null> {
  try {
    // Check if FCM is supported
    const supported = await isFCMSupported();
    if (!supported) {
      console.warn('FCM is not supported in this browser');
      return null;
    }

    // Check if VAPID key is configured
    if (!VAPID_KEY) {
      console.error('VAPID key is not configured. Please add NEXT_PUBLIC_FIREBASE_VAPID_KEY to .env');
      return null;
    }

    // Request permission
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission not granted:', permission);
      return null;
    }

    // Get messaging instance
    const messaging = getMessaging(firebaseApp);

    // Get token
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
    });

    if (token) {
      console.log('FCM Token obtained:', token.substring(0, 20) + '...');
      return token;
    } else {
      console.warn('No registration token available');
      return null;
    }
  } catch (error: any) {
    console.error('Error getting FCM token:', error);

    // Provide helpful error messages
    if (error.code === 'messaging/permission-blocked') {
      console.error('Notification permission is blocked. Please enable it in browser settings.');
    } else if (error.code === 'messaging/unsupported-browser') {
      console.error('This browser does not support Firebase Cloud Messaging.');
    }

    return null;
  }
}

/**
 * Save FCM token to Firestore for the current user
 */
export async function saveFCMToken(
  firestore: Firestore,
  userId: string,
  token: string
): Promise<boolean> {
  try {
    await updateDoc(doc(firestore, 'users', userId), {
      fcmToken: token,
      fcmTokenUpdatedAt: new Date(),
    });
    console.log('FCM token saved to Firestore');
    return true;
  } catch (error) {
    console.error('Error saving FCM token:', error);
    return false;
  }
}

/**
 * Initialize FCM and save token
 */
export async function initializeFCM(
  firebaseApp: any,
  firestore: Firestore,
  userId: string
): Promise<string | null> {
  try {
    // Get token
    const token = await getFCMToken(firebaseApp);

    if (!token) {
      return null;
    }

    // Save to Firestore
    await saveFCMToken(firestore, userId, token);

    return token;
  } catch (error) {
    console.error('Error initializing FCM:', error);
    return null;
  }
}

/**
 * Setup foreground message listener
 */
export function setupForegroundMessageListener(
  firebaseApp: any,
  onMessageReceived: (payload: any) => void
): (() => void) | null {
  try {
    const messaging = getMessaging(firebaseApp);

    // Listen for foreground messages
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);

      // Show notification
      if (payload.notification) {
        showNotification(
          payload.notification.title || 'إشعار جديد',
          payload.notification.body || '',
          payload.notification.icon,
          payload.data?.link
        );
      }

      // Call custom handler
      onMessageReceived(payload);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up foreground message listener:', error);
    return null;
  }
}

/**
 * Show browser notification
 */
export function showNotification(
  title: string,
  body: string,
  icon?: string,
  link?: string
): void {
  if (!('Notification' in window)) {
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  const notification = new Notification(title, {
    body,
    icon: icon || '/logo.png',
    badge: '/logo.png',
    tag: Date.now().toString(),
    requireInteraction: false,
  });

  // Handle notification click
  notification.onclick = () => {
    window.focus();
    if (link) {
      window.location.href = link;
    }
    notification.close();
  };

  // Auto close after 5 seconds
  setTimeout(() => {
    notification.close();
  }, 5000);
}

/**
 * Delete FCM token from Firestore
 */
export async function deleteFCMToken(
  firestore: Firestore,
  userId: string
): Promise<boolean> {
  try {
    await updateDoc(doc(firestore, 'users', userId), {
      fcmToken: null,
      fcmTokenUpdatedAt: null,
    });
    console.log('FCM token deleted from Firestore');
    return true;
  } catch (error) {
    console.error('Error deleting FCM token:', error);
    return false;
  }
}

/**
 * Check if user has enabled notifications
 */
export function hasNotificationPermission(): boolean {
  if (!('Notification' in window)) {
    return false;
  }
  return Notification.permission === 'granted';
}

/**
 * Get notification permission status
 */
export function getNotificationPermissionStatus(): {
  supported: boolean;
  permission: NotificationPermission | null;
  message: string;
} {
  if (!('Notification' in window)) {
    return {
      supported: false,
      permission: null,
      message: 'المتصفح لا يدعم الإشعارات',
    };
  }

  const permission = Notification.permission;

  if (permission === 'granted') {
    return {
      supported: true,
      permission,
      message: 'الإشعارات مفعّلة',
    };
  }

  if (permission === 'denied') {
    return {
      supported: true,
      permission,
      message: 'الإشعارات محظورة. يرجى تفعيلها من إعدادات المتصفح',
    };
  }

  return {
    supported: true,
    permission,
    message: 'يمكنك تفعيل الإشعارات',
  };
}
