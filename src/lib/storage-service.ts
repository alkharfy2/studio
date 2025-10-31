import { supabase, STORAGE_BUCKET, StorageFolder } from './supabase';

/**
 * نتيجة رفع ملف
 */
export interface UploadResult {
  url: string;
  error: string | null;
  fileName?: string;
}

/**
 * الأنواع المدعومة للملفات
 */
const ALLOWED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/heic',
  'application/pdf',
];

/**
 * الحد الأقصى لحجم الملف (8 ميجابايت)
 */
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB

/**
 * التحقق من صحة الملف
 */
function validateFile(file: File): string | null {
  // التحقق من النوع
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `نوع الملف غير مدعوم. الأنواع المسموحة: PNG, JPG, WEBP, HEIC, PDF`;
  }

  // التحقق من الحجم
  if (file.size > MAX_FILE_SIZE) {
    return `الملف كبير جداً. الحد الأقصى: 8 ميجابايت`;
  }

  return null;
}

/**
 * رفع ملف واحد إلى Supabase Storage
 *
 * @param file الملف المراد رفعه
 * @param taskId معرف المهمة
 * @param folder المجلد الفرعي
 * @returns نتيجة الرفع (URL أو خطأ)
 */
export async function uploadFile(
  file: File,
  taskId: string,
  folder: StorageFolder
): Promise<UploadResult> {
  try {
    // التحقق من صحة الملف
    const validationError = validateFile(file);
    if (validationError) {
      return { url: '', error: validationError };
    }

    // تنظيف اسم الملف (إزالة الأحرف غير ASCII واستبدال المسافات)
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || '';
    // إنشاء اسم ملف آمن باستخدام timestamp فقط + الامتداد
    // نحتفظ بالاسم الأصلي في metadata لعرضه للمستخدم
    const safeFileName = `${timestamp}.${fileExtension}`;
    const fileName = safeFileName;

    // بناء المسار: tasks/{taskId}/{folder}/{fileName}
    const filePath = `tasks/${taskId}/${folder}/${fileName}`;

    // رفع الملف
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false, // عدم الكتابة فوق الملفات الموجودة
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return { url: '', error: error.message };
    }

    // الحصول على الـ Public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      error: null,
      fileName: file.name, // نعيد الاسم الأصلي للعرض
    };
  } catch (err) {
    console.error('Upload error:', err);
    return {
      url: '',
      error: err instanceof Error ? err.message : 'حدث خطأ أثناء رفع الملف',
    };
  }
}

/**
 * رفع ملفات متعددة
 *
 * @param files قائمة الملفات
 * @param taskId معرف المهمة
 * @param folder المجلد الفرعي
 * @param onProgress دالة callback لتتبع التقدم (اختياري)
 * @returns قائمة الـ URLs للملفات المرفوعة بنجاح
 */
export async function uploadMultipleFiles(
  files: File[],
  taskId: string,
  folder: StorageFolder,
  onProgress?: (current: number, total: number, fileName: string) => void
): Promise<string[]> {
  const urls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // إشعار بالتقدم
    onProgress?.(i + 1, files.length, file.name);

    const result = await uploadFile(file, taskId, folder);

    if (result.error) {
      console.error(`فشل رفع ${file.name}:`, result.error);
      // نستمر في رفع باقي الملفات حتى لو فشل ملف واحد
    } else {
      urls.push(result.url);
    }
  }

  return urls;
}

/**
 * حذف ملف من Storage
 *
 * @param fileUrl الـ URL الكامل للملف
 * @returns true إذا نجح الحذف، false إذا فشل
 */
export async function deleteFile(fileUrl: string): Promise<boolean> {
  try {
    // استخراج المسار من الـ URL
    const url = new URL(fileUrl);
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/);

    if (!pathMatch) {
      console.error('Invalid file URL');
      return false;
    }

    const filePath = pathMatch[1];

    // حذف الملف
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Delete error:', err);
    return false;
  }
}

/**
 * حذف جميع ملفات مهمة معينة
 *
 * @param taskId معرف المهمة
 * @returns true إذا نجح الحذف
 */
export async function deleteTaskFiles(taskId: string): Promise<boolean> {
  try {
    // حذف مجلد المهمة بالكامل
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([`tasks/${taskId}`]);

    if (error) {
      console.error('Delete task files error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Delete task files error:', err);
    return false;
  }
}
