'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore } from '@/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import type { User } from '@/lib/types';

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-96" />
    </div>
  );
}

export default function EditUserPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const userId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    role: 'client' as 'admin' | 'moderator' | 'designer' | 'client' | 'team_leader',
    isActive: true,
  });

  // Load user data
  useEffect(() => {
    const loadUser = async () => {
      if (!firestore || !userId) return;

      try {
        const userDoc = await getDoc(doc(firestore, 'users', userId));

        if (!userDoc.exists()) {
          toast({
            variant: 'destructive',
            title: 'خطأ',
            description: 'المستخدم غير موجود',
          });
          router.push('/dashboard/users');
          return;
        }

        const userData = { id: userDoc.id, ...userDoc.data() } as User;
        setUser(userData);
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          phoneNumber: userData.phoneNumber || '',
          role: userData.role || 'client',
          isActive: userData.isActive !== false,
        });
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'فشل',
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [firestore, userId, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.email || !formData.phoneNumber) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'جميع الحقول مطلوبة',
      });
      return;
    }

    if (!firestore || !userId) return;

    setSaving(true);

    try {
      await updateDoc(doc(firestore, 'users', userId), {
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        role: formData.role,
        isActive: formData.isActive,
        updatedAt: serverTimestamp(),
      });

      toast({
        title: 'تم التحديث',
        description: 'تم تحديث بيانات المستخدم بنجاح',
      });

      router.push('/dashboard/users');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'فشل',
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">تعديل المستخدم</h1>
          <p className="text-muted-foreground">
            تحديث بيانات المستخدم: {user.name}
          </p>
        </div>
        <Link href="/dashboard/users">
          <Button variant="outline">
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة للقائمة
          </Button>
        </Link>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>بيانات المستخدم</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* الاسم الكامل */}
            <div className="space-y-2">
              <Label htmlFor="name">الاسم الكامل *</Label>
              <Input
                id="name"
                type="text"
                placeholder="أدخل الاسم الكامل"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* البريد الإلكتروني */}
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني *</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@domain.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                ملاحظة: تغيير البريد الإلكتروني لن يؤثر على حساب Firebase Authentication
              </p>
            </div>

            {/* رقم الهاتف */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">رقم الهاتف *</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="01xxxxxxxxx"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                required
              />
            </div>

            {/* الدور */}
            <div className="space-y-2">
              <Label htmlFor="role">الدور *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: any) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="اختر الدور" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">عميل</SelectItem>
                  <SelectItem value="designer">مصمم</SelectItem>
                  <SelectItem value="team_leader">قائد فريق</SelectItem>
                  <SelectItem value="moderator">مشرف</SelectItem>
                  <SelectItem value="admin">مدير</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* الحالة */}
            <div className="space-y-2">
              <Label htmlFor="isActive">الحالة *</Label>
              <Select
                value={formData.isActive ? 'active' : 'inactive'}
                onValueChange={(value) =>
                  setFormData({ ...formData, isActive: value === 'active' })
                }
              >
                <SelectTrigger id="isActive">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">معطل</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* معلومات إضافية */}
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm">
                <strong>UID:</strong> {user.uid}
              </p>
              <p className="text-sm">
                <strong>تاريخ الإنشاء:</strong>{' '}
                {user.createdAt
                  ? new Date(
                      typeof user.createdAt === 'object' && 'toDate' in user.createdAt
                        ? (user.createdAt as any).toDate()
                        : user.createdAt
                    ).toLocaleString('ar-EG')
                  : '-'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 ml-2" />
                    حفظ التعديلات
                  </>
                )}
              </Button>
              <Link href="/dashboard/users" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  إلغاء
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
