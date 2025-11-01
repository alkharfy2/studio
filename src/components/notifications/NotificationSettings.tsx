'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useFCM } from '@/hooks/use-fcm';
import {
  Bell,
  BellOff,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Info,
} from 'lucide-react';

export function NotificationSettings() {
  const {
    isSupported,
    hasPermission,
    token,
    isLoading,
    error,
    permissionStatus,
    requestPermission,
    disableNotifications,
  } = useFCM();

  // Get status badge
  const getStatusBadge = () => {
    if (isLoading) {
      return (
        <Badge variant="secondary" className="gap-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          جاري التحميل...
        </Badge>
      );
    }

    if (!isSupported) {
      return (
        <Badge variant="destructive" className="gap-2">
          <XCircle className="h-3 w-3" />
          غير مدعوم
        </Badge>
      );
    }

    if (hasPermission && token) {
      return (
        <Badge variant="default" className="bg-green-600 gap-2">
          <CheckCircle2 className="h-3 w-3" />
          مفعّل
        </Badge>
      );
    }

    if (permissionStatus.permission === 'denied') {
      return (
        <Badge variant="destructive" className="gap-2">
          <XCircle className="h-3 w-3" />
          محظور
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="gap-2">
        <BellOff className="h-3 w-3" />
        غير مفعّل
      </Badge>
    );
  };

  // Get alert for current status
  const getStatusAlert = () => {
    if (!isSupported) {
      return (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>المتصفح غير مدعوم</AlertTitle>
          <AlertDescription>
            متصفحك الحالي لا يدعم الإشعارات الفورية. يرجى استخدام متصفح حديث مثل Chrome أو
            Firefox أو Safari.
          </AlertDescription>
        </Alert>
      );
    }

    if (permissionStatus.permission === 'denied') {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>الإشعارات محظورة</AlertTitle>
          <AlertDescription>
            لقد قمت بحظر الإشعارات لهذا الموقع. لتفعيلها:
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>انقر على أيقونة القفل في شريط العنوان</li>
              <li>ابحث عن إعدادات الإشعارات</li>
              <li>قم بتغيير الإعداد إلى "السماح"</li>
              <li>أعد تحميل الصفحة</li>
            </ol>
          </AlertDescription>
        </Alert>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>خطأ</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    if (hasPermission && token) {
      return (
        <Alert>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle>الإشعارات مفعّلة</AlertTitle>
          <AlertDescription>
            سيتم إرسال إشعارات فورية إليك عند حدوث تحديثات على المهام أو الطلبات.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>تفعيل الإشعارات</AlertTitle>
        <AlertDescription>
          قم بتفعيل الإشعارات الفورية للحصول على تنبيهات عند:
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>تعيين مهمة جديدة لك</li>
            <li>تحديث حالة المهمة</li>
            <li>تسليم العمل من المصمم</li>
            <li>إضافة تعليق على مهمتك</li>
          </ul>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              إعدادات الإشعارات
            </CardTitle>
            <CardDescription>إدارة الإشعارات الفورية (Push Notifications)</CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Status Alert */}
        {getStatusAlert()}

        {/* Token Info (for debugging) */}
        {token && process.env.NODE_ENV === 'development' && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">FCM Token (Development Only):</p>
            <code className="text-xs break-all">{token}</code>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {!hasPermission && isSupported && permissionStatus.permission !== 'denied' && (
            <Button
              onClick={requestPermission}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  جاري التفعيل...
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  تفعيل الإشعارات
                </>
              )}
            </Button>
          )}

          {hasPermission && token && (
            <Button
              onClick={disableNotifications}
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  جاري التعطيل...
                </>
              ) : (
                <>
                  <BellOff className="h-4 w-4 mr-2" />
                  تعطيل الإشعارات
                </>
              )}
            </Button>
          )}
        </div>

        {/* Info Box */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
            <Info className="h-4 w-4" />
            معلومات مهمة
          </h4>
          <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
            <li>• الإشعارات تعمل فقط عندما يكون التطبيق مفتوحاً أو في الخلفية</li>
            <li>• تأكد من تفعيل الإشعارات في إعدادات المتصفح</li>
            <li>• قد لا تعمل الإشعارات في وضع التصفح الخاص</li>
            <li>• يمكنك تعطيل الإشعارات في أي وقت</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
