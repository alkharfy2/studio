'use client';

import React, { useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import type { Task, User as UserType } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  TrendingUp,
  Calendar,
  Target,
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow, format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toDate } from '@/lib/date-utils';

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

export default function TeamLeaderDashboard({ user }: { user: UserType }) {
  const firestore = useFirestore();

  // جلب جميع المهام (لعرض مهام الفريق)
  const tasksQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'tasks'));
  }, [firestore]);

  const { data: allTasks, loading: tasksLoading } = useCollection<Task>(tasksQuery);

  // جلب جميع المصممين (أعضاء الفريق)
  const designersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'users'),
      where('role', '==', 'designer')
    );
  }, [firestore]);

  const { data: designers, loading: designersLoading } = useCollection<UserType>(designersQuery);

  // تصفية مهام الفريق (المهام المخصصة للمصممين في الفريق)
  const teamTasks = useMemo(() => {
    if (!allTasks || !designers) return [];
    const designerIds = designers.map(d => d.uid);
    return allTasks.filter(task => task.designerId && designerIds.includes(task.designerId));
  }, [allTasks, designers]);

  // حساب الإحصائيات
  const statistics = useMemo(() => {
    if (!teamTasks.length) {
      return {
        totalTasks: 0,
        inProgress: 0,
        completed: 0,
        overdue: 0,
        completionRate: 0,
        avgTasksPerDesigner: 0,
      };
    }

    const now = new Date();
    const inProgress = teamTasks.filter((t) =>
      ['new', 'in_progress', 'submitted', 'to_review'].includes(t.status)
    ).length;
    const completed = teamTasks.filter((t) => t.status === 'done').length;
    const overdue = teamTasks.filter((t) => {
      if (['done', 'cancelled'].includes(t.status)) return false;
      const dueDate = toDate(t.dueDate);
      return dueDate < now;
    }).length;

    const completionRate = teamTasks.length > 0
      ? Math.round((completed / teamTasks.length) * 100)
      : 0;

    const avgTasksPerDesigner = designers && designers.length > 0
      ? Math.round(teamTasks.length / designers.length)
      : 0;

    return {
      totalTasks: teamTasks.length,
      inProgress,
      completed,
      overdue,
      completionRate,
      avgTasksPerDesigner,
    };
  }, [teamTasks, designers]);

  // إحصائيات المصممين
  const designerStats = useMemo(() => {
    if (!designers || !teamTasks) return [];

    return designers.map(designer => {
      const designerTasks = teamTasks.filter(t => t.designerId === designer.uid);
      const completed = designerTasks.filter(t => t.status === 'done').length;
      const inProgress = designerTasks.filter(t =>
        ['new', 'in_progress', 'submitted', 'to_review'].includes(t.status)
      ).length;
      const overdue = designerTasks.filter(t => {
        if (['done', 'cancelled'].includes(t.status)) return false;
        const dueDate = toDate(t.dueDate);
        return dueDate < new Date();
      }).length;

      return {
        designer,
        totalTasks: designerTasks.length,
        completed,
        inProgress,
        overdue,
        completionRate: designerTasks.length > 0
          ? Math.round((completed / designerTasks.length) * 100)
          : 0,
      };
    }).sort((a, b) => b.totalTasks - a.totalTasks);
  }, [designers, teamTasks]);

  // المهام القادمة (خلال 7 أيام)
  const upcomingTasks = useMemo(() => {
    if (!teamTasks) return [];
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return teamTasks
      .filter(task => {
        if (['done', 'cancelled'].includes(task.status)) return false;
        const dueDate = toDate(task.dueDate);
        return dueDate >= now && dueDate <= sevenDaysLater;
      })
      .sort((a, b) => {
        const aDate = toDate(a.dueDate);
        const bDate = toDate(b.dueDate);
        return aDate.getTime() - bDate.getTime();
      })
      .slice(0, 5);
  }, [teamTasks]);

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

  if (tasksLoading || designersLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">لوحة تحكم قائد الفريق</h1>
          <p className="text-muted-foreground">
            مرحباً {user?.name}. تابع أداء فريقك ومهامهم.
          </p>
        </div>
        <Link href="/dashboard/tasks">
          <Button>
            <FileText className="h-4 w-4 ml-2" />
            جميع المهام
          </Button>
        </Link>
      </div>

      {/* الإحصائيات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي المهام</p>
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
                <p className="text-sm font-medium text-muted-foreground">متأخر</p>
                <p className="text-3xl font-bold mt-2 text-red-600">{statistics.overdue}</p>
              </div>
              <div className="p-3 rounded-full bg-red-100 text-red-800">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* معدل الإنجاز وأعضاء الفريق */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              معدل الإنجاز
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{statistics.completionRate}%</span>
                <span className="text-sm text-muted-foreground">
                  {statistics.completed} من {statistics.totalTasks}
                </span>
              </div>
              <Progress value={statistics.completionRate} className="h-2" />
              <p className="text-sm text-muted-foreground">
                معدل المهام المكتملة من إجمالي مهام الفريق
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              أعضاء الفريق
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{designers?.length || 0}</span>
                <span className="text-sm text-muted-foreground">مصمم</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">متوسط المهام لكل مصمم</span>
                  <span className="font-bold">{statistics.avgTasksPerDesigner}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">المهام النشطة</span>
                  <span className="font-bold">{statistics.inProgress}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* المهام القادمة */}
      {upcomingTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              المهام القادمة (خلال 7 أيام)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingTasks.map((task) => {
                const dueDate = toDate(task.dueDate);
                const isUrgent = dueDate.getTime() - new Date().getTime() < 2 * 24 * 60 * 60 * 1000;
                const designer = designers?.find(d => d.uid === task.designerId);

                return (
                  <Link key={task.id} href={`/dashboard/tasks/${task.id}`}>
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold">#{task.taskId.slice(-8)}</p>
                              <Badge className={getStatusColor(task.status)}>
                                {getStatusText(task.status)}
                              </Badge>
                              {isUrgent && (
                                <Badge variant="destructive" className="flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  عاجل
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              العميل: {task.clientName}
                            </p>
                            {designer && (
                              <p className="text-sm text-muted-foreground">
                                المصمم: {designer.name}
                              </p>
                            )}
                          </div>
                          <div className="text-left">
                            <p className="text-xs text-muted-foreground">موعد التسليم</p>
                            <p className="font-bold text-sm">
                              {format(dueDate, 'PPP', { locale: ar })}
                            </p>
                            <p className="text-xs text-orange-600">
                              {formatDistanceToNow(dueDate, { addSuffix: true, locale: ar })}
                            </p>
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

      {/* أداء المصممين */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            أداء أعضاء الفريق
          </CardTitle>
        </CardHeader>
        <CardContent>
          {designerStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا يوجد مصممين في الفريق</p>
            </div>
          ) : (
            <div className="space-y-4">
              {designerStats.map((stat) => (
                <div key={stat.designer.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {stat.designer.name?.charAt(0) || 'D'}
                      </div>
                      <div>
                        <p className="font-bold">{stat.designer.name}</p>
                        <p className="text-xs text-muted-foreground">{stat.designer.email}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-2xl font-bold">{stat.totalTasks}</p>
                      <p className="text-xs text-muted-foreground">مهمة</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3">
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
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">معدل الإنجاز</span>
                      <span className="font-bold">{stat.completionRate}%</span>
                    </div>
                    <Progress value={stat.completionRate} className="h-1.5" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
