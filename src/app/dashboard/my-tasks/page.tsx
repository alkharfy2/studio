'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import {
  Search,
  Filter,
  Calendar,
  Phone,
  Mail,
  Briefcase,
  Grid3x3,
  List,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task } from '@/lib/types';
import Link from 'next/link';

// دالة للحصول على لون الحالة
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    new: 'bg-blue-500',
    in_progress: 'bg-yellow-500',
    submitted: 'bg-purple-500',
    to_review: 'bg-orange-500',
    done: 'bg-green-500',
    cancelled: 'bg-gray-500',
  };
  return colors[status] || 'bg-gray-500';
};

// دالة للحصول على نص الحالة بالعربية
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

// دالة لتنسيق التاريخ
const formatDate = (date: any) => {
  if (!date) return 'غير محدد';
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function MyTasksPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  // الحالة
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // تحميل المهام الخاصة بالمشرف فقط
  const tasksQuery = useMemo(() => {
    if (!firestore || !user) return null;

    // فقط مهام هذا المشرف
    return query(
      collection(firestore, 'tasks'),
      where('moderatorId', '==', user.uid)
    );
  }, [firestore, user]);

  const { data: tasks, loading } = useCollection<Task>(tasksQuery);

  // تصفية المهام
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];

    let filtered = tasks;

    // تصفية حسب البحث
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.clientName?.toLowerCase().includes(query) ||
          task.clientPhone?.includes(query) ||
          task.clientEmail?.toLowerCase().includes(query)
      );
    }

    // تصفية حسب الحالة
    if (statusFilter !== 'all') {
      filtered = filtered.filter((task) => task.status === statusFilter);
    }

    return filtered;
  }, [tasks, searchQuery, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredTasks.slice(start, end);
  }, [filteredTasks, currentPage, itemsPerPage]);

  // إحصائيات
  const stats = useMemo(() => {
    if (!tasks) return { total: 0, new: 0, inProgress: 0, done: 0 };

    return {
      total: tasks.length,
      new: tasks.filter((t) => t.status === 'new').length,
      inProgress: tasks.filter((t) => t.status === 'in_progress').length,
      done: tasks.filter((t) => t.status === 'done').length,
    };
  }, [tasks]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-headline font-bold">مهامي</h1>
        <p className="text-muted-foreground">المهام المسندة لي كمشرف</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground mt-1">إجمالي مهامي</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.new}</p>
              <p className="text-sm text-muted-foreground mt-1">جديد</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">{stats.inProgress}</p>
              <p className="text-sm text-muted-foreground mt-1">قيد التنفيذ</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{stats.done}</p>
              <p className="text-sm text-muted-foreground mt-1">مكتمل</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* البحث */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث بالاسم أو رقم الهاتف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* تصفية الحالة */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="تصفية الحالة..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="new">جديد</SelectItem>
                <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                <SelectItem value="submitted">تم التسليم</SelectItem>
                <SelectItem value="to_review">قيد المراجعة</SelectItem>
                <SelectItem value="done">مكتمل</SelectItem>
                <SelectItem value="cancelled">ملغي</SelectItem>
              </SelectContent>
            </Select>

            {/* تبديل العرض */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* المهام */}
      {paginatedTasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>لا توجد مهام مسندة لك</p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedTasks.map((task) => (
            <Link key={task.id} href={`/dashboard/tasks/${task.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{task.clientName}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        #{task.taskId?.slice(-8)}
                      </p>
                    </div>
                    <Badge className={cn('text-white', getStatusColor(task.status))}>
                      {getStatusText(task.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{task.clientPhone}</span>
                  </div>

                  {task.clientEmail && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{task.clientEmail}</span>
                    </div>
                  )}

                  {task.clientJobTitle && (
                    <div className="flex items-center gap-2 text-sm">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span>{task.clientJobTitle}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(task.dueDate)}</span>
                  </div>

                  {task.services && task.services.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-2">الخدمات:</p>
                      <div className="flex flex-wrap gap-1">
                        {task.services.slice(0, 2).map((service, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {service.type}
                          </Badge>
                        ))}
                        {task.services.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{task.services.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        // Table View
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium">العميل</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">التليفون</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">الخدمات</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">موعد التسليم</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">الحالة</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTasks.map((task) => (
                    <tr
                      key={task.id}
                      onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                      className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{task.clientName}</p>
                          <p className="text-sm text-muted-foreground">
                            #{task.taskId?.slice(-8)}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{task.clientPhone}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {task.services?.slice(0, 1).map((service, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {service.type}
                            </Badge>
                          ))}
                          {task.services && task.services.length > 1 && (
                            <Badge variant="secondary" className="text-xs">
                              +{task.services.length - 1}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{formatDate(task.dueDate)}</td>
                      <td className="px-4 py-3">
                        <Badge className={cn('text-white', getStatusColor(task.status))}>
                          {getStatusText(task.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {task.financialTotal} {task.financialCurrency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className="w-10"
              >
                {page}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Results count */}
      <p className="text-center text-sm text-muted-foreground">
        عرض {paginatedTasks.length} من {filteredTasks.length} مهمة
      </p>
    </div>
  );
}
