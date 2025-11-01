'use client';

import React from 'react';
import { Loader2, Clock, Database, FileText, Users } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Full Page Loading
export function FullPageLoader({ message = 'جارٍ التحميل...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Loader2 className="h-16 w-16 animate-spin text-purple-600" />
          <div className="absolute inset-0 h-16 w-16 animate-ping rounded-full bg-purple-600 opacity-20" />
        </div>
        <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
          {message}
        </p>
      </div>
    </div>
  );
}

// Inline Spinner
export function InlineLoader({ message, size = 'default' }: { message?: string; size?: 'sm' | 'default' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className="flex items-center gap-2">
      <Loader2 className={`animate-spin text-purple-600 ${sizeClasses[size]}`} />
      {message && (
        <span className="text-sm text-gray-600 dark:text-gray-400">{message}</span>
      )}
    </div>
  );
}

// Card Skeleton Loader
export function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader className="space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </CardContent>
        </Card>
      ))}
    </>
  );
}

// Table Skeleton Loader
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full space-y-3">
      {/* Header */}
      <div className="flex gap-4 border-b pb-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Dashboard KPI Skeleton
export function KPISkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-24" />
              </div>
              <Skeleton className="h-12 w-12 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

// Form Skeleton
export function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-32" />
    </div>
  );
}

// Empty State
export function EmptyState({
  icon: Icon = FileText,
  title = 'لا توجد بيانات',
  description = 'لم يتم العثور على أي عناصر',
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mx-auto w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-10 h-10 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}

// Loading Error State
export function LoadingErrorState({
  error,
  onRetry,
}: {
  error?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900 dark:to-orange-900 rounded-full flex items-center justify-center mb-4">
        <Database className="w-10 h-10 text-red-500 dark:text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
        خطأ في تحميل البيانات
      </h3>
      <p className="text-sm text-red-600 dark:text-red-400 mb-6 max-w-md">
        {error || 'حدث خطأ أثناء جلب البيانات. يرجى المحاولة مرة أخرى.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors inline-flex items-center gap-2"
        >
          <Loader2 className="h-4 w-4" />
          إعادة المحاولة
        </button>
      )}
    </div>
  );
}

// Progress Bar
export function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = true,
}: {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
}) {
  const percentage = Math.round((value / max) * 100);

  return (
    <div className="w-full space-y-2">
      {(label || showPercentage) && (
        <div className="flex justify-between text-sm">
          {label && <span className="text-gray-700 dark:text-gray-300">{label}</span>}
          {showPercentage && (
            <span className="font-semibold text-purple-600 dark:text-purple-400">
              {percentage}%
            </span>
          )}
        </div>
      )}
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Pulse Loader (for live updates)
export function PulseLoader({ message = 'تحديث البيانات...' }: { message?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
      </div>
      <span>{message}</span>
    </div>
  );
}

// Skeleton Dashboard
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPISkeleton count={4} />
      </div>

      {/* Charts/Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardSkeleton count={2} />
      </div>
    </div>
  );
}
