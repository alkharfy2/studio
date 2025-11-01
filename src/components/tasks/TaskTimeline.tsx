'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  CheckCircle2,
  Clock,
  FileCheck,
  PlayCircle,
  Upload,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineEvent {
  status: string;
  label: string;
  timestamp?: any;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  isActive: boolean;
  isCompleted: boolean;
}

interface TaskTimelineProps {
  currentStatus: string;
  createdAt?: any;
  updatedAt?: any;
  completedAt?: any;
  statusHistory?: Array<{
    status: string;
    timestamp: any;
    changedBy?: string;
  }>;
}

const formatDateTime = (date: any) => {
  if (!date) return '';
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const STATUS_ORDER = ['new', 'in_progress', 'submitted', 'to_review', 'done'];

export function TaskTimeline({
  currentStatus,
  createdAt,
  updatedAt,
  completedAt,
  statusHistory = [],
}: TaskTimelineProps) {
  // تحديد الحالات مع الأيقونات
  const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
    new: {
      label: 'مهمة جديدة',
      icon: Clock,
      color: 'blue',
    },
    in_progress: {
      label: 'قيد التنفيذ',
      icon: PlayCircle,
      color: 'yellow',
    },
    submitted: {
      label: 'تم التسليم',
      icon: Upload,
      color: 'purple',
    },
    to_review: {
      label: 'قيد المراجعة',
      icon: AlertCircle,
      color: 'orange',
    },
    done: {
      label: 'مكتمل',
      icon: CheckCircle2,
      color: 'green',
    },
    cancelled: {
      label: 'ملغي',
      icon: XCircle,
      color: 'gray',
    },
  };

  // إنشاء timeline events
  const currentStatusIndex = STATUS_ORDER.indexOf(currentStatus);
  const isCancelled = currentStatus === 'cancelled';

  const events: TimelineEvent[] = STATUS_ORDER.map((status, index) => {
    const config = statusConfig[status];
    const historyItem = statusHistory.find((h) => h.status === status);

    return {
      status,
      label: config.label,
      timestamp: historyItem?.timestamp,
      icon: config.icon,
      color: config.color,
      isActive: status === currentStatus,
      isCompleted: !isCancelled && index <= currentStatusIndex,
    };
  });

  // إضافة حالة الإلغاء إذا كانت المهمة ملغية
  if (isCancelled) {
    events.push({
      status: 'cancelled',
      label: statusConfig.cancelled.label,
      timestamp: updatedAt,
      icon: statusConfig.cancelled.icon,
      color: statusConfig.cancelled.color,
      isActive: true,
      isCompleted: true,
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold mb-6">سير المهمة</h3>
        <div className="relative">
          {/* الخط الرأسي */}
          <div className="absolute right-[19px] top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

          {/* الأحداث */}
          <div className="space-y-6">
            {events.map((event, index) => {
              const Icon = event.icon;
              const colorClasses = {
                blue: {
                  bg: 'bg-blue-500',
                  text: 'text-blue-600',
                  border: 'border-blue-500',
                  bgLight: 'bg-blue-50 dark:bg-blue-950',
                },
                yellow: {
                  bg: 'bg-yellow-500',
                  text: 'text-yellow-600',
                  border: 'border-yellow-500',
                  bgLight: 'bg-yellow-50 dark:bg-yellow-950',
                },
                purple: {
                  bg: 'bg-purple-500',
                  text: 'text-purple-600',
                  border: 'border-purple-500',
                  bgLight: 'bg-purple-50 dark:bg-purple-950',
                },
                orange: {
                  bg: 'bg-orange-500',
                  text: 'text-orange-600',
                  border: 'border-orange-500',
                  bgLight: 'bg-orange-50 dark:bg-orange-950',
                },
                green: {
                  bg: 'bg-green-500',
                  text: 'text-green-600',
                  border: 'border-green-500',
                  bgLight: 'bg-green-50 dark:bg-green-950',
                },
                gray: {
                  bg: 'bg-gray-500',
                  text: 'text-gray-600',
                  border: 'border-gray-500',
                  bgLight: 'bg-gray-50 dark:bg-gray-950',
                },
              };

              const colors = colorClasses[event.color as keyof typeof colorClasses];

              return (
                <div key={event.status} className="relative flex items-start gap-4">
                  {/* الأيقونة */}
                  <div
                    className={cn(
                      'relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-4 border-background',
                      event.isCompleted ? colors.bg : 'bg-gray-200 dark:bg-gray-700'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5',
                        event.isCompleted ? 'text-white' : 'text-gray-400'
                      )}
                    />
                  </div>

                  {/* المحتوى */}
                  <div className="flex-1 pb-6">
                    <div
                      className={cn(
                        'p-4 rounded-lg border-2 transition-all',
                        event.isActive
                          ? cn(colors.border, colors.bgLight)
                          : 'border-transparent bg-gray-50 dark:bg-gray-900',
                        !event.isCompleted && 'opacity-50'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4
                          className={cn(
                            'font-semibold',
                            event.isActive && colors.text
                          )}
                        >
                          {event.label}
                        </h4>
                        {event.isActive && (
                          <span
                            className={cn(
                              'text-xs px-2 py-1 rounded-full',
                              colors.bg,
                              'text-white'
                            )}
                          >
                            الحالة الحالية
                          </span>
                        )}
                      </div>

                      {/* الوقت */}
                      {event.timestamp && (
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(event.timestamp)}
                        </p>
                      )}

                      {/* معلومات إضافية */}
                      {event.status === 'new' && createdAt && !event.timestamp && (
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(createdAt)}
                        </p>
                      )}
                      {event.status === 'done' && completedAt && !event.timestamp && (
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(completedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
