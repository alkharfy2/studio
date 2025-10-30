import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#3F51B5] to-[#9575CD]">
      <Card className="w-[380px] bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-2xl">
        <CardHeader className="items-center text-center">
          <div className="p-3 bg-white/20 rounded-full mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="font-headline text-3xl text-white">Welcome Back</CardTitle>
          <CardDescription className="text-white/80">
            Enter your credentials to access your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
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
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-white/90">Password</Label>
                <Link
                  href="#"
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
              <div className="relative">
                 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
                <Input
                  id="password"
                  type="password"
                  required
                  className="pl-10 bg-white/10 border-white/20 focus:bg-white/20 placeholder:text-white/50 text-white"
                />
              </div>
            </div>
            <Link href="/dashboard" className="w-full">
              <Button type="submit" className="w-full bg-white text-[#3F51B5] hover:bg-white/90 font-bold text-base py-6">
                Log In
              </Button>
            </Link>
          </form>
          <div className="mt-6 text-center text-sm">
            <span className="text-white/80">Don't have an account? </span>
            <Link
              href="#"
              className="font-semibold text-white hover:underline"
            >
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
