'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, orderBy, updateDoc, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { Bell, Check, CheckCheck, Trash2, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Notification } from '@/lib/types';
import { formatDistanceToNow, format } from 'date-fns';
import { ar } from 'date-fns/locale';
import Link from 'next/link';

export default function NotificationsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  const notificationsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: notifications, loading } = useCollection<Notification>(notificationsQuery);

  const filteredNotifications = useMemo(() => {
    if (!notifications) return [];
    if (activeTab === 'unread') {
      return notifications.filter((n) => !n.isRead);
    }
    return notifications;
  }, [notifications, activeTab]);

  const unreadCount = useMemo(() => {
    if (!notifications) return 0;
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    if (!firestore) return;

    try {
      await updateDoc(doc(firestore, 'notifications', notificationId), {
        isRead: true,
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!firestore || !notifications) return;

    const unreadNotifications = notifications.filter((n) => !n.isRead);

    try {
      await Promise.all(
        unreadNotifications.map((n) =>
          updateDoc(doc(firestore, 'notifications', n.id), {
            isRead: true,
          })
        )
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    if (!firestore) return;

    try {
      await deleteDoc(doc(firestore, 'notifications', notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const formatTime = (timestamp: Timestamp | null | undefined) => {
    if (!timestamp) return 'غير محدد';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp as any);
      return formatDistanceToNow(date, { addSuffix: true, locale: ar });
    } catch (error) {
      return 'غير محدد';
    }
  };

  const formatFullDate = (timestamp: Timestamp | null | undefined) => {
    if (!timestamp) return 'غير محدد';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp as any);
      return format(date, 'PPpp', { locale: ar });
    } catch (error) {
      return 'غير محدد';
    }
  };

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'task':
        return '📋';
      case 'payment':
        return '💰';
      case 'system':
        return '⚙️';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type?: string) => {
    switch (type) {
      case 'task':
        return 'bg-blue-100 text-blue-800';
      case 'payment':
        return 'bg-green-100 text-green-800';
      case 'system':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">الإشعارات</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `لديك ${unreadCount} إشعار غير مقروء`
              : 'لا توجد إشعارات غير مقروءة'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead} variant="outline">
            <CheckCheck className="h-4 w-4 mr-2" />
            تعليم الكل كمقروء
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'unread')}>
        <TabsList>
          <TabsTrigger value="all">
            الكل ({notifications?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="unread">
            غير المقروءة ({unreadCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">
                  {activeTab === 'unread'
                    ? 'لا توجد إشعارات غير مقروءة'
                    : 'لا توجد إشعارات'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => {
              const NotificationWrapper = notification.link ? Link : 'div';
              const wrapperProps = notification.link
                ? { href: notification.link }
                : {};

              return (
                <Card
                  key={notification.id}
                  className={cn(
                    'transition-all hover:shadow-md',
                    !notification.isRead && 'border-l-4 border-l-blue-500 bg-blue-50/30'
                  )}
                >
                  <NotificationWrapper {...wrapperProps}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="text-4xl flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex items-center gap-2">
                              <h3
                                className={cn(
                                  'text-lg',
                                  !notification.isRead && 'font-bold'
                                )}
                              >
                                {notification.title}
                              </h3>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              )}
                            </div>
                            {notification.type && (
                              <Badge
                                variant="secondary"
                                className={cn('text-xs', getNotificationColor(notification.type))}
                              >
                                {notification.type === 'task'
                                  ? 'مهمة'
                                  : notification.type === 'payment'
                                  ? 'دفع'
                                  : 'نظام'}
                              </Badge>
                            )}
                          </div>

                          <p className="text-muted-foreground mb-3">{notification.message}</p>

                          {notification.body && (
                            <p className="text-sm text-muted-foreground mb-3 p-3 bg-muted/50 rounded">
                              {notification.body}
                            </p>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                              <span>{formatTime(notification.createdAt)}</span>
                              <span className="mx-2">•</span>
                              <span className="text-xs">{formatFullDate(notification.createdAt)}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              {!notification.isRead && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleMarkAsRead(notification.id);
                                  }}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  تعليم كمقروء
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="hover:text-destructive"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleDeleteNotification(notification.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                حذف
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </NotificationWrapper>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
