'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { X, Plus, Calendar, Save, Loader2 } from 'lucide-react';
import { FileUpload } from '@/components/ui/file-upload';
import { uploadMultipleFiles } from '@/lib/storage-service';
import { STORAGE_FOLDERS } from '@/lib/supabase';
import type { Experience, Service, ServiceType, LanguageType, DeliveryTimeType } from '@/lib/types';
import { notifyTaskCreated } from '@/lib/notifications';

// قوائم الخيارات
const SERVICE_TYPES: ServiceType[] = [
  'سيرة ذاتية (ATS)',
  'سيرة ذاتية (Standard)',
  'تحسين بروفايل لينكدإن',
  'سيرة ذاتية بنمط Europass',
  'بورتفوليو أعمال',
  'التقديم على 1000 وظيفة',
  'تعديل/تحسين السيرة',
  'سيرة ذاتية بنمط الخليج',
];

const LANGUAGES: LanguageType[] = [
  'عربي',
  'إنجليزي',
  'ثنائي (ع+E)',
  'فرنسي',
  'ألماني',
  'صيني',
  'ياباني',
  'روسي',
  'برتغالي',
];

const DELIVERY_TIMES: DeliveryTimeType[] = [
  '3 ساعات',
  '6 ساعات',
  '12 ساعة',
  '24 ساعة',
  '48 ساعة',
  '72 ساعة',
];

const WHATSAPP_SOURCES = [
  '1065236963',
  '1550363738',
  '1507178299',
  '1001482501',
];

const PAYMENT_METHODS = [
  'instapay',
  'فودافون كاش 1065236963',
  'فودافون كاش 01029010778',
  'Payment request paysky',
  'لينك دفع كاشير',
  'تحويل بنكي',
];

const MONTHS = [
  '01', '02', '03', '04', '05', '06',
  '07', '08', '09', '10', '11', '12',
];

const YEARS = Array.from({ length: 111 }, (_, i) => (1990 + i).toString()); // 1990-2100

