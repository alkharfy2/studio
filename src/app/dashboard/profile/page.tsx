'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useUser, useAuth, useFirestore } from '@/firebase';
import { updateProfile, updatePassword, signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { User, Mail, Phone, Shield, Loader2, Save, LogOut, Lock, Eye, EyeOff, Camera } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

const ROLE_LABELS: Record<string, string> = {
  admin: 'مدير (Admin)',
  moderator: 'مشرف (Moderator)',
  designer: 'مصمم (Designer)',
  client: 'عميل (Client)',
  team_leader: 'قائد فريق (Team Leader)',
};

export default function ProfilePage() {
  const router = useRouter();
  const { user: currentUser, loading: userLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  // Profile state
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [photoURL, setPhotoURL] = useState('');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // UI state
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingSignOut, setLoadingSignOut] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [profileTouched, setProfileTouched] = useState<Record<string, boolean>>({});
  const [passwordTouched, setPasswordTouched] = useState<Record<string, boolean>>({});

  // Load user data
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setPhoneNumber(currentUser.phoneNumber || '');
      setPhotoURL(currentUser.photoURL || '');
    }
  }, [currentUser]);

  // Profile validation
  const validateProfileField = (fieldName: string, value: string): string | undefined => {
    switch (fieldName) {
      case 'name':
        if (!value.trim()) return 'الاسم الكامل مطلوب';
        if (value.trim().length < 3) return 'الاسم يجب أن يكون 3 أحرف على الأقل';
        return undefined;

      case 'phoneNumber':
        if (!value.trim()) return undefined; // Optional
        const phoneRegex = /^[0-9]{10,15}$/;
        if (!phoneRegex.test(value.replace(/\s/g, ''))) {
          return 'رقم الهاتف يجب أن يكون بين 10-15 رقماً';
        }
        return undefined;

      case 'photoURL':
        if (!value.trim()) return undefined; // Optional
        try {
          new URL(value);
          return undefined;
        } catch {
          return 'رابط الصورة غير صحيح';
        }

      default:
        return undefined;
    }
  };

  // Password validation
  const validatePasswordField = (fieldName: string, value: string): string | undefined => {
    switch (fieldName) {
      case 'currentPassword':
        if (!value) return 'كلمة السر الحالية مطلوبة';
        return undefined;

      case 'newPassword':
        if (!value) return 'كلمة السر الجديدة مطلوبة';
        if (value.length < 6) return 'كلمة السر يجب أن تكون 6 أحرف على الأقل';
        if (!/(?=.*[a-z])/.test(value)) return 'يجب أن تحتوي على حرف صغير';
        if (!/(?=.*[A-Z])/.test(value)) return 'يجب أن تحتوي على حرف كبير';
        if (!/(?=.*[0-9])/.test(value)) return 'يجب أن تحتوي على رقم';
        if (value === currentPassword) return 'كلمة السر الجديدة يجب أن تكون مختلفة عن القديمة';
        return undefined;

      case 'confirmNewPassword':
        if (!value) return 'تأكيد كلمة السر مطلوب';
        if (value !== newPassword) return 'كلمة السر غير متطابقة';
        return undefined;

      default:
        return undefined;
    }
  };

  const handleProfileFieldChange = (fieldName: string, value: string) => {
    switch (fieldName) {
      case 'name': setName(value); break;
      case 'phoneNumber': setPhoneNumber(value); break;
      case 'photoURL': setPhotoURL(value); break;
    }

    if (profileTouched[fieldName]) {
      const error = validateProfileField(fieldName, value);
      setProfileErrors(prev => ({
        ...prev,
        [fieldName]: error || '',
      }));
    }
  };

  const handlePasswordFieldChange = (fieldName: string, value: string) => {
    switch (fieldName) {
      case 'currentPassword': setCurrentPassword(value); break;
      case 'newPassword': setNewPassword(value); break;
      case 'confirmNewPassword': setConfirmNewPassword(value); break;
    }

    if (passwordTouched[fieldName]) {
      const error = validatePasswordField(fieldName, value);
      setPasswordErrors(prev => ({
        ...prev,
        [fieldName]: error || '',
      }));
    }
  };

  const handleProfileFieldBlur = (fieldName: string, value: string) => {
    setProfileTouched(prev => ({ ...prev, [fieldName]: true }));
    const error = validateProfileField(fieldName, value);
    setProfileErrors(prev => ({
      ...prev,
      [fieldName]: error || '',
    }));
  };

  const handlePasswordFieldBlur = (fieldName: string, value: string) => {
    setPasswordTouched(prev => ({ ...prev, [fieldName]: true }));
    const error = validatePasswordField(fieldName, value);
    setPasswordErrors(prev => ({
      ...prev,
      [fieldName]: error || '',
    }));
  };

  // Update profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const errors: Record<string, string> = {};
    ['name', 'phoneNumber', 'photoURL'].forEach(field => {
      const error = validateProfileField(field, field === 'name' ? name : field === 'phoneNumber' ? phoneNumber : photoURL);
      if (error) errors[field] = error;
    });

    setProfileErrors(errors);
    setProfileTouched({ name: true, phoneNumber: true, photoURL: true });

    if (Object.keys(errors).length > 0) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يرجى تصحيح الأخطاء في النموذج',
        variant: 'destructive',
      });
      return;
    }

    if (!auth?.currentUser || !firestore || !currentUser) {
      toast({
        title: 'خطأ',
        description: 'لم يتم العثور على بيانات المستخدم',
        variant: 'destructive',
      });
      return;
    }

    setLoadingProfile(true);

    try {
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, {
        displayName: name.trim(),
        photoURL: photoURL.trim() || null,
      });

      // Update Firestore document
      await updateDoc(doc(firestore, 'users', currentUser.uid), {
        name: name.trim(),
        phoneNumber: phoneNumber.trim() || null,
        photoURL: photoURL.trim() || null,
      });

      toast({
        title: 'تم التحديث بنجاح! ✅',
        description: 'تم حفظ بياناتك الشخصية',
      });
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast({
        title: 'فشل التحديث',
        description: 'حدث خطأ أثناء تحديث الملف الشخصي',
        variant: 'destructive',
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  // Update password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const errors: Record<string, string> = {};
    ['currentPassword', 'newPassword', 'confirmNewPassword'].forEach(field => {
      const value = field === 'currentPassword' ? currentPassword : field === 'newPassword' ? newPassword : confirmNewPassword;
      const error = validatePasswordField(field, value);
      if (error) errors[field] = error;
    });

    setPasswordErrors(errors);
    setPasswordTouched({ currentPassword: true, newPassword: true, confirmNewPassword: true });

    if (Object.keys(errors).length > 0) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يرجى تصحيح الأخطاء في النموذج',
        variant: 'destructive',
      });
      return;
    }

    if (!auth?.currentUser) {
      toast({
        title: 'خطأ',
        description: 'لم يتم العثور على بيانات المستخدم',
        variant: 'destructive',
      });
      return;
    }

    setLoadingPassword(true);

    try {
      // Note: In production, you should re-authenticate the user first
      // using reauthenticateWithCredential before changing password
      await updatePassword(auth.currentUser, newPassword);

      toast({
        title: 'تم تغيير كلمة السر! ✅',
        description: 'تم تحديث كلمة السر بنجاح',
      });

      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordTouched({});
      setPasswordErrors({});
    } catch (error: any) {
      console.error('Password update error:', error);

      let errorMessage = 'حدث خطأ أثناء تغيير كلمة السر';

      if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'يجب تسجيل الدخول مرة أخرى لتغيير كلمة السر';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'كلمة السر ضعيفة جداً';
      }

      toast({
        title: 'فشل التحديث',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoadingPassword(false);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    if (!auth) return;

    setLoadingSignOut(true);

    try {
      await signOut(auth);
      toast({
        title: 'تم تسجيل الخروج',
        description: 'نراك قريباً!',
      });
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تسجيل الخروج',
        variant: 'destructive',
      });
    } finally {
      setLoadingSignOut(false);
    }
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive">
          <AlertDescription>
            لم يتم العثور على بيانات المستخدم
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const initials = currentUser.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">الملف الشخصي</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          إدارة معلوماتك الشخصية وإعدادات الحساب
        </p>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={photoURL || currentUser.photoURL || undefined} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg">
                <Camera className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold">{currentUser.name}</h2>
              <p className="text-gray-500 dark:text-gray-400">{currentUser.email}</p>
              <div className="mt-2">
                <Badge className="bg-gradient-to-r from-purple-600 to-blue-600">
                  {ROLE_LABELS[currentUser.role] || currentUser.role}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            المعلومات الشخصية
          </CardTitle>
          <CardDescription>
            تحديث البيانات الأساسية لملفك الشخصي
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                الاسم الكامل <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => handleProfileFieldChange('name', e.target.value)}
                onBlur={(e) => handleProfileFieldBlur('name', e.target.value)}
                disabled={loadingProfile}
                className={profileErrors.name && profileTouched.name ? 'border-red-500' : ''}
              />
              {profileErrors.name && profileTouched.name && (
                <p className="text-sm text-red-500">⚠️ {profileErrors.name}</p>
              )}
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={currentUser.email}
                disabled
                className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500">
                لا يمكن تغيير البريد الإلكتروني
              </p>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">رقم الهاتف</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="01234567890"
                value={phoneNumber}
                onChange={(e) => handleProfileFieldChange('phoneNumber', e.target.value)}
                onBlur={(e) => handleProfileFieldBlur('phoneNumber', e.target.value)}
                disabled={loadingProfile}
                className={profileErrors.phoneNumber && profileTouched.phoneNumber ? 'border-red-500' : ''}
              />
              {profileErrors.phoneNumber && profileTouched.phoneNumber && (
                <p className="text-sm text-red-500">⚠️ {profileErrors.phoneNumber}</p>
              )}
            </div>

            {/* Photo URL */}
            <div className="space-y-2">
              <Label htmlFor="photoURL">رابط الصورة الشخصية</Label>
              <Input
                id="photoURL"
                type="url"
                placeholder="https://example.com/photo.jpg"
                value={photoURL}
                onChange={(e) => handleProfileFieldChange('photoURL', e.target.value)}
                onBlur={(e) => handleProfileFieldBlur('photoURL', e.target.value)}
                disabled={loadingProfile}
                className={profileErrors.photoURL && profileTouched.photoURL ? 'border-red-500' : ''}
              />
              {profileErrors.photoURL && profileTouched.photoURL && (
                <p className="text-sm text-red-500">⚠️ {profileErrors.photoURL}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loadingProfile}
              className="w-full sm:w-auto"
            >
              {loadingProfile ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جارٍ الحفظ...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  حفظ التغييرات
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            تغيير كلمة السر
          </CardTitle>
          <CardDescription>
            تحديث كلمة السر الخاصة بحسابك
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">
                كلمة السر الحالية <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder="********"
                  value={currentPassword}
                  onChange={(e) => handlePasswordFieldChange('currentPassword', e.target.value)}
                  onBlur={(e) => handlePasswordFieldBlur('currentPassword', e.target.value)}
                  disabled={loadingPassword}
                  className={`pr-10 ${passwordErrors.currentPassword && passwordTouched.currentPassword ? 'border-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.currentPassword && passwordTouched.currentPassword && (
                <p className="text-sm text-red-500">⚠️ {passwordErrors.currentPassword}</p>
              )}
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">
                كلمة السر الجديدة <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="********"
                  value={newPassword}
                  onChange={(e) => handlePasswordFieldChange('newPassword', e.target.value)}
                  onBlur={(e) => handlePasswordFieldBlur('newPassword', e.target.value)}
                  disabled={loadingPassword}
                  className={`pr-10 ${passwordErrors.newPassword && passwordTouched.newPassword ? 'border-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.newPassword && passwordTouched.newPassword && (
                <p className="text-sm text-red-500">⚠️ {passwordErrors.newPassword}</p>
              )}
            </div>

            {/* Confirm New Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">
                تأكيد كلمة السر الجديدة <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="confirmNewPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="********"
                  value={confirmNewPassword}
                  onChange={(e) => handlePasswordFieldChange('confirmNewPassword', e.target.value)}
                  onBlur={(e) => handlePasswordFieldBlur('confirmNewPassword', e.target.value)}
                  disabled={loadingPassword}
                  className={`pr-10 ${passwordErrors.confirmNewPassword && passwordTouched.confirmNewPassword ? 'border-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.confirmNewPassword && passwordTouched.confirmNewPassword && (
                <p className="text-sm text-red-500">⚠️ {passwordErrors.confirmNewPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loadingPassword}
              className="w-full sm:w-auto"
            >
              {loadingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جارٍ التحديث...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  تغيير كلمة السر
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400">منطقة الخطر</CardTitle>
          <CardDescription>
            إجراءات لا يمكن التراجع عنها
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleSignOut}
            disabled={loadingSignOut}
            className="w-full sm:w-auto"
          >
            {loadingSignOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                جارٍ تسجيل الخروج...
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                تسجيل الخروج
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
