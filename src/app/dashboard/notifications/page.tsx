'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useFirestore } from '@/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  updateDoc,
  doc,
  deleteDoc,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Notification } from '@/lib/types';
import { formatDistanceToNow, format } from 'date-fns';
import { ar } from 'date-fns/locale';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

const ITEMS_PER_PAGE = 10;

export default function NotificationsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'task' | 'payment' | 'system'>('all');
  const [currentPage, setCurrentPage] = useState(1);

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

    let filtered = notifications;

    // فلترة حسب التاب
    if (activeTab === 'unread') {
      filtered = filtered.filter((n) => !n.isRead);
    } else if (activeTab === 'read') {
      filtered = filtered.filter((n) => n.isRead);
    }

    // فلترة حسب النوع
    if (typeFilter !== 'all') {
      filtered = filtered.filter((n) => n.type === typeFilter);
    }

    return filtered;
  }, [notifications, activeTab, typeFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE);
  const paginatedNotifications = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredNotifications.slice(startIndex, endIndex);
  }, [filteredNotifications, currentPage]);

  const unreadCount = useMemo(() => {
    if (!notifications) return 0;
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const readCount = useMemo(() => {
    if (!notifications) return 0;
    return notifications.filter((n) => n.isRead).length;
  }, [notifications]);

  // إعادة تعيين الصفحة عند تغيير الفلاتر
  const handleTabChange = (value: string) => {
    setActiveTab(value as 'all' | 'unread' | 'read');
    setCurrentPage(1);
  };

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value as 'all' | 'task' | 'payment' | 'system');
    setCurrentPage(1);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    if (!firestore) return;

    try {
      await updateDoc(doc(firestore, 'notifications', notificationId), {
        isRead: true,
      });
      toast({
        title: 'تم',
        description: 'تم تعليم الإشعار كمقروء',
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل تعليم الإشعار كمقروء',
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!firestore || !notifications) return;

    const unreadNotifications = notifications.filter((n) => !n.isRead);

    if (unreadNotifications.length === 0) {
      toast({
        title: 'تنبيه',
        description: 'لا توجد إشعارات غير مقروءة',
      });
      return;
    }

    try {
      const batch = writeBatch(firestore);
      unreadNotifications.forEach((n) => {
        const notifRef = doc(firestore, 'notifications', n.id);
        batch.update(notifRef, { isRead: true });
      });
      await batch.commit();

      toast({
        title: 'تم بنجاح',
        description: `تم تعليم ${unreadNotifications.length} إشعار كمقروء`,
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل تعليم الإشعارات كمقروءة',
      });
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    if (!firestore) return;

    try {
      await deleteDoc(doc(firestore, 'notifications', notificationId));
      toast({
        title: 'تم الحذف',
        description: 'تم حذف الإشعار بنجاح',
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل حذف الإشعار',
      });
    }
  };

  const handleDeleteAll = async () => {
    if (!firestore || !notifications) return;

    if (!confirm(`هل أنت متأكد من حذف جميع الإشعارات (${notifications.length})؟`)) {
      return;
    }

    try {
      const batch = writeBatch(firestore);
      notifications.forEach((n) => {
        const notifRef = doc(firestore, 'notifications', n.id);
        batch.delete(notifRef);
      });
      await batch.commit();

      toast({
        title: 'تم الحذف',
        description: `تم حذف ${notifications.length} إشعار بنجاح`,
      });
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل حذف الإشعارات',
      });
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
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'payment':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'system':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold">الإشعارات</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `لديك ${unreadCount} إشعار غير مقروء`
              : 'لا توجد إشعارات غير مقروءة'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead} variant="outline">
              <CheckCheck className="h-4 w-4 mr-2" />
              تعليم الكل كمقروء
            </Button>
          )}
          {notifications && notifications.length > 0 && (
            <Button onClick={handleDeleteAll} variant="outline" className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              حذف الكل
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">الفلترة:</span>
            </div>
            <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="نوع الإشعار" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="task">مهام</SelectItem>
                <SelectItem value="payment">دفعات</SelectItem>
                <SelectItem value="system">نظام</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="all">الكل ({notifications?.length || 0})</TabsTrigger>
          <TabsTrigger value="unread">غير المقروءة ({unreadCount})</TabsTrigger>
          <TabsTrigger value="read">المقروءة ({readCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {paginatedNotifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">
                  {activeTab === 'unread'
                    ? 'لا توجد إشعارات غير مقروءة'
                    : activeTab === 'read'
                    ? 'لا توجد إشعارات مقروءة'
                    : 'لا توجد إشعارات'}
                </p>
                {typeFilter !== 'all' && (
                  <p className="text-sm mt-2">جرب تغيير نوع الفلترة</p>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Notifications List */}
              {paginatedNotifications.map((notification) => {
                const NotificationWrapper = notification.link ? Link : 'div';
                const wrapperProps = notification.link ? { href: notification.link } : {};

                return (
                  <Card
                    key={notification.id}
                    className={cn(
                      'transition-all hover:shadow-md',
                      !notification.isRead && 'border-l-4 border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/20'
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
                            <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
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

                            <div className="flex items-center justify-between flex-wrap gap-2">
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
                                    مقروء
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
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t pt-4">
                  <div className="text-sm text-muted-foreground">
                    عرض {((currentPage - 1) * ITEMS_PER_PAGE) + 1} -{' '}
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredNotifications.length)} من{' '}
                    {filteredNotifications.length} إشعار
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                      السابق
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-10"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      التالي
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
