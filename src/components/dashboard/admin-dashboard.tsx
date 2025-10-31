'use client';

import React, { useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import type { Task, User as UserType } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Briefcase,
  DollarSign,
  TrendingUp,
  UserCheck,
  UserCog,
  Palette,
  UserCircle,
  CheckCircle,
  Clock,
  AlertCircle,
  Activity,
  FileText,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  trend?: string;
  trendUp?: boolean;
}

function StatCard({ title, value, icon: Icon, color, trend, trendUp }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            {trend && (
              <p className={`text-xs mt-2 flex items-center gap-1 ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                <TrendingUp className={`h-3 w-3 ${!trendUp && 'rotate-180'}`} />
                {trend}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}

export default function AdminDashboard({ user }: { user: UserType }) {
  const firestore = useFirestore();

  // جلب جميع المستخدمين
  const usersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'));
  }, [firestore]);

  const { data: users, loading: usersLoading } = useCollection<UserType>(usersQuery);

  // جلب جميع المهام
  const tasksQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'tasks'));
  }, [firestore]);

  const { data: tasks, loading: tasksLoading } = useCollection<Task>(tasksQuery);

  // حساب الإحصائيات
  const statistics = useMemo(() => {
    if (!users || !tasks) {
      return {
        totalUsers: 0,
        designers: 0,
        moderators: 0,
        clients: 0,
        totalTasks: 0,
        newTasks: 0,
        inProgressTasks: 0,
        completedTasks: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        completionRate: 0,
        overdueTasks: 0,
      };
    }

    // إحصائيات المستخدمين
    const designers = users.filter((u) => u.role === 'designer').length;
    const moderators = users.filter((u) => u.role === 'moderator').length;
    const clients = users.filter((u) => u.role === 'client').length;

    // إحصائيات المهام
    const newTasks = tasks.filter((t) => t.status === 'new').length;
    const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
    const completedTasks = tasks.filter((t) => t.status === 'done').length;

    // الإيرادات
    const totalRevenue = tasks
      .filter((t) => t.status === 'done')
      .reduce((sum, t) => sum + (t.financialPaid || 0), 0);

    // إيرادات الشهر الحالي
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthlyRevenue = tasks
      .filter((t) => {
        if (t.status !== 'done' || !t.completedAt) return false;
        const completedDate = t.completedAt instanceof Timestamp ? t.completedAt.toDate() : new Date(t.completedAt);
        return completedDate >= monthStart;
      })
      .reduce((sum, t) => sum + (t.financialPaid || 0), 0);

    // معدل الإكمال
    const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    // المهام المتأخرة
    const overdueTasks = tasks.filter((t) => {
      if (['done', 'cancelled'].includes(t.status)) return false;
      const dueDate = t.dueDate instanceof Timestamp ? t.dueDate.toDate() : new Date(t.dueDate);
      return dueDate < now;
    }).length;

    return {
      totalUsers: users.length,
      designers,
      moderators,
      clients,
      totalTasks: tasks.length,
      newTasks,
      inProgressTasks,
      completedTasks,
      totalRevenue,
      monthlyRevenue,
      completionRate,
      overdueTasks,
    };
  }, [users, tasks]);

  // أحدث المهام
  const recentTasks = useMemo(() => {
    if (!tasks) return [];
    return [...tasks]
      .sort((a, b) => {
        const aDate = a.createdAt instanceof Timestamp ? a.createdAt.toDate() : new Date(a.createdAt);
        const bDate = b.createdAt instanceof Timestamp ? b.createdAt.toDate() : new Date(b.createdAt);
        return bDate.getTime() - aDate.getTime();
      })
      .slice(0, 5);
  }, [tasks]);

  // أحدث المستخدمين
  const recentUsers = useMemo(() => {
    if (!users) return [];
    return [...users]
      .sort((a, b) => {
        const aDate = a.createdAt instanceof Timestamp ? a.createdAt.toDate() : new Date(a.createdAt);
        const bDate = b.createdAt instanceof Timestamp ? b.createdAt.toDate() : new Date(b.createdAt);
        return bDate.getTime() - aDate.getTime();
      })
      .slice(0, 5);
  }, [users]);

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

  const getRoleText = (role: string) => {
    const texts: Record<string, string> = {
      admin: 'مدير',
      moderator: 'مشرف',
      designer: 'مصمم',
      client: 'عميل',
      team_leader: 'قائد فريق',
    };
    return texts[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-800',
      moderator: 'bg-blue-100 text-blue-800',
      designer: 'bg-purple-100 text-purple-800',
      client: 'bg-green-100 text-green-800',
      team_leader: 'bg-orange-100 text-orange-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  if (usersLoading || tasksLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">لوحة تحكم المدير</h1>
          <p className="text-muted-foreground">مرحباً {user?.name}. نظرة شاملة على النظام.</p>
        </div>
        <Link href="/dashboard/users">
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            إدارة المستخدمين
          </Button>
        </Link>
      </div>

      {/* الإحصائيات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي المستخدمين"
          value={statistics.totalUsers}
          icon={Users}
          color="bg-blue-100 text-blue-800"
        />
        <StatCard
          title="إجمالي المهام"
          value={statistics.totalTasks}
          icon={Briefcase}
          color="bg-purple-100 text-purple-800"
        />
        <StatCard
          title="الإيرادات الكلية"
          value={`${statistics.totalRevenue.toLocaleString()} جنيه`}
          icon={DollarSign}
          color="bg-green-100 text-green-800"
        />
        <StatCard
          title="معدل الإكمال"
          value={`${statistics.completionRate}%`}
          icon={Activity}
          color="bg-orange-100 text-orange-800"
        />
      </div>

      {/* إحصائيات ثانوية */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-xs text-muted-foreground">مصممين</p>
                <p className="text-xl font-bold">{statistics.designers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">مشرفين</p>
                <p className="text-xl font-bold">{statistics.moderators}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">عملاء</p>
                <p className="text-xl font-bold">{statistics.clients}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">جديد</p>
                <p className="text-xl font-bold">{statistics.newTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-xs text-muted-foreground">قيد التنفيذ</p>
                <p className="text-xl font-bold">{statistics.inProgressTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-xs text-muted-foreground">متأخر</p>
                <p className="text-xl font-bold">{statistics.overdueTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* أحدث المهام والمستخدمين */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* أحدث المهام */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>أحدث المهام</span>
              <Link href="/dashboard/tasks">
                <Button variant="ghost" size="sm">
                  عرض الكل
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentTasks.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">لا توجد مهام</p>
            ) : (
              <div className="space-y-4">
                {recentTasks.map((task) => (
                  <Link key={task.id} href={`/dashboard/tasks/${task.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{task.clientName}</p>
                        <p className="text-xs text-muted-foreground">
                          رقم المهمة: #{task.taskId.slice(-8)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(
                            task.createdAt instanceof Timestamp
                              ? task.createdAt.toDate()
                              : new Date(task.createdAt),
                            { addSuffix: true, locale: ar }
                          )}
                        </p>
                      </div>
                      <Badge className={getStatusColor(task.status)}>
                        {getStatusText(task.status)}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* أحدث المستخدمين */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>أحدث المستخدمين</span>
              <Link href="/dashboard/users">
                <Button variant="ghost" size="sm">
                  عرض الكل
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">لا يوجد مستخدمين</p>
            ) : (
              <div className="space-y-4">
                {recentUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                    <Badge className={getRoleColor(u.role)}>{getRoleText(u.role)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* إيرادات الشهر */}
      <Card>
        <CardHeader>
          <CardTitle>ملخص الإيرادات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">إيرادات الشهر الحالي</p>
              <p className="text-2xl font-bold text-green-700">
                {statistics.monthlyRevenue.toLocaleString()} جنيه
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">المهام المكتملة</p>
              <p className="text-2xl font-bold text-blue-700">{statistics.completedTasks}</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">متوسط قيمة المهمة</p>
              <p className="text-2xl font-bold text-orange-700">
                {statistics.completedTasks > 0
                  ? Math.round(statistics.totalRevenue / statistics.completedTasks).toLocaleString()
                  : 0}{' '}
                جنيه
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
