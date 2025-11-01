'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_OPTIONS = [
  { value: 'new', label: 'جديد' },
  { value: 'in_progress', label: 'قيد التنفيذ' },
  { value: 'submitted', label: 'تم التسليم' },
  { value: 'to_review', label: 'قيد المراجعة' },
  { value: 'done', label: 'مكتمل' },
  { value: 'cancelled', label: 'ملغي' },
];

export default function EditTaskPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [task, setTask] = useState<any>(null);

  // Form fields
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientJobTitle, setClientJobTitle] = useState('');
  const [status, setStatus] = useState('new');
  const [notes, setNotes] = useState('');
  const [financialTotal, setFinancialTotal] = useState('');
  const [financialPaid, setFinancialPaid] = useState('');
  const [financialCurrency, setFinancialCurrency] = useState('EGP');

  // Load task data
  useEffect(() => {
    const loadTask = async () => {
      if (!params.id || !firestore) return;

      try {
        setLoading(true);
        const taskDoc = await getDoc(doc(firestore, 'tasks', params.id as string));

        if (!taskDoc.exists()) {
          toast({
            variant: 'destructive',
            title: 'خطأ',
            description: 'المهمة غير موجودة',
          });
          router.push('/dashboard/tasks');
          return;
        }

        const taskData = { id: taskDoc.id, ...taskDoc.data() };
        setTask(taskData);

        // Populate form fields
        setClientName(taskData.clientName || '');
        setClientPhone(taskData.clientPhone || '');
        setClientEmail(taskData.clientEmail || '');
        setClientJobTitle(taskData.clientJobTitle || '');
        setStatus(taskData.status || 'new');
        setNotes(taskData.notes || '');
        setFinancialTotal(taskData.financialTotal?.toString() || '');
        setFinancialPaid(taskData.financialPaid?.toString() || '');
        setFinancialCurrency(taskData.financialCurrency || 'EGP');
      } catch (error: any) {
        console.error('Error loading task:', error);
        toast({
          variant: 'destructive',
          title: 'خطأ',
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    };

    loadTask();
  }, [params.id, firestore, toast, router]);

  // Check permissions
  const canEdit = user?.role === 'admin' || user?.role === 'moderator';
  const isModerator = user?.role === 'moderator';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!loading && !canEdit) {
      toast({
        variant: 'destructive',
        title: 'غير مصرح',
        description: 'ليس لديك صلاحية لتعديل المهام',
      });
      router.push(`/dashboard/tasks/${params.id}`);
    }
  }, [loading, canEdit, router, params.id, toast]);

  // Handle save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!task || !firestore) return;

    // Basic validation
    if (!clientName.trim()) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'اسم العميل مطلوب',
      });
      return;
    }

    if (!clientPhone.trim()) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'رقم هاتف العميل مطلوب',
      });
      return;
    }

    setSaving(true);

    try {
      // Calculate remaining
      const total = parseFloat(financialTotal) || 0;
      const paid = parseFloat(financialPaid) || 0;
      const remaining = total - paid;

      // Prepare update data
      const updateData: any = {
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: clientEmail.trim() || null,
        clientJobTitle: clientJobTitle.trim() || null,
        status,
        notes: notes.trim() || null,
        financialCurrency,
        updatedAt: serverTimestamp(),
        ...(status === 'done' && !task.completedAt ? { completedAt: serverTimestamp() } : {}),
      };

      // Only Admin can update financial totals and paid amounts
      if (isAdmin) {
        updateData.financialTotal = total;
        updateData.financialPaid = paid;
        updateData.financialRemaining = remaining;
      }

      // Update task
      await updateDoc(doc(firestore, 'tasks', task.id), updateData);

      toast({
        title: 'تم الحفظ ✅',
        description: 'تم تحديث بيانات المهمة بنجاح',
      });

      // Redirect back to task details
      router.push(`/dashboard/tasks/${task.id}`);
    } catch (error: any) {
      console.error('Error saving task:', error);
      toast({
        variant: 'destructive',
        title: 'فشل الحفظ',
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!task || !canEdit) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-headline font-bold">تعديل المهمة</h1>
          <p className="text-muted-foreground">المهمة #{task.taskId}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle>معلومات العميل</CardTitle>
            <CardDescription>البيانات الأساسية للعميل</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Client Name */}
            <div className="space-y-2">
              <Label htmlFor="clientName">
                اسم العميل <span className="text-red-500">*</span>
              </Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="أدخل اسم العميل الكامل"
                required
              />
            </div>

            {/* Client Phone */}
            <div className="space-y-2">
              <Label htmlFor="clientPhone">
                رقم الهاتف <span className="text-red-500">*</span>
              </Label>
              <Input
                id="clientPhone"
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="01234567890"
                required
              />
            </div>

            {/* Client Email */}
            <div className="space-y-2">
              <Label htmlFor="clientEmail">البريد الإلكتروني</Label>
              <Input
                id="clientEmail"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="example@email.com"
              />
            </div>

            {/* Job Title */}
            <div className="space-y-2">
              <Label htmlFor="clientJobTitle">المسمى الوظيفي</Label>
              <Input
                id="clientJobTitle"
                value={clientJobTitle}
                onChange={(e) => setClientJobTitle(e.target.value)}
                placeholder="مثل: مدير مبيعات"
              />
            </div>
          </CardContent>
        </Card>

        {/* Task Status */}
        <Card>
          <CardHeader>
            <CardTitle>حالة المهمة</CardTitle>
            <CardDescription>تحديث حالة المهمة الحالية</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="status">الحالة</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle>المعلومات المالية</CardTitle>
            <CardDescription>
              {isModerator
                ? 'عرض البيانات المالية (للتعديل تواصل مع المدير)'
                : 'تحديث البيانات المالية للمهمة'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isModerator && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ملاحظة: لا يمكن للمشرف تعديل المبالغ المالية. فقط المدير يمكنه ذلك.
                </p>
              </div>
            )}

            {/* Currency */}
            <div className="space-y-2">
              <Label htmlFor="currency">العملة</Label>
              <Select
                value={financialCurrency}
                onValueChange={setFinancialCurrency}
                disabled={isModerator}
              >
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EGP">جنيه مصري (EGP)</SelectItem>
                  <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                  <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                  <SelectItem value="AED">درهم إماراتي (AED)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Total Amount */}
              <div className="space-y-2">
                <Label htmlFor="financialTotal">المبلغ الإجمالي</Label>
                <Input
                  id="financialTotal"
                  type="number"
                  min="0"
                  step="0.01"
                  value={financialTotal}
                  onChange={(e) => setFinancialTotal(e.target.value)}
                  placeholder="0.00"
                  disabled={isModerator}
                  className={isModerator ? 'bg-muted cursor-not-allowed' : ''}
                />
              </div>

              {/* Paid Amount */}
              <div className="space-y-2">
                <Label htmlFor="financialPaid">المبلغ المدفوع</Label>
                <Input
                  id="financialPaid"
                  type="number"
                  min="0"
                  step="0.01"
                  value={financialPaid}
                  onChange={(e) => setFinancialPaid(e.target.value)}
                  placeholder="0.00"
                  disabled={isModerator}
                  className={isModerator ? 'bg-muted cursor-not-allowed' : ''}
                />
              </div>
            </div>

            {/* Remaining (calculated) */}
            {financialTotal && financialPaid && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">المبلغ المتبقي:</span>
                  <span className="text-lg font-bold">
                    {(parseFloat(financialTotal) - parseFloat(financialPaid)).toFixed(2)}{' '}
                    {financialCurrency}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>ملاحظات</CardTitle>
            <CardDescription>ملاحظات إضافية حول المهمة</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي ملاحظات إضافية..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                حفظ التغييرات
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
          >
            إلغاء
          </Button>
        </div>
      </form>
    </div>
  );
}
