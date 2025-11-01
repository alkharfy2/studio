'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
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
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  FileText,
  Upload,
  Download,
  Edit,
  Clock,
  DollarSign,
  CheckCircle2,
  Loader2,
  Trash2,
  Eye,
} from 'lucide-react';
import { FileUpload } from '@/components/ui/file-upload';
import { uploadMultipleFiles } from '@/lib/storage-service';
import { STORAGE_FOLDERS } from '@/lib/supabase';
import type { Task, Service, Experience } from '@/lib/types';
import { notifyTaskStatusChanged, notifyDeliveryUploaded } from '@/lib/notifications';
import { TaskTimeline } from '@/components/tasks/TaskTimeline';
import { TaskComments } from '@/components/tasks/TaskComments';
import { FilePreviewModal } from '@/components/tasks/FilePreviewModal';

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
    month: 'long',
    day: 'numeric',
  });
};

export default function TaskDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [deliveryUrls, setDeliveryUrls] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<any[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  // تحميل بيانات المهمة
  useEffect(() => {
    const loadTask = async () => {
      if (!params.id) return;

      try {
        setLoading(true);
        const taskDoc = await getDoc(doc(firestore, 'tasks', params.id as string));

        if (!taskDoc.exists()) {
          toast({
            variant: 'destructive',
            title: 'خطأ',
            description: 'المهمة غير موجودة',
          });
          router.push('/dashboard');
          return;
        }

        const taskData = { id: taskDoc.id, ...taskDoc.data() };
        setTask(taskData);
        setNewStatus(taskData.status || 'new');
        setDeliveryUrls(taskData.deliveryUrls || []);
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

  // تحديث حالة المهمة
  const handleUpdateStatus = async () => {
    if (!task || newStatus === task.status) return;

    setUpdating(true);
    try {
      await updateDoc(doc(firestore, 'tasks', task.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
        ...(newStatus === 'done' ? { completedAt: serverTimestamp() } : {}),
      });

      setTask({ ...task, status: newStatus });

      // إرسال إشعار بتحديث الحالة
      try {
        await notifyTaskStatusChanged(
          firestore,
          task.id,
          task.taskId,
          task.clientName,
          newStatus,
          task.moderatorId,
          task.designerId
        );
      } catch (notifError) {
        console.error('Error sending notification:', notifError);
      }

      toast({
        title: 'تم التحديث',
        description: `تم تغيير الحالة إلى: ${getStatusText(newStatus)}`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'فشل',
        description: error.message,
      });
    } finally {
      setUpdating(false);
    }
  };

  // حذف المهمة
  const handleDeleteTask = async () => {
    if (!task) return;

    setDeleting(true);
    try {
      await deleteDoc(doc(firestore, 'tasks', task.id));
      toast({
        title: 'تم الحذف',
        description: 'تم حذف المهمة بنجاح',
      });
      router.push('/dashboard/tasks');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'فشل',
        description: error.message,
      });
      setDeleting(false);
    }
  };

  // رفع ملفات التسليم
  const handleDeliveryUpload = async (files: File[]) => {
    const urls = await uploadMultipleFiles(files, task.taskId, STORAGE_FOLDERS.DELIVERY);
    return urls;
  };

  // حفظ ملفات التسليم
  const handleSaveDelivery = async () => {
    if (deliveryUrls.length === 0) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'يجب رفع ملف واحد على الأقل',
      });
      return;
    }

    setUpdating(true);
    try {
      await updateDoc(doc(firestore, 'tasks', task.id), {
        deliveryUrls,
        status: 'submitted',
        updatedAt: serverTimestamp(),
      });

      setTask({ ...task, deliveryUrls, status: 'submitted' });
      setNewStatus('submitted');

      // إرسال إشعار للمشرف بأن التسليم تم
      try {
        await notifyDeliveryUploaded(
          firestore,
          task.id,
          task.taskId,
          task.clientName,
          task.moderatorId
        );
      } catch (notifError) {
        console.error('Error sending notification:', notifError);
      }

      toast({
        title: 'تم الحفظ',
        description: 'تم رفع ملفات التسليم بنجاح',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'فشل',
        description: error.message,
      });
    } finally {
      setUpdating(false);
    }
  };

  // فتح معاينة الملف
  const handlePreviewFile = (files: string[], index: number) => {
    const fileObjects = files.map((url, i) => ({
      url,
      name: `ملف ${i + 1}`,
      type: url.toLowerCase().endsWith('.pdf') ? 'pdf' as const : 'image' as const,
    }));
    setPreviewFiles(fileObjects);
    setPreviewIndex(index);
    setShowPreview(true);
  };

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">المهمة غير موجودة</p>
      </div>
    );
  }

  // التحقق من الصلاحيات
  const canEdit = user?.role === 'admin' || user?.role === 'moderator';
  const canDelete = user?.role === 'admin';
  const canUpdateStatus = user?.uid === task.designerId || user?.uid === task.moderatorId || user?.role === 'admin';
  const canUploadDelivery = user?.uid === task.designerId;

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-headline font-bold">{task.clientName}</h1>
            <p className="text-muted-foreground">المهمة #{task.taskId}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge className={getStatusColor(task.status)}>
            {getStatusText(task.status)}
          </Badge>
          {canEdit && (
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/tasks/${task.id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              تعديل
            </Button>
          )}
          {canDelete && (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              حذف
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="details">التفاصيل</TabsTrigger>
          <TabsTrigger value="files">الملفات</TabsTrigger>
          <TabsTrigger value="delivery">التسليم</TabsTrigger>
          <TabsTrigger value="financial">المالية</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="comments">التعليقات</TabsTrigger>
        </TabsList>

        {/* Tab 1: التفاصيل */}
        <TabsContent value="details" className="space-y-6">
          {/* بيانات العميل */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                بيانات العميل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">الاسم الكامل</p>
                    <p className="font-medium">{task.clientName}</p>
                  </div>
                </div>

                {task.clientJobTitle && (
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">المسمى الوظيفي</p>
                      <p className="font-medium">{task.clientJobTitle}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">رقم التليفون</p>
                    <p className="font-medium">{task.clientPhone}</p>
                  </div>
                </div>

                {task.clientEmail && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                      <p className="font-medium">{task.clientEmail}</p>
                    </div>
                  </div>
                )}

                {task.clientWhatsapp && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">واتساب</p>
                      <p className="font-medium">{task.clientWhatsapp}</p>
                    </div>
                  </div>
                )}

                {task.clientAddress && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">العنوان</p>
                      <p className="font-medium">{task.clientAddress}</p>
                    </div>
                  </div>
                )}

                {task.clientEducation && (
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">التعليم</p>
                      <p className="font-medium">{task.clientEducation}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* المهارات */}
              {task.clientSkillsList && task.clientSkillsList.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">المهارات</p>
                  <div className="flex flex-wrap gap-2">
                    {task.clientSkillsList.map((skill: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* الخبرات */}
              {task.clientExperience && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">الخبرات</p>
                  <p className="text-sm whitespace-pre-wrap">{task.clientExperience}</p>
                </div>
              )}

              {/* الخبرات التفصيلية */}
              {task.clientExperienceList && task.clientExperienceList.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-3">الخبرات التفصيلية</p>
                  <div className="space-y-3">
                    {task.clientExperienceList.map((exp: Experience, index: number) => (
                      <Card key={index}>
                        <CardContent className="pt-4">
                          <h4 className="font-semibold">{exp.jobTitle}</h4>
                          <p className="text-sm text-muted-foreground">{exp.companyName}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {exp.startMonth}/{exp.startYear} -{' '}
                            {exp.isCurrent ? 'حالياً' : `${exp.endMonth}/${exp.endYear}`}
                          </p>
                          {exp.notes && (
                            <p className="text-sm mt-2">{exp.notes}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* الخدمات */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                الخدمات المطلوبة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {task.services?.map((service: Service, index: number) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-semibold">{service.type}</h4>
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            <span>اللغة: {service.language}</span>
                            <span>التسليم: {service.deliveryTime}</span>
                          </div>
                          {service.notes && (
                            <p className="text-sm mt-2">{service.notes}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* التواريخ */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                التواريخ المهمة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">تاريخ المهمة:</span>
                <span className="font-medium">{formatDate(task.taskDate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">تاريخ الإنشاء:</span>
                <span className="font-medium">{formatDate(task.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">موعد التسليم:</span>
                <span className="font-medium">{formatDate(task.dueDate)}</span>
              </div>
              {task.completedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">تاريخ الاكتمال:</span>
                  <span className="font-medium text-green-600">
                    {formatDate(task.completedAt)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* الملاحظات */}
          {task.notes && (
            <Card>
              <CardHeader>
                <CardTitle>ملاحظات</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{task.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* تحديث الحالة */}
          {canUpdateStatus && (
            <Card>
              <CardHeader>
                <CardTitle>تحديث حالة المهمة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">جديد</SelectItem>
                    <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                    <SelectItem value="submitted">تم التسليم</SelectItem>
                    <SelectItem value="to_review">قيد المراجعة</SelectItem>
                    <SelectItem value="done">مكتمل</SelectItem>
                    <SelectItem value="cancelled">ملغي</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleUpdateStatus}
                  disabled={updating || newStatus === task.status}
                  className="w-full"
                >
                  {updating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      جاري التحديث...
                    </>
                  ) : (
                    'تحديث الحالة'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab 2: الملفات */}
        <TabsContent value="files" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ملفات العميل</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {task.oldCvUrls && task.oldCvUrls.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">CV قديم</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {task.oldCvUrls.map((url: string, index: number) => (
                      <div key={index} className="flex gap-2">
                        <button
                          onClick={() => handlePreviewFile(task.oldCvUrls, index)}
                          className="flex-1 p-4 border rounded-lg hover:bg-muted transition-colors text-center"
                        >
                          <Eye className="h-6 w-6 mx-auto mb-2" />
                          <p className="text-xs truncate">ملف {index + 1}</p>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {task.certificatesUrls && task.certificatesUrls.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">الشهادات</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {task.certificatesUrls.map((url: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => handlePreviewFile(task.certificatesUrls, index)}
                        className="p-4 border rounded-lg hover:bg-muted transition-colors text-center"
                      >
                        <Eye className="h-6 w-6 mx-auto mb-2" />
                        <p className="text-xs truncate">شهادة {index + 1}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {task.imagesUrls && task.imagesUrls.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">الصور</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {task.imagesUrls.map((url: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => handlePreviewFile(task.imagesUrls, index)}
                        className="relative block aspect-square rounded-lg overflow-hidden border hover:opacity-80 transition-opacity"
                      >
                        <img
                          src={url}
                          alt={`صورة ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {task.payment1Urls && task.payment1Urls.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">إيصال الدفعة الأولى</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {task.payment1Urls.map((url: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => handlePreviewFile(task.payment1Urls, index)}
                        className="p-4 border rounded-lg hover:bg-muted transition-colors text-center"
                      >
                        <Eye className="h-6 w-6 mx-auto mb-2" />
                        <p className="text-xs truncate">إيصال {index + 1}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {task.payment2Urls && task.payment2Urls.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">إيصال الدفعة الثانية</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {task.payment2Urls.map((url: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => handlePreviewFile(task.payment2Urls, index)}
                        className="p-4 border rounded-lg hover:bg-muted transition-colors text-center"
                      >
                        <Eye className="h-6 w-6 mx-auto mb-2" />
                        <p className="text-xs truncate">إيصال {index + 1}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: التسليم */}
        <TabsContent value="delivery" className="space-y-6">
          {canUploadDelivery && (
            <Card>
              <CardHeader>
                <CardTitle>رفع ملفات التسليم</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FileUpload
                  label="الملفات النهائية"
                  description="ارفع الملفات النهائية المصممة"
                  value={deliveryUrls}
                  onChange={setDeliveryUrls}
                  onUpload={handleDeliveryUpload}
                  multiple
                />
                <Button
                  onClick={handleSaveDelivery}
                  disabled={updating || deliveryUrls.length === 0}
                  className="w-full"
                >
                  {updating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      حفظ ملفات التسليم
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* عرض ملفات التسليم */}
          {task.deliveryUrls && task.deliveryUrls.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>الملفات المسلمة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {task.deliveryUrls.map((url: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => handlePreviewFile(task.deliveryUrls, index)}
                      className="p-4 border rounded-lg hover:bg-muted transition-colors text-center"
                    >
                      <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-500" />
                      <p className="text-xs truncate">ملف {index + 1}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {task.deliveryLink && (
            <Card>
              <CardHeader>
                <CardTitle>رابط التسليم</CardTitle>
              </CardHeader>
              <CardContent>
                <a
                  href={task.deliveryLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {task.deliveryLink}
                </a>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab 4: المالية */}
        <TabsContent value="financial" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                البيانات المالية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-1">المبلغ الإجمالي</p>
                    <p className="text-2xl font-bold">
                      {task.financialTotal} {task.financialCurrency}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-1">المبلغ المدفوع</p>
                    <p className="text-2xl font-bold text-green-600">
                      {task.financialPaid} {task.financialCurrency}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-1">المتبقي</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {task.financialRemaining} {task.financialCurrency}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {task.paymentMethod && (
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="text-muted-foreground">طريقة الدفع:</span>
                  <span className="font-medium">{task.paymentMethod}</span>
                </div>
              )}

              {task.whatsappSource && (
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="text-muted-foreground">مصدر واتساب:</span>
                  <span className="font-medium">{task.whatsappSource}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Timeline */}
        <TabsContent value="timeline" className="space-y-6">
          <TaskTimeline
            currentStatus={task.status}
            createdAt={task.createdAt}
            updatedAt={task.updatedAt}
            completedAt={task.completedAt}
            statusHistory={task.statusHistory}
          />
        </TabsContent>

        {/* Tab 6: التعليقات */}
        <TabsContent value="comments" className="space-y-6">
          <TaskComments taskId={task.id} />
        </TabsContent>
      </Tabs>

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        files={previewFiles}
        initialIndex={previewIndex}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
            <AlertDialogDescription>
              هذا الإجراء لا يمكن التراجع عنه. سيتم حذف المهمة نهائياً من النظام.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTask}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  جاري الحذف...
                </>
              ) : (
                'حذف المهمة'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
