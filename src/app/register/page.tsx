'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserPlus, Mail, Lock, User, Phone, Loader2, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ROLES = [
  { value: 'client', label: 'عميل (Client)' },
  { value: 'designer', label: 'مصمم (Designer)' },
  { value: 'moderator', label: 'مشرف (Moderator)' },
  { value: 'team_leader', label: 'قائد فريق (Team Leader)' },
  { value: 'admin', label: 'مدير (Admin)' },
] as const;

interface FormErrors {
  name?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<string>('client');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Real-time validation
  const validateField = (fieldName: string, value: string): string | undefined => {
    switch (fieldName) {
      case 'name':
        if (!value.trim()) return 'الاسم الكامل مطلوب';
        if (value.trim().length < 3) return 'الاسم يجب أن يكون 3 أحرف على الأقل';
        return undefined;

      case 'email':
        if (!value.trim()) return 'البريد الإلكتروني مطلوب';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'البريد الإلكتروني غير صحيح';
        return undefined;

      case 'phoneNumber':
        if (!value.trim()) return 'رقم الهاتف مطلوب';
        const phoneRegex = /^[0-9]{10,15}$/;
        if (!phoneRegex.test(value.replace(/\s/g, ''))) {
          return 'رقم الهاتف يجب أن يكون بين 10-15 رقماً';
        }
        return undefined;

      case 'role':
        if (!value) return 'يرجى اختيار الدور';
        return undefined;

      case 'password':
        if (!value) return 'كلمة السر مطلوبة';
        if (value.length < 6) return 'كلمة السر يجب أن تكون 6 أحرف على الأقل';
        if (!/(?=.*[a-z])/.test(value)) return 'كلمة السر يجب أن تحتوي على حرف صغير';
        if (!/(?=.*[A-Z])/.test(value)) return 'كلمة السر يجب أن تحتوي على حرف كبير';
        if (!/(?=.*[0-9])/.test(value)) return 'كلمة السر يجب أن تحتوي على رقم';
        return undefined;

      case 'confirmPassword':
        if (!value) return 'تأكيد كلمة السر مطلوب';
        if (value !== password) return 'كلمة السر غير متطابقة';
        return undefined;

      default:
        return undefined;
    }
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    // Update value
    switch (fieldName) {
      case 'name': setName(value); break;
      case 'email': setEmail(value); break;
      case 'phoneNumber': setPhoneNumber(value); break;
      case 'role': setRole(value); break;
      case 'password': setPassword(value); break;
      case 'confirmPassword': setConfirmPassword(value); break;
    }

    // Validate if touched
    if (touched[fieldName]) {
      const error = validateField(fieldName, value);
      setErrors(prev => ({
        ...prev,
        [fieldName]: error,
      }));
    }
  };

  const handleFieldBlur = (fieldName: string, value: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    const error = validateField(fieldName, value);
    setErrors(prev => ({
      ...prev,
      [fieldName]: error,
    }));
  };

