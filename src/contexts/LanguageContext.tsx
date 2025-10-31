'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

// ملفات الترجمة
const translations: Record<Language, Record<string, string>> = {
  ar: {
    // Navigation
    'nav.dashboard': 'لوحة التحكم',
    'nav.create_task': 'إنشاء مهمة',
    'nav.tasks': 'المهام',
    'nav.users': 'المستخدمين',
    'nav.reports': 'التقارير',
    'nav.settings': 'الإعدادات',
    'nav.logout': 'تسجيل الخروج',

    // Common
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.add': 'إضافة',
    'common.search': 'بحث',
    'common.filter': 'تصفية',
    'common.export': 'تصدير',
    'common.loading': 'جاري التحميل...',
    'common.error': 'خطأ',
    'common.success': 'نجح',
    'common.confirm': 'تأكيد',
    'common.view': 'عرض',
    'common.download': 'تحميل',
    'common.upload': 'رفع',
    'common.total': 'الإجمالي',
    'common.status': 'الحالة',
    'common.date': 'التاريخ',
    'common.name': 'الاسم',
    'common.email': 'البريد الإلكتروني',
    'common.phone': 'رقم الهاتف',
    'common.role': 'الدور',
    'common.actions': 'الإجراءات',
    'common.welcome': 'مرحباً',
    'common.back': 'رجوع',

    // Dashboard
    'dashboard.admin': 'لوحة تحكم المدير',
    'dashboard.moderator': 'لوحة تحكم المشرف',
    'dashboard.designer': 'لوحة تحكم المصمم',
    'dashboard.client': 'لوحة تحكم العميل',
    'dashboard.team_leader': 'لوحة تحكم قائد الفريق',
    'dashboard.welcome_back': 'مرحباً بعودتك',
    'dashboard.performance_overview': 'نظرة عامة على الأداء',
    'dashboard.completed_current_month': 'مكتمل (الشهر الحالي)',
    'dashboard.total_value_previous': 'القيمة الإجمالية (الشهر السابق)',
    'dashboard.total_value_current': 'القيمة الإجمالية (الشهر الحالي)',
    'dashboard.done_last_7': 'تم إنجازه خلال 7 أيام',
    'dashboard.todays_deliveries': 'تسليمات اليوم',
    'dashboard.overdue': 'متأخر',
    'dashboard.in_progress': 'قيد التنفيذ',
    'dashboard.monthly_target': 'الهدف الشهري',
    'dashboard.open_for_review': 'مفتوح للمراجعة',

    // Tasks
    'tasks.title': 'المهام',
    'tasks.my_tasks': 'مهامي',
    'tasks.create': 'إنشاء مهمة',
    'tasks.all': 'جميع المهام',
    'tasks.new': 'جديد',
    'tasks.in_progress': 'قيد التنفيذ',
    'tasks.submitted': 'تم التسليم',
    'tasks.to_review': 'قيد المراجعة',
    'tasks.done': 'مكتمل',
    'tasks.cancelled': 'ملغي',
    'tasks.overdue': 'متأخر',
    'tasks.completed': 'مكتمل',
    'tasks.pending': 'معلق',

    // Users
    'users.title': 'إدارة المستخدمين',
    'users.add': 'إضافة مستخدم',
    'users.edit': 'تعديل المستخدم',
    'users.total': 'إجمالي المستخدمين',
    'users.active': 'نشط',
    'users.inactive': 'معطل',

    // Reports
    'reports.title': 'التقارير والإحصائيات',
    'reports.overview': 'نظرة عامة',
    'reports.designers': 'أداء المصممين',
    'reports.moderators': 'أداء المشرفين',
    'reports.this_month': 'هذا الشهر',
    'reports.last_month': 'الشهر الماضي',
    'reports.this_year': 'هذا العام',
    'reports.all_time': 'كل الأوقات',

    // Notifications
    'notifications.title': 'الإشعارات',
    'notifications.mark_read': 'تعليم كمقروء',
    'notifications.mark_all_read': 'تعليم الكل كمقروء',
    'notifications.no_notifications': 'لا توجد إشعارات',

    // Theme
    'theme.light': 'فاتح',
    'theme.dark': 'داكن',
    'theme.system': 'النظام',

    // Language
    'language.ar': 'العربية',
    'language.en': 'English',
  },
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.create_task': 'Create Task',
    'nav.tasks': 'Tasks',
    'nav.users': 'Users',
    'nav.reports': 'Reports',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',

    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.export': 'Export',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.confirm': 'Confirm',
    'common.view': 'View',
    'common.download': 'Download',
    'common.upload': 'Upload',
    'common.total': 'Total',
    'common.status': 'Status',
    'common.date': 'Date',
    'common.name': 'Name',
    'common.email': 'Email',
    'common.phone': 'Phone',
    'common.role': 'Role',
    'common.actions': 'Actions',
    'common.welcome': 'Welcome',
    'common.back': 'Back',

    // Dashboard
    'dashboard.admin': 'Admin Dashboard',
    'dashboard.moderator': 'Moderator Dashboard',
    'dashboard.designer': 'Designer Dashboard',
    'dashboard.client': 'Client Dashboard',
    'dashboard.team_leader': 'Team Leader Dashboard',
    'dashboard.welcome_back': 'Welcome back',
    'dashboard.performance_overview': 'Performance Overview',
    'dashboard.completed_current_month': 'Completed (Current Month)',
    'dashboard.total_value_previous': 'Total Value (Previous Month)',
    'dashboard.total_value_current': 'Total Value (Current Month)',
    'dashboard.done_last_7': 'Done Last 7 Days',
    'dashboard.todays_deliveries': "Today's Deliveries",
    'dashboard.overdue': 'Overdue',
    'dashboard.in_progress': 'In Progress',
    'dashboard.monthly_target': 'Monthly Target',
    'dashboard.open_for_review': 'Open for Review',

    // Tasks
    'tasks.title': 'Tasks',
    'tasks.my_tasks': 'My Tasks',
    'tasks.create': 'Create Task',
    'tasks.all': 'All Tasks',
    'tasks.new': 'New',
    'tasks.in_progress': 'In Progress',
    'tasks.submitted': 'Submitted',
    'tasks.to_review': 'To Review',
    'tasks.done': 'Done',
    'tasks.cancelled': 'Cancelled',
    'tasks.overdue': 'Overdue',
    'tasks.completed': 'Completed',
    'tasks.pending': 'Pending',

    // Users
    'users.title': 'User Management',
    'users.add': 'Add User',
    'users.edit': 'Edit User',
    'users.total': 'Total Users',
    'users.active': 'Active',
    'users.inactive': 'Inactive',

    // Reports
    'reports.title': 'Reports & Analytics',
    'reports.overview': 'Overview',
    'reports.designers': 'Designer Performance',
    'reports.moderators': 'Moderator Performance',
    'reports.this_month': 'This Month',
    'reports.last_month': 'Last Month',
    'reports.this_year': 'This Year',
    'reports.all_time': 'All Time',

    // Notifications
    'notifications.title': 'Notifications',
    'notifications.mark_read': 'Mark as Read',
    'notifications.mark_all_read': 'Mark All as Read',
    'notifications.no_notifications': 'No Notifications',

    // Theme
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.system': 'System',

    // Language
    'language.ar': 'العربية',
    'language.en': 'English',
  },
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ar');
  const [mounted, setMounted] = useState(false);

  // تحميل اللغة من localStorage عند بدء التشغيل
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'ar' || savedLanguage === 'en')) {
      setLanguageState(savedLanguage);
    }
    setMounted(true);
  }, []);

  // تحديث اللغة واتجاه النص
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);

    // تحديث dir و lang في html
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  // تطبيق الاتجاه عند التحميل
  useEffect(() => {
    if (mounted) {
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    }
  }, [language, mounted]);

  // دالة الترجمة
  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  // تجنب hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}
