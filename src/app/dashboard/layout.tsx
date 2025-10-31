'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LayoutDashboard, PlusCircle, ListTodo, Users, Settings, LogOut, BarChart3 } from "lucide-react";
import Link from "next/link";
import DashboardHeader from "@/components/dashboard/header";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getAuth, signOut } from "firebase/auth";
import { useFirebaseApp } from "@/firebase";
import { useLanguage } from "@/contexts/LanguageContext";

function DashboardContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useUser();
  const router = useRouter();
  const app = useFirebaseApp();
  const auth = getAuth(app);
  const { t } = useLanguage();


  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (loading || !user) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-2xl">Loading...</div>
        </div>
    )
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-3 px-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-8 h-8 text-primary fill-current">
              <path d="M5.27,23.36,9,19.61V14.16h6v5.45l3.73,3.75a2,2,0,0,0,2.83-2.83L5.27.64A2,2,0,0,0,2.44,3.46L5.27,6.29v14.24a2,2,0,0,0,0,2.83Z" />
              <path d="M19.56,3.46a2,2,0,0,0-2.83,0L15,5.17V10H9V5.17L7.27,3.46a2,2,0,0,0-2.83,2.83L7.76,9.61a2,2,0,0,0,2.83,0l1.41-1.42,1.41,1.42a2,2,0,0,0,2.83,0l3.32-3.32a2,2,0,0,0,0-2.83Z" />
            </svg>
            <span className="font-headline text-2xl font-bold text-primary">Cveezy</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive tooltip={t('nav.dashboard')}>
                <Link href="/dashboard">
                  <LayoutDashboard />
                  <span>{t('nav.dashboard')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={t('nav.create_task')}>
                <Link href="/dashboard/create-task">
                  <PlusCircle />
                  <span>{t('nav.create_task')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={t('nav.tasks')}>
                <Link href="/dashboard/tasks">
                  <ListTodo />
                  <span>{t('nav.tasks')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={t('nav.users')}>
                <Link href="/dashboard/users">
                  <Users />
                  <span>{t('nav.users')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={t('nav.reports')}>
                <Link href="/dashboard/reports">
                  <BarChart3 />
                  <span>{t('nav.reports')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={t('nav.settings')}>
                <Link href="#">
                  <Settings />
                  <span>{t('nav.settings')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} tooltip={t('nav.logout')}>
                  <LogOut />
                  <span>{t('nav.logout')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <DashboardHeader />
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardContent>{children}</DashboardContent>;
}
