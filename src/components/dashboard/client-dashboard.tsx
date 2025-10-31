'use client';

import React, { useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import type { Task, User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  Clock,
  CheckCircle,
  Download,
  Calendar,
  DollarSign,
  AlertCircle,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import { ar } from 'date-fns/locale';

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

export default function ClientDashboard({ user }: { user: User }) {
  const firestore = useFirestore();

  // جلب مهام العميل
  const tasksQuery = useMemo(() => {
    if (!firestore || !user) return null;
    // نستخدم clientPhone لأن العميل قد لا يكون لديه حساب مسجل
    // يمكن ربط المهام بالعميل عن طريق رقم الهاتف أو البريد الإلكتروني
    return query(
      collection(firestore, 'tasks'),
      where('clientPhone', '==', user.phoneNumber || '')
    );
  }, [firestore, user]);

  const { data: tasks, loading: tasksLoading } = useCollection<Task>(tasksQuery);

  // حساب الإحصائيات
  const statistics = useMemo(() => {
    if (!tasks) {
      return {
        totalTasks: 0,
        inProgress: 0,
        completed: 0,
        totalSpent: 0,
        pendingPayment: 0,
      };
    }

    const inProgress = tasks.filter((t) =>
      ['new', 'in_progress', 'submitted', 'to_review'].includes(t.status)
    ).length;
    const completed = tasks.filter((t) => t.status === 'done').length;
    const totalSpent = tasks
      .filter((t) => t.status === 'done')
      .reduce((sum, t) => sum + (t.financialPaid || 0), 0);
    const pendingPayment = tasks.reduce((sum, t) => sum + (t.financialRemaining || 0), 0);

    return {
      totalTasks: tasks.length,
      inProgress,
      completed,
      totalSpent,
      pendingPayment,
    };
  }, [tasks]);

  // ترتيب المهام حسب التاريخ
  const sortedTasks = useMemo(() => {
    if (!tasks) return [];
    return [...tasks].sort((a, b) => {
      const aDate = a.createdAt instanceof Timestamp ? a.createdAt.toDate() : (a.createdAt ? new Date(a.createdAt) : new Date());
      const bDate = b.createdAt instanceof Timestamp ? b.createdAt.toDate() : (b.createdAt ? new Date(b.createdAt) : new Date());
      return bDate.getTime() - aDate.getTime();
    });
  }, [tasks]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      submitted: 'bg-purple-100 text-purple-800',
      to_review: 'bg-orange-100 text-orange-800',
      done: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      new: 'جديد',
      in_progress: 'قيد التنفيذ',
      submitted: 'تم التسليم',
      to_review: 'قيد المراجعة',
      done: 'مكتمل',
      cancelled: 'ملغي',
    };
    return texts[status] || status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return FileText;
      case 'in_progress':
        return Clock;
      case 'submitted':
      case 'to_review':
        return Eye;
      case 'done':
        return CheckCircle;
      case 'cancelled':
        return AlertCircle;
      default:
        return FileText;
    }
  };

  if (tasksLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">لوحة تحكم العميل</h1>
          <p className="text-muted-foreground">
            مرحباً {user?.name}. تابع حالة مهامك وطلباتك.
          </p>
        </div>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي الطلبات</p>
                <p className="text-3xl font-bold mt-2">{statistics.totalTasks}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 text-blue-800">
                <FileText className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">قيد التنفيذ</p>
                <p className="text-3xl font-bold mt-2">{statistics.inProgress}</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-800">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">مكتمل</p>
                <p className="text-3xl font-bold mt-2">{statistics.completed}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100 text-green-800">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي المدفوع</p>
                <p className="text-2xl font-bold mt-2">
                  {statistics.totalSpent.toLocaleString()} جنيه
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100 text-green-800">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* رسالة ترحيبية */}
      {statistics.totalTasks === 0 && (
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
          <CardContent className="p-8 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-blue-600" />
            <h2 className="text-2xl font-bold mb-2">مرحباً بك في Cveeez!</h2>
            <p className="text-muted-foreground mb-4">
              لم تقم بإنشاء أي طلبات بعد. تواصل معنا لإنشاء سيرتك الذاتية الاحترافية.
            </p>
            <Button size="lg">تواصل معنا</Button>
          </CardContent>
        </Card>
      )}

      {/* قائمة المهام */}
      {statistics.totalTasks > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>طلباتي</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedTasks.map((task) => {
                const StatusIcon = getStatusIcon(task.status);
                const dueDate =
                  task.dueDate instanceof Timestamp ? task.dueDate.toDate() : (task.dueDate ? new Date(task.dueDate) : new Date());
                const isOverdue =
                  !['done', 'cancelled'].includes(task.status) && dueDate < new Date();

                return (
                  <Link key={task.id} href={`/dashboard/tasks/${task.id}`}>
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="p-3 rounded-full bg-blue-50">
                              <StatusIcon className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-bold text-lg">طلب #{task.taskId.slice(-8)}</h3>
                                <Badge className={getStatusColor(task.status)}>
                                  {getStatusText(task.status)}
                                </Badge>
                                {isOverdue && (
                                  <Badge variant="destructive" className="flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    متأخر
                                  </Badge>
                                )}
                              </div>

                              <div className="space-y-1 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>
                                    تاريخ الإنشاء:{' '}
                                    {format(
                                      task.createdAt instanceof Timestamp
                                        ? task.createdAt.toDate()
                                        : (task.createdAt ? new Date(task.createdAt) : new Date()),
                                      'PPP',
                                      { locale: ar }
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    موعد التسليم: {format(dueDate, 'PPP', { locale: ar })}
                                  </span>
                                </div>
                                {task.services && task.services.length > 0 && (
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    <span>الخدمات: {task.services.map((s) => s.type).join(', ')}</span>
                                  </div>
                                )}
                              </div>

                              {task.status === 'done' && task.deliveryUrls && task.deliveryUrls.length > 0 && (
                                <div className="mt-3">
                                  <Button size="sm" variant="outline">
                                    <Download className="h-4 w-4 mr-2" />
                                    تحميل الملفات ({task.deliveryUrls.length})
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="text-left">
                            <p className="text-sm text-muted-foreground">المبلغ الإجمالي</p>
                            <p className="text-xl font-bold text-green-600">
                              {task.financialTotal.toLocaleString()} جنيه
                            </p>
                            {task.financialRemaining > 0 && (
                              <p className="text-xs text-red-600 mt-1">
                                متبقي: {task.financialRemaining.toLocaleString()} جنيه
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ملاحظة عن المدفوعات المتبقية */}
      {statistics.pendingPayment > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-1">تنبيه الدفع</h3>
                <p className="text-muted-foreground">
                  لديك مبلغ متبقي قدره <span className="font-bold text-orange-700">
                    {statistics.pendingPayment.toLocaleString()} جنيه
                  </span>{' '}
                  من إجمالي طلباتك. يرجى التواصل معنا لإتمام الدفع.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
