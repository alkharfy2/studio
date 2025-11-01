'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckSquare,
  X,
  Trash2,
  Archive,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { BulkOperationsHook } from '@/hooks/use-bulk-operations';

interface BulkOperationsToolbarProps {
  bulkOps: BulkOperationsHook;
  totalItems: number;
}

export function BulkOperationsToolbar({
  bulkOps,
  totalItems,
}: BulkOperationsToolbarProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const {
    selectedIds,
    isSelecting,
    isProcessing,
    selectAll,
    deselectAll,
    toggleSelectMode,
    bulkUpdateStatus,
    bulkDelete,
    bulkArchive,
  } = bulkOps;

  const selectedCount = selectedIds.size;

  // Handle status change
  const handleStatusChange = async () => {
    if (!selectedStatus) return;

    const success = await bulkUpdateStatus(selectedStatus);
    if (success) {
      setSelectedStatus('');
    }
  };

  if (!isSelecting) {
    return (
      <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg border">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleSelectMode}
          className="gap-2"
        >
          <CheckSquare className="h-4 w-4" />
          تحديد متعدد
        </Button>
        <p className="text-sm text-muted-foreground">
          اختر عدة مهام لتطبيق عملية جماعية
        </p>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-10 bg-background border-b shadow-sm">
      <div className="flex items-center justify-between gap-4 p-4">
        {/* Selection Info */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSelectMode}
            disabled={isProcessing}
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {selectedCount} محدد
            </Badge>

            {selectedCount < totalItems && (
              <Button
                variant="link"
                size="sm"
                onClick={() => {
                  // This would need to be passed from parent with all IDs
                  // For now, just show the button
                }}
                className="h-auto p-0 text-xs"
              >
                تحديد الكل ({totalItems})
              </Button>
            )}

            {selectedCount > 0 && (
              <Button
                variant="link"
                size="sm"
                onClick={deselectAll}
                className="h-auto p-0 text-xs"
                disabled={isProcessing}
              >
                إلغاء التحديد
              </Button>
            )}
          </div>
        </div>

        {/* Actions */}
        {selectedCount > 0 && (
          <div className="flex items-center gap-2">
            {/* Status Update */}
            <div className="flex items-center gap-2">
              <Select
                value={selectedStatus}
                onValueChange={setSelectedStatus}
                disabled={isProcessing}
              >
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="تغيير الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">جديد</SelectItem>
                  <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                  <SelectItem value="submitted">تم التسليم</SelectItem>
                  <SelectItem value="to_review">قيد المراجعة</SelectItem>
                  <SelectItem value="done">مكتمل</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>

              {selectedStatus && (
                <Button
                  size="sm"
                  onClick={handleStatusChange}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>

            {/* Archive Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={bulkArchive}
              disabled={isProcessing}
              className="gap-2"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Archive className="h-4 w-4" />
              )}
              أرشفة
            </Button>

            {/* Delete Button */}
            <Button
              variant="destructive"
              size="sm"
              onClick={bulkDelete}
              disabled={isProcessing}
              className="gap-2"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              حذف
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
