'use client';

import { useEffect, useState, useCallback } from 'react';
import { useFirebaseApp, useUser, useFirestore } from '@/firebase';
import {
  initializeFCM,
  setupForegroundMessageListener,
  requestNotificationPermission,
  hasNotificationPermission,
  getNotificationPermissionStatus,
  deleteFCMToken,
} from '@/lib/fcm-service';
import { useToast } from './use-toast';

interface UseFCMReturn {
  isSupported: boolean;
  hasPermission: boolean;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  permissionStatus: {
    supported: boolean;
    permission: NotificationPermission | null;
    message: string;
  };
  requestPermission: () => Promise<boolean>;
  disableNotifications: () => Promise<boolean>;
}

export function useFCM(): UseFCMReturn {
  const firebaseApp = useFirebaseApp();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [isSupported, setIsSupported] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState(() =>
    getNotificationPermissionStatus()
  );

  // Initialize FCM when user is logged in
  useEffect(() => {
    const initialize = async () => {
      if (!user || !firebaseApp || !firestore) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Check if browser supports notifications
        const supported = 'Notification' in window;
        setIsSupported(supported);

        if (!supported) {
          setError('المتصفح لا يدعم الإشعارات');
          setIsLoading(false);
          return;
        }

        // Check current permission
        const permission = hasNotificationPermission();
        setHasPermission(permission);

        // If permission granted, initialize FCM
        if (permission) {
          const fcmToken = await initializeFCM(firebaseApp, firestore, user.uid);
          setToken(fcmToken);

          if (fcmToken) {
            console.log('FCM initialized successfully');
          }
        }

        // Update permission status
        setPermissionStatus(getNotificationPermissionStatus());
      } catch (err: any) {
        console.error('Error initializing FCM:', err);
        setError(err.message || 'فشل تفعيل الإشعارات');
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [user, firebaseApp, firestore]);

  // Setup foreground message listener
  useEffect(() => {
    if (!firebaseApp || !hasPermission || !token) {
      return;
    }

    const unsubscribe = setupForegroundMessageListener(firebaseApp, (payload) => {
      // Show toast notification
      if (payload.notification) {
        toast({
          title: payload.notification.title || 'إشعار جديد',
          description: payload.notification.body || '',
        });
      }

      // Refresh notifications list (you can add custom logic here)
      console.log('New notification received:', payload);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [firebaseApp, hasPermission, token, toast]);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!user || !firebaseApp || !firestore) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'يجب تسجيل الدخول أولاً',
      });
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const permission = await requestNotificationPermission();

      if (permission === 'granted') {
        setHasPermission(true);

        // Initialize FCM and get token
        const fcmToken = await initializeFCM(firebaseApp, firestore, user.uid);
        setToken(fcmToken);

        if (fcmToken) {
          toast({
            title: 'تم بنجاح',
            description: 'تم تفعيل الإشعارات بنجاح',
          });
          setPermissionStatus(getNotificationPermissionStatus());
          return true;
        } else {
          throw new Error('فشل الحصول على Token');
        }
      } else if (permission === 'denied') {
        setError('تم رفض الإشعارات. يرجى تفعيلها من إعدادات المتصفح');
        toast({
          variant: 'destructive',
          title: 'تم الرفض',
          description: 'يرجى تفعيل الإشعارات من إعدادات المتصفح',
        });
        setPermissionStatus(getNotificationPermissionStatus());
        return false;
      } else {
        setError('لم يتم تفعيل الإشعارات');
        return false;
      }
    } catch (err: any) {
      console.error('Error requesting permission:', err);
      setError(err.message || 'فشل تفعيل الإشعارات');
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: err.message || 'فشل تفعيل الإشعارات',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, firebaseApp, firestore, toast]);

  // Disable notifications
  const disableNotifications = useCallback(async (): Promise<boolean> => {
    if (!user || !firestore) {
      return false;
    }

    try {
      setIsLoading(true);

      const success = await deleteFCMToken(firestore, user.uid);

      if (success) {
        setToken(null);
        setHasPermission(false);
        toast({
          title: 'تم',
          description: 'تم تعطيل الإشعارات',
        });
        return true;
      }

      return false;
    } catch (err: any) {
      console.error('Error disabling notifications:', err);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل تعطيل الإشعارات',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, firestore, toast]);

  return {
    isSupported,
    hasPermission,
    token,
    isLoading,
    error,
    permissionStatus,
    requestPermission,
    disableNotifications,
  };
}