  const validateAllFields = (): boolean => {
    const newErrors: FormErrors = {
      name: validateField('name', name),
      email: validateField('email', email),
      phoneNumber: validateField('phoneNumber', phoneNumber),
      role: validateField('role', role),
      password: validateField('password', password),
      confirmPassword: validateField('confirmPassword', confirmPassword),
    };

    setErrors(newErrors);
    setTouched({
      name: true,
      email: true,
      phoneNumber: true,
      role: true,
      password: true,
      confirmPassword: true,
    });

    return !Object.values(newErrors).some(error => error !== undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAllFields()) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يرجى تصحيح الأخطاء في النموذج',
        variant: 'destructive',
      });
      return;
    }

    if (!auth || !firestore) {
      toast({
        title: 'خطأ',
        description: 'خدمة المصادقة غير متاحة. يرجى تحديث الصفحة.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user document in Firestore
      await setDoc(doc(firestore, 'users', user.uid), {
        uid: user.uid,
        email: email,
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        role: role,
        isActive: true,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });

      toast({
        title: 'تم التسجيل بنجاح! 🎉',
        description: 'مرحباً بك في نظام Cveeez',
      });

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);

      let errorMessage = 'حدث خطأ أثناء التسجيل';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'البريد الإلكتروني مستخدم بالفعل';
        setErrors(prev => ({ ...prev, email: errorMessage }));
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'كلمة السر ضعيفة جداً';
        setErrors(prev => ({ ...prev, password: errorMessage }));
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'البريد الإلكتروني غير صحيح';
        setErrors(prev => ({ ...prev, email: errorMessage }));
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'فشل الاتصال بالإنترنت';
      }

      toast({
        title: 'فشل التسجيل',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500">
      <Card className="w-full max-w-md backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 shadow-2xl border-2 border-white/20">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            إنشاء حساب جديد
          </CardTitle>
          <CardDescription className="text-base">
            املأ البيانات للانضمام إلى Cveeez
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                الاسم الكامل <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="أدخل الاسم الكامل"
                  value={name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  onBlur={(e) => handleFieldBlur('name', e.target.value)}
                  disabled={loading}
                  className={`pl-10 ${errors.name && touched.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
              </div>
              {errors.name && touched.name && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <span>⚠️</span> {errors.name}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                البريد الإلكتروني <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="example@domain.com"
                  value={email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  onBlur={(e) => handleFieldBlur('email', e.target.value)}
                  disabled={loading}
                  className={`pl-10 ${errors.email && touched.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
              </div>
              {errors.email && touched.email && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <span>⚠️</span> {errors.email}
                </p>
              )}
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-sm font-medium">
                رقم الهاتف <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="01234567890"
                  value={phoneNumber}
                  onChange={(e) => handleFieldChange('phoneNumber', e.target.value)}
                  onBlur={(e) => handleFieldBlur('phoneNumber', e.target.value)}
                  disabled={loading}
                  className={`pl-10 ${errors.phoneNumber && touched.phoneNumber ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
              </div>
              {errors.phoneNumber && touched.phoneNumber && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <span>⚠️</span> {errors.phoneNumber}
                </p>
              )}
            </div>

            {/* Role Field */}
            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium">
                الدور <span className="text-red-500">*</span>
              </Label>
              <Select value={role} onValueChange={(value) => handleFieldChange('role', value)}>
                <SelectTrigger
                  id="role"
                  className={errors.role && touched.role ? 'border-red-500' : ''}
                  disabled={loading}
                >
                  <SelectValue placeholder="اختر الدور" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && touched.role && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <span>⚠️</span> {errors.role}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                كلمة السر <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="********"
                  value={password}
                  onChange={(e) => handleFieldChange('password', e.target.value)}
                  onBlur={(e) => handleFieldBlur('password', e.target.value)}
                  disabled={loading}
                  className={`pl-10 pr-10 ${errors.password && touched.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && touched.password && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <span>⚠️</span> {errors.password}
                </p>
              )}
              {!errors.password && touched.password && (
                <p className="text-xs text-gray-500">
                  يجب أن تحتوي على: حرف كبير، حرف صغير، رقم، و6 أحرف على الأقل
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                تأكيد كلمة السر <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="********"
                  value={confirmPassword}
                  onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                  onBlur={(e) => handleFieldBlur('confirmPassword', e.target.value)}
                  disabled={loading}
                  className={`pl-10 pr-10 ${errors.confirmPassword && touched.confirmPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && touched.confirmPassword && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <span>⚠️</span> {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جارٍ التسجيل...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  إنشاء الحساب
                </>
              )}
            </Button>

            {/* Login Link */}
            <div className="text-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">لديك حساب بالفعل؟ </span>
              <Link
                href="/login"
                className="text-purple-600 hover:text-purple-700 font-semibold hover:underline"
              >
                تسجيل الدخول
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
