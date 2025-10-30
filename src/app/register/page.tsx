'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock, Mail, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useFirebaseApp, useFirestore } from "@/firebase";

export default function RegisterPage() {
  const app = useFirebaseApp();
  const firestore = useFirestore();
  const auth = getAuth(app);
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update user profile
      await updateProfile(user, {
        displayName: name,
      });

      // Create user document in Firestore
      await setDoc(doc(firestore, "users", user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        role: 'client', // Default role
        createdAt: serverTimestamp(),
        isActive: true,
      });

      toast({
        title: "Account Created",
        description: "You have been successfully registered.",
      });

      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#3F51B5] to-[#9575CD]">
      <Card className="w-[380px] bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-2xl">
        <CardHeader className="items-center text-center">
          <div className="p-3 bg-white/20 rounded-full mb-4">
            <UserIcon className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="font-headline text-3xl text-white">Create an Account</CardTitle>
          <CardDescription className="text-white/80">
            Enter your details to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleRegister}>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white/90">Full Name</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  required
                  className="pl-10 bg-white/10 border-white/20 focus:bg-white/20 placeholder:text-white/50 text-white"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/90">Email</Label>
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
               <Label htmlFor="password" className="text-white/90">Password</Label>
              <div className="relative">
                 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
                <Input
                  id="password"
                  type="password"
                  required
                  className="pl-10 bg-white/10 border-white/20 focus:bg-white/20 placeholder:text-white/50 text-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            
            <Button type="submit" className="w-full bg-white text-[#3F51B5] hover:bg-white/90 font-bold text-base py-6" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
            
          </form>
          <div className="mt-6 text-center text-sm">
            <span className="text-white/80">Already have an account? </span>
            <Link
              href="/login"
              className="font-semibold text-white hover:underline"
            >
              Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
