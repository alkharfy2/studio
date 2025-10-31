'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Loader2, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function AddUserPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    role: 'client' as 'admin' | 'moderator' | 'designer' | 'client' | 'team_leader',
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.email || !formData.phoneNumber || !formData.password) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'جميع الحقول مطلوبة',
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'كلمتا المرور غير متطابقتين',
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
      });
      return;
    }

    if (!firestore) return;

    setLoading(true);

    try {
      // Check if email already exists
      const emailQuery = query(
        collection(firestore, 'users'),
        where('email', '==', formData.email)
      );
      const emailSnapshot = await getDocs(emailQuery);

      if (!emailSnapshot.empty) {
        toast({
          variant: 'destructive',
          title: 'خطأ',
          description: 'البريد الإلكتروني مستخدم بالفعل',
        });
        setLoading(false);
        return;
      }

      // Create user in Firebase Authentication would go here
      // For now, we'll just create the Firestore document
      // In production, you'd use Firebase Admin SDK in a Cloud Function

      const userData = {
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        role: formData.role,
        isActive: formData.isActive,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Note: In production, create the user via Firebase Admin SDK
        // and use the generated uid here
        uid: `temp_${Date.now()}`, // Temporary UID until proper auth
      };

      await addDoc(collection(firestore, 'users'), userData);

      toast({
        title: 'تم الإضافة',
        description: 'تم إضافة المستخدم بنجاح',
      });

      router.push('/dashboard/users');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">إضافة مستخدم جديد</h1>
          <p className="text-muted-foreground">
            قم بإنشاء حساب مستخدم جديد في النظام
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
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              بيانات المستخدم
            </CardTitle>
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

            {/* كلمة المرور */}
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور *</Label>
              <Input
                id="password"
                type="password"
                placeholder="6 أحرف على الأقل"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
              />
            </div>

            {/* تأكيد كلمة المرور */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="أعد إدخال كلمة المرور"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                required
                minLength={6}
              />
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

            {/* Action Buttons */}
            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    جاري الإضافة...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 ml-2" />
                    إضافة المستخدم
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

      {/* ملاحظة */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <p className="text-sm text-blue-800">
            <strong>ملاحظة:</strong> في النظام الحالي، يتم إنشاء المستخدمين مباشرة في Firestore.
            في الإنتاج، يجب استخدام Firebase Admin SDK لإنشاء حسابات المستخدمين في
            Firebase Authentication أولاً، ثم حفظ البيانات في Firestore.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
