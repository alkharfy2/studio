'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { KeyRound, Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ForgotPasswordPage() {
  const auth = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [touched, setTouched] = useState(false);

  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) return 'البريد الإلكتروني مطلوب';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'البريد الإلكتروني غير صحيح';
    return undefined;
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (touched) {
      setError(validateEmail(value));
    }
  };

  const handleEmailBlur = () => {
    setTouched(true);
    setError(validateEmail(email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      setTouched(true);
      toast({
        title: 'خطأ في البيانات',
        description: validationError,
        variant: 'destructive',
      });
      return;
    }

    if (!auth) {
      toast({
        title: 'خطأ',
        description: 'خدمة المصادقة غير متاحة. يرجى تحديث الصفحة.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      });

      setEmailSent(true);
      toast({
        title: 'تم إرسال الرابط! ✅',
        description: 'تحقق من بريدك الإلكتروني لإعادة تعيين كلمة السر',
      });
    } catch (error: any) {
      console.error('Password reset error:', error);

      let errorMessage = 'حدث خطأ أثناء إرسال رابط إعادة التعيين';

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'لا يوجد حساب مرتبط بهذا البريد الإلكتروني';
        setError(errorMessage);
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'البريد الإلكتروني غير صحيح';
        setError(errorMessage);
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'فشل الاتصال بالإنترنت';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'تم إرسال طلبات كثيرة. يرجى المحاولة لاحقاً';
      }

      toast({
        title: 'فشل الإرسال',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500">
        <Card className="w-full max-w-md backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 shadow-2xl border-2 border-white/20">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              تم إرسال الرابط! ✅
            </CardTitle>
            <CardDescription className="text-base">
              تحقق من بريدك الإلكتروني
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                تم إرسال رابط إعادة تعيين كلمة السر إلى:
                <br />
                <strong className="font-semibold">{email}</strong>
              </AlertDescription>
            </Alert>

            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
              <p className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>افتح بريدك الإلكتروني واضغط على الرابط المرسل</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>إذا لم تجد الرسالة، تحقق من مجلد الرسائل غير المرغوب فيها (Spam)</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>الرابط صالح لمدة ساعة واحدة فقط</span>
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={() => setEmailSent(false)}
                variant="outline"
                className="w-full"
              >
                إرسال الرابط مرة أخرى
              </Button>

              <Link href="/login">
                <Button
                  variant="ghost"
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  العودة لتسجيل الدخول
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500">
      <Card className="w-full max-w-md backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 shadow-2xl border-2 border-white/20">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
            <KeyRound className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            نسيت كلمة السر؟
          </CardTitle>
          <CardDescription className="text-base">
            أدخل بريدك الإلكتروني لإرسال رابط إعادة التعيين
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onBlur={handleEmailBlur}
                  disabled={loading}
                  className={`pl-10 ${error && touched ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  autoFocus
                />
              </div>
              {error && touched && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <span>⚠️</span> {error}
                </p>
              )}
              {!error && touched && (
                <p className="text-xs text-gray-500">
                  سنرسل لك رابط لإعادة تعيين كلمة السر
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
                  جارٍ الإرسال...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  إرسال رابط إعادة التعيين
                </>
              )}
            </Button>

            {/* Back to Login Link */}
            <div className="text-center">
              <Link
                href="/login"
                className="text-sm text-purple-600 hover:text-purple-700 font-semibold hover:underline inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                العودة لتسجيل الدخول
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
