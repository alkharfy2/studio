'use client';

import React, { useMemo, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, orderBy, updateDoc, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { Notification } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function NotificationsDropdown() {
  const { user } = useUser();
  const firestore = useFirestore();
  const previousUnreadCount = useRef(0);
  const [bellAnimation, setBellAnimation] = React.useState(false);

  const notificationsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: notifications, loading } = useCollection<Notification>(notificationsQuery);

  const unreadCount = useMemo(() => {
    if (!notifications) return 0;
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  // صوت التنبيه وanimation عند إشعار جديد
  useEffect(() => {
    if (unreadCount > previousUnreadCount.current && previousUnreadCount.current > 0) {
      // تشغيل صوت التنبيه
      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {
          // تجاهل الخطأ إذا لم يُسمح بالصوت
        });
      } catch (error) {
        console.log('Notification sound failed:', error);
      }

      // تفعيل animation
      setBellAnimation(true);
      setTimeout(() => setBellAnimation(false), 1000);
    }
    previousUnreadCount.current = unreadCount;
  }, [unreadCount]);

  const handleMarkAsRead = async (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  const handleDeleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full relative">
          <Bell
            className={cn(
              "h-5 w-5 transition-transform",
              bellAnimation && "animate-bounce"
            )}
          />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className={cn(
                "absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs",
                "animate-pulse"
              )}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 md:w-96">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>الإشعارات</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs"
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              تعليم الكل كمقروء
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            جاري التحميل...
          </div>
        ) : !notifications || notifications.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>لا توجد إشعارات</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            {notifications.slice(0, 20).map((notification) => {
              const NotificationWrapper = notification.link ? Link : 'div';
              const wrapperProps = notification.link
                ? { href: notification.link }
                : {};

              return (
                <NotificationWrapper
                  key={notification.id}
                  {...wrapperProps}
                  className={cn(
                    'block px-4 py-3 hover:bg-muted/50 transition-colors border-b cursor-pointer',
                    !notification.isRead && 'bg-blue-50/50'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            'text-sm',
                            !notification.isRead && 'font-semibold'
                          )}
                        >
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">
                          {formatTime(notification.createdAt)}
                        </p>
                        <div className="flex items-center gap-1">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => handleMarkAsRead(notification.id, e)}
                            >
                              <Check className="h-3 w-3" />
                              <span className="sr-only">تعليم كمقروء</span>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:text-destructive"
                            onClick={(e) => handleDeleteNotification(notification.id, e)}
                          >
                            <Trash2 className="h-3 w-3" />
                            <span className="sr-only">حذف</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </NotificationWrapper>
              );
            })}
          </ScrollArea>
        )}

        {notifications && notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Link href="/dashboard/notifications">
                <Button variant="ghost" className="w-full text-sm">
                  عرض جميع الإشعارات
                </Button>
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
