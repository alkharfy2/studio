/**
 * Form Validation Utilities
 * مكتبة شاملة للتحقق من صحة البيانات مع رسائل خطأ واضحة بالعربية
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// ============================================
// Email Validation
// ============================================

export function validateEmail(email: string): ValidationResult {
  if (!email || !email.trim()) {
    return {
      isValid: false,
      error: 'البريد الإلكتروني مطلوب',
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return {
      isValid: false,
      error: 'البريد الإلكتروني غير صحيح. مثال: user@example.com',
    };
  }

  return { isValid: true };
}

// ============================================
// Password Validation
// ============================================

export interface PasswordRequirements {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumber?: boolean;
  requireSpecialChar?: boolean;
}

export function validatePassword(
  password: string,
  requirements: PasswordRequirements = {
    minLength: 6,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecialChar: false,
  }
): ValidationResult {
  if (!password) {
    return {
      isValid: false,
      error: 'كلمة السر مطلوبة',
    };
  }

  const { minLength = 6, requireUppercase, requireLowercase, requireNumber, requireSpecialChar } = requirements;

  if (password.length < minLength) {
    return {
      isValid: false,
      error: `كلمة السر يجب أن تكون ${minLength} أحرف على الأقل`,
    };
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    return {
      isValid: false,
      error: 'كلمة السر يجب أن تحتوي على حرف كبير (A-Z)',
    };
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    return {
      isValid: false,
      error: 'كلمة السر يجب أن تحتوي على حرف صغير (a-z)',
    };
  }

  if (requireNumber && !/[0-9]/.test(password)) {
    return {
      isValid: false,
      error: 'كلمة السر يجب أن تحتوي على رقم (0-9)',
    };
  }

  if (requireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return {
      isValid: false,
      error: 'كلمة السر يجب أن تحتوي على رمز خاص (!@#$%...)',
    };
  }

  return { isValid: true };
}

export function validatePasswordMatch(password: string, confirmPassword: string): ValidationResult {
  if (!confirmPassword) {
    return {
      isValid: false,
      error: 'تأكيد كلمة السر مطلوب',
    };
  }

  if (password !== confirmPassword) {
    return {
      isValid: false,
      error: 'كلمة السر غير متطابقة',
    };
  }

  return { isValid: true };
}

// ============================================
// Phone Number Validation
// ============================================

export function validatePhoneNumber(phone: string, required: boolean = true): ValidationResult {
  if (!phone || !phone.trim()) {
    if (required) {
      return {
        isValid: false,
        error: 'رقم الهاتف مطلوب',
      };
    }
    return { isValid: true };
  }

  // Remove spaces and special characters
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

  // Egyptian phone numbers: 10-11 digits
  // International: 10-15 digits
  const phoneRegex = /^[0-9]{10,15}$/;

  if (!phoneRegex.test(cleanPhone)) {
    return {
      isValid: false,
      error: 'رقم الهاتف غير صحيح. يجب أن يكون 10-15 رقماً',
    };
  }

  // Egyptian specific validation
  if (cleanPhone.startsWith('01') && cleanPhone.length !== 11) {
    return {
      isValid: false,
      error: 'رقم الهاتف المصري يجب أن يكون 11 رقماً (مثال: 01012345678)',
    };
  }

  return { isValid: true };
}

// ============================================
// Name Validation
// ============================================

export function validateName(name: string, minLength: number = 3): ValidationResult {
  if (!name || !name.trim()) {
    return {
      isValid: false,
      error: 'الاسم مطلوب',
    };
  }

  if (name.trim().length < minLength) {
    return {
      isValid: false,
      error: `الاسم يجب أن يكون ${minLength} أحرف على الأقل`,
    };
  }

  // Check for valid characters (Arabic, English, spaces)
  const nameRegex = /^[\u0600-\u06FFa-zA-Z\s]+$/;
  if (!nameRegex.test(name.trim())) {
    return {
      isValid: false,
      error: 'الاسم يجب أن يحتوي على أحرف عربية أو إنجليزية فقط',
    };
  }

  return { isValid: true };
}

// ============================================
// Number Validation
// ============================================

export function validateNumber(
  value: string | number,
  options: {
    required?: boolean;
    min?: number;
    max?: number;
    integer?: boolean;
  } = {}
): ValidationResult {
  const { required = true, min, max, integer = false } = options;

  if (value === '' || value === null || value === undefined) {
    if (required) {
      return {
        isValid: false,
        error: 'الحقل مطلوب',
      };
    }
    return { isValid: true };
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return {
      isValid: false,
      error: 'يجب إدخال رقم صحيح',
    };
  }

  if (integer && !Number.isInteger(num)) {
    return {
      isValid: false,
      error: 'يجب إدخال رقم صحيح بدون كسور',
    };
  }

  if (min !== undefined && num < min) {
    return {
      isValid: false,
      error: `القيمة يجب أن تكون ${min} على الأقل`,
    };
  }

  if (max !== undefined && num > max) {
    return {
      isValid: false,
      error: `القيمة يجب أن لا تتجاوز ${max}`,
    };
  }

  return { isValid: true };
}

// ============================================
// URL Validation
// ============================================

export function validateURL(url: string, required: boolean = false): ValidationResult {
  if (!url || !url.trim()) {
    if (required) {
      return {
        isValid: false,
        error: 'الرابط مطلوب',
      };
    }
    return { isValid: true };
  }

  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return {
      isValid: false,
      error: 'الرابط غير صحيح. مثال: https://example.com',
    };
  }
}

// ============================================
// Required Field Validation
// ============================================

export function validateRequired(value: any, fieldName: string = 'الحقل'): ValidationResult {
  if (value === null || value === undefined || value === '') {
    return {
      isValid: false,
      error: `${fieldName} مطلوب`,
    };
  }

  if (typeof value === 'string' && !value.trim()) {
    return {
      isValid: false,
      error: `${fieldName} مطلوب`,
    };
  }

  if (Array.isArray(value) && value.length === 0) {
    return {
      isValid: false,
      error: `يجب اختيار ${fieldName} واحد على الأقل`,
    };
  }

  return { isValid: true };
}

// ============================================
// Arabic to English Number Conversion
// ============================================

export function convertArabicToEnglishNumbers(str: string): string {
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

  let result = str;
  arabicNumbers.forEach((arabic, index) => {
    result = result.replace(new RegExp(arabic, 'g'), englishNumbers[index]);
  });

  return result;
}

// ============================================
// File Validation
// ============================================

export function validateFile(
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[]; // MIME types
    allowedExtensions?: string[];
  } = {}
): ValidationResult {
  const {
    maxSize = 8 * 1024 * 1024, // 8MB default
    allowedTypes = [],
    allowedExtensions = [],
  } = options;

  if (!file) {
    return {
      isValid: false,
      error: 'لم يتم اختيار ملف',
    };
  }

  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `حجم الملف كبير جداً. الحد الأقصى: ${maxSizeMB} ميجابايت`,
    };
  }

  // Check MIME type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `نوع الملف غير مدعوم. الأنواع المسموحة: ${allowedTypes.join(', ')}`,
    };
  }

  // Check file extension
  if (allowedExtensions.length > 0) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      return {
        isValid: false,
        error: `امتداد الملف غير مدعوم. الامتدادات المسموحة: ${allowedExtensions.join(', ')}`,
      };
    }
  }

  return { isValid: true };
}

// ============================================
// Form Validator (Batch Validation)
// ============================================

export interface FieldValidation {
  value: any;
  validator: (value: any) => ValidationResult;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateForm(fields: Record<string, FieldValidation>): FormValidationResult {
  const errors: Record<string, string> = {};

  Object.entries(fields).forEach(([fieldName, { value, validator }]) => {
    const result = validator(value);
    if (!result.isValid && result.error) {
      errors[fieldName] = result.error;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// ============================================
// Helper: Get Validation Message
// ============================================

export function getValidationMessage(result: ValidationResult, successMessage?: string): string {
  if (result.isValid) {
    return successMessage || '';
  }
  return result.error || 'خطأ في التحقق من البيانات';
}
