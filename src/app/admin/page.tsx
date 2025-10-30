'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock, Mail, User as UserIcon, Phone, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useFirebaseApp, useFirestore } from "@/firebase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

const PasswordStrengthIndicator = ({ password }: { password?: string }) => {
  const getStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strength = getStrength();
  const strengthText = ["", "ضعيفة جداً", "ضعيفة", "متوسطة", "قوية", "قوية جداً"][strength];
  const color =
    strength <= 2 ? "bg-red-500" : strength === 3 ? "bg-yellow-500" : "bg-green-500";

  return (
    <div>
      <Progress value={strength * 20} className={`h-2 ${color}`} />
      <p className="text-xs mt-1 text-right text-white/80">{strengthText}</p>
    </div>
  );
};

export default function AdminCreateUserPage() {
  const app = useFirebaseApp();
  const firestore = useFirestore();
  const auth = getAuth(app);
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [role, setRole] = React.useState<'client' | 'designer' | 'moderator' | 'admin' | 'team_leader'>('client');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }
    setError('');
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: name,
        photoURL: `https://picsum.photos/seed/${user.uid}/100/100` // Default avatar
      });

      await setDoc(doc(firestore, "users", user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        phoneNumber: phoneNumber,
        role: role,
        createdAt: serverTimestamp(),
        isActive: true,
      });

      toast({
        title: "تم إنشاء الحساب",
        description: "لقد تم إنشاء حساب المستخدم بنجاح.",
      });

      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "فشل إنشاء الحساب",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#3F51B5] to-[#9575CD] p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-2xl">
        <CardHeader className="items-center text-center">
          <div className="p-3 bg-white/20 rounded-full mb-4">
            <UserIcon className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="font-headline text-3xl text-white">إنشاء حساب جديد</CardTitle>
          <CardDescription className="text-white/80">
            أدخل بيانات المستخدم الجديد.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleRegister}>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white/90">الاسم الكامل</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
                <Input
                  id="name"
                  type="text"
                  placeholder="مثال: محمد أحمد"
                  required
                  className="pl-10 bg-white/10 border-white/20 focus:bg-white/20 placeholder:text-white/50 text-white"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

             <div className="space-y-2">
              <Label htmlFor="email" className="text-white/90">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  className="pl-10 bg-white/10 border-white/20 focus:bg-white/20 placeholder:text-white/50 text-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-white/90">رقم الهاتف</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="01012345678"
                  required
                  className="pl-10 bg-white/10 border-white/20 focus:bg-white/20 placeholder:text-white/50 text-white"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="role" className="text-white/90">الدور</Label>
                 <Select onValueChange={(value) => setRole(value as any)} defaultValue="client" disabled={loading}>
                    <SelectTrigger className="w-full bg-white/10 border-white/20 focus:bg-white/20 text-white">
                        <SelectValue placeholder="اختر دور المستخدم..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#3F51B5]/80 backdrop-blur-md text-white border-white/20">
                        <SelectItem value="client" className="cursor-pointer focus:bg-white/20">عميل</SelectItem>
                        <SelectItem value="designer" className="cursor-pointer focus:bg-white/20">مصمم</SelectItem>
                        <SelectItem value="moderator" className="cursor-pointer focus:bg-white/20">مشرف</SelectItem>
                        <SelectItem value="team_leader" className="cursor-pointer focus:bg-white/20">قائد فريق</SelectItem>
                        <SelectItem value="admin" className="cursor-pointer focus:bg-white/20">مدير</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
               <Label htmlFor="password" className="text-white/90">كلمة المرور</Label>
              <div className="relative">
                 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="pl-10 pr-10 bg-white/10 border-white/20 focus:bg-white/20 placeholder:text-white/50 text-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                 <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50">
                    {showPassword ? <EyeOff /> : <Eye />}
                 </button>
              </div>
               <PasswordStrengthIndicator password={password} />
            </div>

             <div className="space-y-2">
               <Label htmlFor="confirmPassword" className="text-white/90">تأكيد كلمة المرور</Label>
              <div className="relative">
                 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  className="pl-10 pr-10 bg-white/10 border-white/20 focus:bg-white/20 placeholder:text-white/50 text-white"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-400 text-center">{error}</p>}
            
            <Button type="submit" className="w-full bg-white text-[#3F51B5] hover:bg-white/90 font-bold text-base py-6" disabled={loading}>
              {loading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
            </Button>
            
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
