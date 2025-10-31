'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import {
  Search,
  UserPlus,
  Edit,
  Trash2,
  MoreVertical,
  Filter,
  Download,
  Users as UsersIcon,
} from 'lucide-react';
import type { User as UserType } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-96" />
    </div>
  );
}

export default function UsersPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // جلب بيانات المستخدم الحالي من Firestore
  const currentUserQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users'), where('uid', '==', user.uid));
  }, [firestore, user]);

  const { data: currentUserData, loading: currentUserLoading } = useCollection<UserType>(currentUserQuery);
  const currentUser = currentUserData?.[0];

  // جلب جميع المستخدمين
  const usersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'));
  }, [firestore]);

  const { data: users, loading: usersLoading } = useCollection<UserType>(usersQuery);

  // التحقق من صلاحيات المدير
  const isAdmin = currentUser?.role === 'admin';

  // تصفية المستخدمين
  const filteredUsers = useMemo(() => {
    if (!users) return [];

    let filtered = [...users];

    // البحث
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query) ||
          u.phoneNumber?.includes(query)
      );
    }

    // تصفية حسب الدور
    if (roleFilter !== 'all') {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    return filtered;
  }, [users, searchQuery, roleFilter]);

  // إحصائيات
  const statistics = useMemo(() => {
    if (!users) return { total: 0, admins: 0, moderators: 0, designers: 0, clients: 0, teamLeaders: 0 };

    return {
      total: users.length,
      admins: users.filter((u) => u.role === 'admin').length,
      moderators: users.filter((u) => u.role === 'moderator').length,
      designers: users.filter((u) => u.role === 'designer').length,
      clients: users.filter((u) => u.role === 'client').length,
      teamLeaders: users.filter((u) => u.role === 'team_leader').length,
    };
  }, [users]);

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

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    if (!firestore || !isAdmin) return;

    try {
      await updateDoc(doc(firestore, 'users', userId), {
        isActive: !currentStatus,
      });

      toast({
        title: 'تم التحديث',
        description: `تم ${!currentStatus ? 'تفعيل' : 'تعطيل'} المستخدم بنجاح`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'فشل',
        description: error.message,
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!firestore || !isAdmin || !userToDelete) return;

    try {
      await deleteDoc(doc(firestore, 'users', userToDelete));

      toast({
        title: 'تم الحذف',
        description: 'تم حذف المستخدم بنجاح',
      });

      setUserToDelete(null);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'فشل',
        description: error.message,
      });
    }
  };

  const exportToCSV = () => {
    if (!filteredUsers) return;

    const headers = ['الاسم', 'البريد الإلكتروني', 'رقم الهاتف', 'الدور', 'الحالة'];
    const rows = filteredUsers.map((u) => [
      u.name,
      u.email,
      u.phoneNumber || '-',
      getRoleText(u.role),
      u.isActive ? 'نشط' : 'معطل',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // إعادة توجيه غير المدراء
  useEffect(() => {
    if (!currentUserLoading && currentUser && !isAdmin) {
      router.push('/dashboard');
    }
  }, [isAdmin, currentUserLoading, currentUser, router]);

  if (usersLoading || currentUserLoading) {
    return <PageSkeleton />;
  }

  if (!isAdmin) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">إدارة المستخدمين</h1>
          <p className="text-muted-foreground">
            إجمالي المستخدمين: {statistics.total}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            تصدير CSV
          </Button>
          <Button onClick={() => router.push('/dashboard/users/add')}>
            <UserPlus className="h-4 w-4 mr-2" />
            إضافة مستخدم
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <UsersIcon className="h-6 w-6 mx-auto mb-2 text-gray-600" />
              <p className="text-2xl font-bold">{statistics.total}</p>
              <p className="text-xs text-muted-foreground">الكل</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="h-6 w-6 mx-auto mb-2 text-red-600">👑</div>
              <p className="text-2xl font-bold">{statistics.admins}</p>
              <p className="text-xs text-muted-foreground">مدراء</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="h-6 w-6 mx-auto mb-2 text-blue-600">👨‍💼</div>
              <p className="text-2xl font-bold">{statistics.moderators}</p>
              <p className="text-xs text-muted-foreground">مشرفين</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="h-6 w-6 mx-auto mb-2 text-purple-600">🎨</div>
              <p className="text-2xl font-bold">{statistics.designers}</p>
              <p className="text-xs text-muted-foreground">مصممين</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="h-6 w-6 mx-auto mb-2 text-green-600">👤</div>
              <p className="text-2xl font-bold">{statistics.clients}</p>
              <p className="text-xs text-muted-foreground">عملاء</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="h-6 w-6 mx-auto mb-2 text-orange-600">🎯</div>
              <p className="text-2xl font-bold">{statistics.teamLeaders}</p>
              <p className="text-xs text-muted-foreground">قادة فرق</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث بالاسم، البريد الإلكتروني، أو رقم الهاتف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="تصفية حسب الدور" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأدوار</SelectItem>
                <SelectItem value="admin">مدير</SelectItem>
                <SelectItem value="moderator">مشرف</SelectItem>
                <SelectItem value="designer">مصمم</SelectItem>
                <SelectItem value="client">عميل</SelectItem>
                <SelectItem value="team_leader">قائد فريق</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المستخدمين ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UsersIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا يوجد مستخدمين</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المستخدم</TableHead>
                    <TableHead>البريد الإلكتروني</TableHead>
                    <TableHead>رقم الهاتف</TableHead>
                    <TableHead>الدور</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="text-left">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            {u.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-medium">{u.name}</p>
                            <p className="text-xs text-muted-foreground">
                              ID: {u.uid?.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.phoneNumber || '-'}</TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(u.role)}>
                          {getRoleText(u.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.isActive ? 'default' : 'secondary'}>
                          {u.isActive ? 'نشط' : 'معطل'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-left">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>إجراءات</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => router.push(`/dashboard/users/${u.id}/edit`)}
                            >
                              <Edit className="h-4 w-4 ml-2" />
                              تعديل
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleActive(u.id, u.isActive)}
                            >
                              {u.isActive ? '🚫 تعطيل' : '✅ تفعيل'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => setUserToDelete(u.id)}
                            >
                              <Trash2 className="h-4 w-4 ml-2" />
                              حذف
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف هذا المستخدم نهائياً. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
