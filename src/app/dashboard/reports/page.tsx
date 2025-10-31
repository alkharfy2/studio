'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { Task, User as UserType, Notification } from '@/lib/types';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Download,
  Calendar,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, subMonths } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toDate } from '@/lib/date-utils';

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-96" />
    </div>
  );
}

type DateRange = 'this_month' | 'last_month' | 'this_year' | 'all_time';

export default function ReportsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const [dateRange, setDateRange] = useState<DateRange>('this_month');

  // جلب بيانات المستخدم الحالي
  const currentUserQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users'), where('uid', '==', user.uid));
  }, [firestore, user]);

  const { data: currentUserData } = useCollection<UserType>(currentUserQuery);
  const currentUser = currentUserData?.[0];

  // التحقق من الصلاحيات
  const hasAccess = currentUser?.role === 'admin' || currentUser?.role === 'moderator';

  // جلب جميع المهام
  const tasksQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'tasks'));
  }, [firestore]);

  const { data: allTasks, loading: tasksLoading } = useCollection<Task>(tasksQuery);

  // جلب جميع المستخدمين
  const usersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'));
  }, [firestore]);

  const { data: users, loading: usersLoading } = useCollection<UserType>(usersQuery);

  // تحديد نطاق التاريخ
  const getDateInterval = (range: DateRange) => {
    const now = new Date();
    switch (range) {
      case 'this_month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'last_month':
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case 'this_year':
        return { start: startOfYear(now), end: endOfYear(now) };
      case 'all_time':
        return null;
    }
  };

  // تصفية المهام حسب النطاق الزمني
  const filteredTasks = useMemo(() => {
    if (!allTasks) return [];
    const interval = getDateInterval(dateRange);
    if (!interval) return allTasks;

    return allTasks.filter(task => {
      const createdAt = toDate(task.createdAt);
      return isWithinInterval(createdAt, interval);
    });
  }, [allTasks, dateRange]);

  // الإحصائيات العامة
  const generalStats = useMemo(() => {
    if (!filteredTasks) return null;

    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter(t => t.status === 'done').length;
    const inProgressTasks = filteredTasks.filter(t =>
      ['new', 'in_progress', 'submitted', 'to_review'].includes(t.status)
    ).length;
    const cancelledTasks = filteredTasks.filter(t => t.status === 'cancelled').length;
    const overdueTasks = filteredTasks.filter(t => {
      if (['done', 'cancelled'].includes(t.status)) return false;
      const dueDate = toDate(t.dueDate);
      return dueDate < new Date();
    }).length;

    const totalRevenue = filteredTasks.reduce((sum, t) => sum + (t.financialTotal || 0), 0);
    const totalPaid = filteredTasks.reduce((sum, t) => sum + (t.financialPaid || 0), 0);
    const totalRemaining = filteredTasks.reduce((sum, t) => sum + (t.financialRemaining || 0), 0);

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      cancelledTasks,
      overdueTasks,
      totalRevenue,
      totalPaid,
      totalRemaining,
      completionRate,
    };
  }, [filteredTasks]);

  // إحصائيات المستخدمين
  const userStats = useMemo(() => {
    if (!users) return null;

    return {
      total: users.length,
      admins: users.filter(u => u.role === 'admin').length,
      moderators: users.filter(u => u.role === 'moderator').length,
      designers: users.filter(u => u.role === 'designer').length,
      clients: users.filter(u => u.role === 'client').length,
      teamLeaders: users.filter(u => u.role === 'team_leader').length,
      active: users.filter(u => u.isActive !== false).length,
    };
  }, [users]);

  // أداء المصممين
  const designerPerformance = useMemo(() => {
    if (!users || !filteredTasks) return [];

    const designers = users.filter(u => u.role === 'designer');

    return designers.map(designer => {
      const designerTasks = filteredTasks.filter(t => t.designerId === designer.uid);
      const completed = designerTasks.filter(t => t.status === 'done').length;
      const inProgress = designerTasks.filter(t =>
        ['new', 'in_progress', 'submitted', 'to_review'].includes(t.status)
      ).length;
      const overdue = designerTasks.filter(t => {
        if (['done', 'cancelled'].includes(t.status)) return false;
        const dueDate = toDate(t.dueDate);
        return dueDate < new Date();
      }).length;

      const totalRevenue = designerTasks.reduce((sum, t) => sum + (t.financialTotal || 0), 0);

      return {
        designer,
        totalTasks: designerTasks.length,
        completed,
        inProgress,
        overdue,
        totalRevenue,
        completionRate: designerTasks.length > 0
          ? Math.round((completed / designerTasks.length) * 100)
          : 0,
      };
    }).sort((a, b) => b.totalTasks - a.totalTasks);
  }, [users, filteredTasks]);

  // أداء المشرفين
  const moderatorPerformance = useMemo(() => {
    if (!users || !filteredTasks) return [];

    const moderators = users.filter(u => u.role === 'moderator');

    return moderators.map(moderator => {
      const moderatorTasks = filteredTasks.filter(t => t.moderatorId === moderator.uid);
      const completed = moderatorTasks.filter(t => t.status === 'done').length;
      const totalRevenue = moderatorTasks.reduce((sum, t) => sum + (t.financialTotal || 0), 0);
      const totalPaid = moderatorTasks.filter(t => t.status === 'done')
        .reduce((sum, t) => sum + (t.financialPaid || 0), 0);

      // حساب العمولة: 20% من (المدفوع - 100) لكل مهمة مكتملة
      const commission = moderatorTasks
        .filter(t => t.status === 'done')
        .reduce((sum, t) => {
          const paid = t.financialPaid || 0;
          if (paid > 100) {
            return sum + ((paid - 100) * 0.2);
          }
          return sum;
        }, 0);

      return {
        moderator,
        totalTasks: moderatorTasks.length,
        completed,
        totalRevenue,
        totalPaid,
        commission,
      };
    }).sort((a, b) => b.totalTasks - a.totalTasks);
  }, [users, filteredTasks]);

  // تصدير إلى CSV
  const exportToCSV = () => {
    if (!generalStats) return;

    const headers = ['المؤشر', 'القيمة'];
    const rows = [
      ['إجمالي المهام', generalStats.totalTasks],
      ['المهام المكتملة', generalStats.completedTasks],
      ['قيد التنفيذ', generalStats.inProgressTasks],
      ['المهام الملغاة', generalStats.cancelledTasks],
      ['المهام المتأخرة', generalStats.overdueTasks],
      ['معدل الإنجاز', `${generalStats.completionRate}%`],
      ['إجمالي الإيرادات', `${generalStats.totalRevenue} جنيه`],
      ['إجمالي المدفوع', `${generalStats.totalPaid} جنيه`],
      ['إجمالي المتبقي', `${generalStats.totalRemaining} جنيه`],
    ];

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `report_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (tasksLoading || usersLoading) {
    return <PageSkeleton />;
  }

  if (!hasAccess) {
    router.push('/dashboard');
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">التقارير والإحصائيات</h1>
          <p className="text-muted-foreground">تقارير شاملة عن أداء النظام</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={(v: DateRange) => setDateRange(v)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">هذا الشهر</SelectItem>
              <SelectItem value="last_month">الشهر الماضي</SelectItem>
              <SelectItem value="this_year">هذا العام</SelectItem>
              <SelectItem value="all_time">كل الأوقات</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            تصدير CSV
          </Button>
        </div>
      </div>

      {/* الإحصائيات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي المهام</p>
                <p className="text-3xl font-bold mt-2">{generalStats?.totalTasks || 0}</p>
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
                <p className="text-sm font-medium text-muted-foreground">مكتمل</p>
                <p className="text-3xl font-bold mt-2">{generalStats?.completedTasks || 0}</p>
                <p className="text-xs text-green-600 mt-1">
                  {generalStats?.completionRate || 0}% معدل الإنجاز
                </p>
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
                <p className="text-sm font-medium text-muted-foreground">قيد التنفيذ</p>
                <p className="text-3xl font-bold mt-2">{generalStats?.inProgressTasks || 0}</p>
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
                <p className="text-sm font-medium text-muted-foreground">متأخر</p>
                <p className="text-3xl font-bold mt-2 text-red-600">
                  {generalStats?.overdueTasks || 0}
                </p>
              </div>
              <div className="p-3 rounded-full bg-red-100 text-red-800">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* الإيرادات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold mt-2">
                  {generalStats?.totalRevenue.toLocaleString() || 0} جنيه
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">المدفوع</p>
                <p className="text-2xl font-bold mt-2 text-green-600">
                  {generalStats?.totalPaid.toLocaleString() || 0} جنيه
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">المتبقي</p>
                <p className="text-2xl font-bold mt-2 text-orange-600">
                  {generalStats?.totalRemaining.toLocaleString() || 0} جنيه
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* التبويبات */}
      <Tabs defaultValue="designers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="designers">أداء المصممين</TabsTrigger>
          <TabsTrigger value="moderators">أداء المشرفين</TabsTrigger>
          <TabsTrigger value="users">المستخدمين</TabsTrigger>
        </TabsList>

        {/* أداء المصممين */}
        <TabsContent value="designers">
          <Card>
            <CardHeader>
              <CardTitle>تقرير أداء المصممين</CardTitle>
            </CardHeader>
            <CardContent>
              {designerPerformance.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد بيانات</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {designerPerformance.map((stat) => (
                    <div key={stat.designer.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold">
                            {stat.designer.name?.charAt(0) || 'D'}
                          </div>
                          <div>
                            <p className="font-bold">{stat.designer.name}</p>
                            <p className="text-xs text-muted-foreground">{stat.designer.email}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <p className="text-lg font-bold text-blue-700">{stat.totalTasks}</p>
                          <p className="text-xs text-muted-foreground">إجمالي</p>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded">
                          <p className="text-lg font-bold text-green-700">{stat.completed}</p>
                          <p className="text-xs text-muted-foreground">مكتمل</p>
                        </div>
                        <div className="text-center p-2 bg-yellow-50 rounded">
                          <p className="text-lg font-bold text-yellow-700">{stat.inProgress}</p>
                          <p className="text-xs text-muted-foreground">نشط</p>
                        </div>
                        <div className="text-center p-2 bg-red-50 rounded">
                          <p className="text-lg font-bold text-red-700">{stat.overdue}</p>
                          <p className="text-xs text-muted-foreground">متأخر</p>
                        </div>
                        <div className="text-center p-2 bg-purple-50 rounded">
                          <p className="text-lg font-bold text-purple-700">{stat.completionRate}%</p>
                          <p className="text-xs text-muted-foreground">إنجاز</p>
                        </div>
                      </div>

                      <div className="mt-3 text-sm">
                        <span className="text-muted-foreground">إجمالي الإيرادات: </span>
                        <span className="font-bold">{stat.totalRevenue.toLocaleString()} جنيه</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* أداء المشرفين */}
        <TabsContent value="moderators">
          <Card>
            <CardHeader>
              <CardTitle>تقرير أداء المشرفين</CardTitle>
            </CardHeader>
            <CardContent>
              {moderatorPerformance.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد بيانات</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {moderatorPerformance.map((stat) => (
                    <div key={stat.moderator.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold">
                            {stat.moderator.name?.charAt(0) || 'M'}
                          </div>
                          <div>
                            <p className="font-bold">{stat.moderator.name}</p>
                            <p className="text-xs text-muted-foreground">{stat.moderator.email}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <p className="text-lg font-bold text-blue-700">{stat.totalTasks}</p>
                          <p className="text-xs text-muted-foreground">إجمالي المهام</p>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded">
                          <p className="text-lg font-bold text-green-700">{stat.completed}</p>
                          <p className="text-xs text-muted-foreground">مكتمل</p>
                        </div>
                        <div className="text-center p-2 bg-purple-50 rounded">
                          <p className="text-lg font-bold text-purple-700">
                            {stat.totalRevenue.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">إيرادات</p>
                        </div>
                        <div className="text-center p-2 bg-emerald-50 rounded">
                          <p className="text-lg font-bold text-emerald-700">
                            {Math.round(stat.commission).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">عمولة</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* المستخدمين */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>إحصائيات المستخدمين</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold">{userStats?.total || 0}</p>
                  <p className="text-sm text-muted-foreground mt-1">إجمالي المستخدمين</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-3xl font-bold text-red-700">{userStats?.admins || 0}</p>
                  <p className="text-sm text-muted-foreground mt-1">مدراء</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-700">{userStats?.moderators || 0}</p>
                  <p className="text-sm text-muted-foreground mt-1">مشرفين</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-3xl font-bold text-purple-700">{userStats?.designers || 0}</p>
                  <p className="text-sm text-muted-foreground mt-1">مصممين</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-700">{userStats?.clients || 0}</p>
                  <p className="text-sm text-muted-foreground mt-1">عملاء</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-3xl font-bold text-orange-700">{userStats?.teamLeaders || 0}</p>
                  <p className="text-sm text-muted-foreground mt-1">قادة فرق</p>
                </div>
                <div className="text-center p-4 bg-emerald-50 rounded-lg">
                  <p className="text-3xl font-bold text-emerald-700">{userStats?.active || 0}</p>
                  <p className="text-sm text-muted-foreground mt-1">نشط</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-700">
                    {(userStats?.total || 0) - (userStats?.active || 0)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">معطل</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
