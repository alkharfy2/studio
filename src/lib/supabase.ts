import { createClient } from '@supabase/supabase-js';

// التحقق من وجود متغيرات البيئة
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// إنشاء Supabase Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // نحن نستخدم Firebase للمصادقة
  },
});

// اسم الـ Bucket الرئيسي للملفات
export const STORAGE_BUCKET = 'cveeez-files';

// المجلدات المستخدمة في النظام
export const STORAGE_FOLDERS = {
  OLD_CV: 'old_cv',
  CERTIFICATES: 'certificates',
  IMAGES: 'images',
  PAYMENT_1: 'payment_1',
  PAYMENT_2: 'payment_2',
  DELIVERY: 'delivery',
} as const;

export type StorageFolder = typeof STORAGE_FOLDERS[keyof typeof STORAGE_FOLDERS];