export default function CreateTaskPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  // حالة التحميل
  const [loading, setLoading] = useState(false);
  const [designers, setDesigners] = useState<any[]>([]);
  const [moderators, setModerators] = useState<any[]>([]);

  // معرف المهمة الفريد
  const [taskId] = useState(`${Date.now()}`);

  // 1. بيانات العميل
  const [clientName, setClientName] = useState('');
  const [whatsappSource, setWhatsappSource] = useState('');
  const [clientJobTitle, setClientJobTitle] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientWhatsapp, setClientWhatsapp] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientEducation, setClientEducation] = useState('');
  const [clientSkills, setClientSkills] = useState('');
  const [clientSkillsList, setClientSkillsList] = useState<string[]>([]);
  const [clientExperience, setClientExperience] = useState('');
  const [clientExperienceList, setClientExperienceList] = useState<Experience[]>([]);
  const [taskDate, setTaskDate] = useState(new Date().toISOString().split('T')[0]);

  // 2. الخدمات
  const [services, setServices] = useState<Service[]>([]);

  // 3. التعيين
  const [designerId, setDesignerId] = useState('');
  const [moderatorId, setModeratorId] = useState('');

  // 4. المالية
  const [financialTotal, setFinancialTotal] = useState('');
  const [financialPaid, setFinancialPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  // 5. المرفقات
  const [oldCvUrls, setOldCvUrls] = useState<string[]>([]);
  const [certificatesUrls, setCertificatesUrls] = useState<string[]>([]);
  const [imagesUrls, setImagesUrls] = useState<string[]>([]);
  const [payment1Urls, setPayment1Urls] = useState<string[]>([]);
  const [payment2Urls, setPayment2Urls] = useState<string[]>([]);

  // 6. ملاحظات
  const [notes, setNotes] = useState('');

  // تحميل المصممين والمشرفين
  useEffect(() => {
    const loadUsers = async () => {
      try {
        // تحميل المصممين
        const designersQuery = query(
          collection(firestore, 'users'),
          where('role', '==', 'designer')
        );
        const designersSnap = await getDocs(designersQuery);
        const designersData = designersSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDesigners(designersData);

        // تحميل المشرفين
        const moderatorsQuery = query(
          collection(firestore, 'users'),
          where('role', '==', 'moderator')
        );
        const moderatorsSnap = await getDocs(moderatorsQuery);
        const moderatorsData = moderatorsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setModerators(moderatorsData);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };

    loadUsers();
  }, [firestore]);

  // دالة رفع الملفات
  const handleFileUpload = async (files: File[], folder: string) => {
    const urls = await uploadMultipleFiles(files, taskId, folder as any);
    return urls;
  };

  // إضافة مهارة
  const addSkill = () => {
    const skill = prompt('أدخل المهارة:');
    if (skill && skill.trim()) {
      setClientSkillsList([...clientSkillsList, skill.trim()]);
    }
  };

  // حذف مهارة
  const removeSkill = (index: number) => {
    setClientSkillsList(clientSkillsList.filter((_, i) => i !== index));
  };

  // إضافة خبرة
  const addExperience = () => {
    const newExperience: Experience = {
      companyName: '',
      jobTitle: '',
      startMonth: '01',
      startYear: '2020',
      isCurrent: false,
      notes: '',
    };
    setClientExperienceList([...clientExperienceList, newExperience]);
  };

  // تحديث خبرة
  const updateExperience = (index: number, field: keyof Experience, value: any) => {
    const updated = [...clientExperienceList];
    updated[index] = { ...updated[index], [field]: value };
    setClientExperienceList(updated);
  };

  // حذف خبرة
  const removeExperience = (index: number) => {
    setClientExperienceList(clientExperienceList.filter((_, i) => i !== index));
  };

  // إضافة خدمة
  const addService = () => {
    const newService: Service = {
      type: 'سيرة ذاتية (ATS)',
      language: 'عربي',
      deliveryTime: '24 ساعة',
      notes: '',
    };
    setServices([...services, newService]);
  };

  // تحديث خدمة
  const updateService = (index: number, field: keyof Service, value: any) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value };
    setServices(updated);
  };

  // حذف خدمة
  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  // حساب المتبقي
  const financialRemaining = financialTotal && financialPaid
    ? parseFloat(financialTotal) - parseFloat(financialPaid)
    : 0;

  // حفظ المهمة
  const handleSave = async () => {
    // التحقق من الحقول المطلوبة
    if (!clientName.trim()) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'الاسم الكامل مطلوب' });
      return;
    }
    if (!clientPhone.trim()) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'رقم التليفون مطلوب' });
      return;
    }
    if (!designerId) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'يجب اختيار مصمم' });
      return;
    }
    if (!moderatorId) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'يجب اختيار مشرف' });
      return;
    }
    if (services.length === 0) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'يجب إضافة خدمة واحدة على الأقل' });
      return;
    }
    if (!financialTotal || !financialPaid) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'المبالغ المالية مطلوبة' });
      return;
    }

    setLoading(true);

    try {
      // حساب موعد التسليم
      const maxDeliveryHours = Math.max(
        ...services.map((s) => {
          const match = s.deliveryTime.match(/\d+/);
          return match ? parseInt(match[0]) : 24;
        })
      );
      const dueDate = new Date(taskDate);
      dueDate.setHours(dueDate.getHours() + maxDeliveryHours);

      // إنشاء المهمة
      const docRef = await addDoc(collection(firestore, 'tasks'), {
        taskId,
        clientName,
        clientJobTitle,
        clientPhone,
        clientEmail,
        clientWhatsapp,
        clientAddress,
        clientEducation,
        clientSkills,
        clientSkillsList,
        clientExperience,
        clientExperienceList,
        services,
        designerId,
        moderatorId,
        status: 'new',
        financialTotal: parseFloat(financialTotal),
        financialPaid: parseFloat(financialPaid),
        financialRemaining,
        financialCurrency: 'EGP',
        whatsappSource,
        paymentMethod,
        oldCvUrls,
        certificatesUrls,
        imagesUrls,
        payment1Urls,
        payment2Urls,
        deliveryUrls: [],
        notes,
        deliveryLink: '',
        taskDate: new Date(taskDate),
        dueDate,
        createdAt: serverTimestamp(),
        createdBy: user?.uid || '',
        updatedAt: serverTimestamp(),
      });

      // إرسال إشعارات للمصمم والمشرف
      try {
        await notifyTaskCreated(
          firestore,
          docRef.id,
          taskId,
          clientName,
          designerId,
          moderatorId
        );
      } catch (notifError) {
        console.error('Error sending notifications:', notifError);
        // لا نوقف العملية إذا فشلت الإشعارات
      }

      toast({ title: 'نجح!', description: 'تم حفظ المهمة بنجاح ✅' });

      // إعادة التوجيه
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Error saving task:', error);
      toast({ variant: 'destructive', title: 'فشل', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[980px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">تسجيل مهمة / عميل جديد</h1>
          <p className="text-muted-foreground">املأ جميع البيانات المطلوبة</p>
        </div>
        <Button onClick={handleSave} disabled={loading} size="lg" className="gap-2">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              حفظ المهمة
            </>
          )}
        </Button>
      </div>

      {/* البطاقة 1: بيانات العميل */}
      <Card>
        <CardHeader>
          <CardTitle>1️⃣ بيانات العميل</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* صف 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientName">الاسم الكامل *</Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="مثال: أحمد محمد"
                required
              />
            </div>
            <div>
              <Label htmlFor="whatsappSource">مصدر واتساب</Label>
              <Select value={whatsappSource} onValueChange={setWhatsappSource}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المصدر..." />
                </SelectTrigger>
                <SelectContent>
                  {WHATSAPP_SOURCES.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* صف 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientJobTitle">المسمى الوظيفي</Label>
              <Input
                id="clientJobTitle"
                value={clientJobTitle}
                onChange={(e) => setClientJobTitle(e.target.value)}
                placeholder="مثال: مهندس برمجيات"
              />
            </div>
            <div>
              <Label htmlFor="clientPhone">رقم التليفون *</Label>
              <Input
                id="clientPhone"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                required
              />
            </div>
          </div>

          {/* صف 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientEmail">البريد الإلكتروني</Label>
              <Input
                id="clientEmail"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="example@domain.com"
              />
            </div>
            <div>
              <Label htmlFor="clientWhatsapp">رقم الواتساب</Label>
              <Input
                id="clientWhatsapp"
                value={clientWhatsapp}
                onChange={(e) => setClientWhatsapp(e.target.value)}
                placeholder="01XXXXXXXXX"
              />
            </div>
          </div>

          {/* صف 4 */}
          <div>
            <Label htmlFor="clientAddress">العنوان</Label>
            <Input
              id="clientAddress"
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
              placeholder="المدينة، الحي..."
            />
          </div>

          {/* صف 5 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientEducation">التعليم</Label>
              <Input
                id="clientEducation"
                value={clientEducation}
                onChange={(e) => setClientEducation(e.target.value)}
                placeholder="مثال: بكالوريوس هندسة"
              />
            </div>
            <div>
              <Label htmlFor="clientSkills">المهارات (نص حر)</Label>
              <Input
                id="clientSkills"
                value={clientSkills}
                onChange={(e) => setClientSkills(e.target.value)}
                placeholder="Python, React, etc..."
              />
            </div>
          </div>

          {/* المهارات المنظمة */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>المهارات المنظمة</Label>
              <Button type="button" variant="outline" size="sm" onClick={addSkill}>
                <Plus className="h-4 w-4 mr-1" />
                إضافة مهارة
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {clientSkillsList.map((skill, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {skill}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => removeSkill(index)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* الخبرات (نص حر) */}
          <div>
            <Label htmlFor="clientExperience">الخبرات (نص حر)</Label>
            <Textarea
              id="clientExperience"
              value={clientExperience}
              onChange={(e) => setClientExperience(e.target.value)}
              placeholder="اكتب ملخص الخبرات..."
              rows={3}
            />
          </div>

          {/* الخبرات التفصيلية */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>الخبرات التفصيلية</Label>
              <Button type="button" variant="outline" size="sm" onClick={addExperience}>
                <Plus className="h-4 w-4 mr-1" />
                إضافة خبرة
              </Button>
            </div>
            <div className="space-y-4">
              {clientExperienceList.map((exp, index) => (
                <Card key={index} className="relative">
                  <button
                    type="button"
                    onClick={() => removeExperience(index)}
                    className="absolute top-2 right-2 text-destructive hover:bg-destructive/10 rounded-full p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <CardContent className="pt-6 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        placeholder="اسم الشركة"
                        value={exp.companyName}
                        onChange={(e) =>
                          updateExperience(index, 'companyName', e.target.value)
                        }
                      />
                      <Input
                        placeholder="المسمى الوظيفي"
                        value={exp.jobTitle}
                        onChange={(e) => updateExperience(index, 'jobTitle', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <Select
                        value={exp.startMonth}
                        onValueChange={(v) => updateExperience(index, 'startMonth', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MONTHS.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={exp.startYear}
                        onValueChange={(v) => updateExperience(index, 'startYear', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {YEARS.map((y) => (
                            <SelectItem key={y} value={y}>
                              {y}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2 col-span-2">
                        <input
                          type="checkbox"
                          id={`current-${index}`}
                          checked={exp.isCurrent}
                          onChange={(e) =>
                            updateExperience(index, 'isCurrent', e.target.checked)
                          }
                          className="rounded"
                        />
                        <label htmlFor={`current-${index}`} className="text-sm">
                          حالياً
                        </label>
                      </div>
                    </div>
                    {!exp.isCurrent && (
                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          value={exp.endMonth || '01'}
                          onValueChange={(v) => updateExperience(index, 'endMonth', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="شهر النهاية" />
                          </SelectTrigger>
                          <SelectContent>
                            {MONTHS.map((m) => (
                              <SelectItem key={m} value={m}>
                                {m}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={exp.endYear || '2024'}
                          onValueChange={(v) => updateExperience(index, 'endYear', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="سنة النهاية" />
                          </SelectTrigger>
                          <SelectContent>
                            {YEARS.map((y) => (
                              <SelectItem key={y} value={y}>
                                {y}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <Textarea
                      placeholder="ملاحظات"
                      value={exp.notes}
                      onChange={(e) => updateExperience(index, 'notes', e.target.value)}
                      rows={2}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* تاريخ المهمة */}
          <div>
            <Label htmlFor="taskDate">تاريخ المهمة</Label>
            <Input
              id="taskDate"
              type="date"
              value={taskDate}
              onChange={(e) => setTaskDate(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* البطاقة 2: الخدمات */}
      <Card>
        <CardHeader>
          <CardTitle>2️⃣ الخدمات المطلوبة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={addService}>
              <Plus className="h-4 w-4 mr-1" />
              إضافة خدمة
            </Button>
          </div>

          {services.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              لم تتم إضافة خدمات بعد
            </div>
          )}

          <div className="space-y-4">
            {services.map((service, index) => (
              <Card key={index} className="relative">
                <button
                  type="button"
                  onClick={() => removeService(index)}
                  className="absolute top-2 right-2 text-destructive hover:bg-destructive/10 rounded-full p-1"
                >
                  <X className="h-4 w-4" />
                </button>
                <CardContent className="pt-6 space-y-3">
                  <div>
                    <Label>نوع الخدمة</Label>
                    <Select
                      value={service.type}
                      onValueChange={(v) => updateService(index, 'type', v as ServiceType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>اللغة</Label>
                      <Select
                        value={service.language}
                        onValueChange={(v) => updateService(index, 'language', v as LanguageType)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.map((lang) => (
                            <SelectItem key={lang} value={lang}>
                              {lang}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>وقت التسليم</Label>
                      <Select
                        value={service.deliveryTime}
                        onValueChange={(v) =>
                          updateService(index, 'deliveryTime', v as DeliveryTimeType)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DELIVERY_TIMES.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>ملاحظات (اختياري)</Label>
                    <Textarea
                      value={service.notes}
                      onChange={(e) => updateService(index, 'notes', e.target.value)}
                      rows={2}
                      placeholder="أي ملاحظات خاصة بالخدمة..."
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* البطاقة 3: التعيين */}
      <Card>
        <CardHeader>
          <CardTitle>3️⃣ التعيين</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="designerId">المصمم *</Label>
              <Select value={designerId} onValueChange={setDesignerId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر مصمم..." />
                </SelectTrigger>
                <SelectContent>
                  {designers.map((designer) => (
                    <SelectItem key={designer.id} value={designer.uid}>
                      {designer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="moderatorId">المشرف *</Label>
              <Select value={moderatorId} onValueChange={setModeratorId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر مشرف..." />
                </SelectTrigger>
                <SelectContent>
                  {moderators.map((moderator) => (
                    <SelectItem key={moderator.id} value={moderator.uid}>
                      {moderator.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* البطاقة 4: الجزء المالي */}
      <Card>
        <CardHeader>
          <CardTitle>4️⃣ الجزء المالي</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="financialTotal">المبلغ الإجمالي *</Label>
              <Input
                id="financialTotal"
                type="number"
                value={financialTotal}
                onChange={(e) => setFinancialTotal(e.target.value)}
                placeholder="0"
                required
              />
            </div>
            <div>
              <Label htmlFor="financialPaid">المبلغ المدفوع *</Label>
              <Input
                id="financialPaid"
                type="number"
                value={financialPaid}
                onChange={(e) => setFinancialPaid(e.target.value)}
                placeholder="0"
                required
              />
            </div>
            <div>
              <Label htmlFor="financialRemaining">المتبقي</Label>
              <Input
                id="financialRemaining"
                type="number"
                value={financialRemaining}
                readOnly
                className="bg-muted"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="paymentMethod">طريقة الدفع</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر طريقة..." />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>العملة</Label>
              <Input value="EGP" readOnly className="bg-muted" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* البطاقة 5: مرفقات العميل */}
      <Card>
        <CardHeader>
          <CardTitle>5️⃣ مرفقات العميل</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <FileUpload
            label="CV قديم"
            description="ارفع السيرة الذاتية القديمة للعميل"
            value={oldCvUrls}
            onChange={setOldCvUrls}
            onUpload={(files) => handleFileUpload(files, STORAGE_FOLDERS.OLD_CV)}
            multiple
          />

          <FileUpload
            label="الشهادات"
            description="ارفع الشهادات والمؤهلات"
            value={certificatesUrls}
            onChange={setCertificatesUrls}
            onUpload={(files) => handleFileUpload(files, STORAGE_FOLDERS.CERTIFICATES)}
            multiple
          />

          <FileUpload
            label="الصور"
            description="ارفع الصور الشخصية"
            value={imagesUrls}
            onChange={setImagesUrls}
            onUpload={(files) => handleFileUpload(files, STORAGE_FOLDERS.IMAGES)}
            multiple
          />

          <FileUpload
            label="إيصال الدفعة الأولى"
            description="ارفع إيصال الدفعة الأولى"
            value={payment1Urls}
            onChange={setPayment1Urls}
            onUpload={(files) => handleFileUpload(files, STORAGE_FOLDERS.PAYMENT_1)}
            multiple
          />

          <FileUpload
            label="إيصال الدفعة الثانية"
            description="ارفع إيصال الدفعة الثانية"
            value={payment2Urls}
            onChange={setPayment2Urls}
            onUpload={(files) => handleFileUpload(files, STORAGE_FOLDERS.PAYMENT_2)}
            multiple
          />
        </CardContent>
      </Card>

      {/* البطاقة 6: ملاحظات عامة */}
      <Card>
        <CardHeader>
          <CardTitle>6️⃣ ملاحظات عامة</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="أي ملاحظات أو تعليمات إضافية..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* زر الحفظ النهائي */}
      <div className="flex justify-end gap-3 pb-8">
        <Button variant="outline" onClick={() => router.back()}>
          إلغاء
        </Button>
        <Button onClick={handleSave} disabled={loading} size="lg" className="gap-2">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              حفظ المهمة
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
