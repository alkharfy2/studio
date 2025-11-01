'use client';

import { useState, useCallback } from 'react';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { useToast } from './use-toast';

export interface BulkOperationsHook {
  selectedIds: Set<string>;
  isSelecting: boolean;
  isProcessing: boolean;
  selectAll: (ids: string[]) => void;
  deselectAll: () => void;
  toggleSelect: (id: string) => void;
  toggleSelectMode: () => void;
  bulkUpdateStatus: (status: string) => Promise<boolean>;
  bulkDelete: () => Promise<boolean>;
  bulkArchive: () => Promise<boolean>;
}

export function useBulkOperations(collection: string = 'tasks'): BulkOperationsHook {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Select all
  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  // Deselect all
  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Toggle select single item
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Toggle select mode
  const toggleSelectMode = useCallback(() => {
    setIsSelecting((prev) => !prev);
    if (isSelecting) {
      setSelectedIds(new Set());
    }
  }, [isSelecting]);

  // Bulk update status
  const bulkUpdateStatus = useCallback(
    async (status: string): Promise<boolean> => {
      if (!firestore || selectedIds.size === 0) {
        toast({
          variant: 'destructive',
          title: 'خطأ',
          description: 'لم يتم تحديد أي عنصر',
        });
        return false;
      }

      setIsProcessing(true);

      try {
        const batch = writeBatch(firestore);
        const ids = Array.from(selectedIds);

        ids.forEach((id) => {
          const docRef = doc(firestore, collection, id);
          batch.update(docRef, {
            status,
            updatedAt: serverTimestamp(),
            ...(status === 'done' ? { completedAt: serverTimestamp() } : {}),
          });
        });

        await batch.commit();

        toast({
          title: 'تم بنجاح ✅',
          description: `تم تحديث ${ids.length} عنصر`,
        });

        // Clear selection
        setSelectedIds(new Set());
        setIsSelecting(false);

        return true;
      } catch (error: any) {
        console.error('Bulk update error:', error);
        toast({
          variant: 'destructive',
          title: 'فشل التحديث',
          description: error.message || 'حدث خطأ أثناء التحديث',
        });
        return false;
      } finally {
        setIsProcessing(false);
      }
    },
    [firestore, selectedIds, collection, toast]
  );

  // Bulk delete
  const bulkDelete = useCallback(async (): Promise<boolean> => {
    if (!firestore || selectedIds.size === 0) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'لم يتم تحديد أي عنصر',
      });
      return false;
    }

    // Confirm deletion
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف ${selectedIds.size} عنصر؟\nهذا الإجراء لا يمكن التراجع عنه.`
    );

    if (!confirmed) {
      return false;
    }

    setIsProcessing(true);

    try {
      const batch = writeBatch(firestore);
      const ids = Array.from(selectedIds);

      ids.forEach((id) => {
        const docRef = doc(firestore, collection, id);
        batch.delete(docRef);
      });

      await batch.commit();

      toast({
        title: 'تم الحذف ✅',
        description: `تم حذف ${ids.length} عنصر`,
      });

      // Clear selection
      setSelectedIds(new Set());
      setIsSelecting(false);

      return true;
    } catch (error: any) {
      console.error('Bulk delete error:', error);
      toast({
        variant: 'destructive',
        title: 'فشل الحذف',
        description: error.message || 'حدث خطأ أثناء الحذف',
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [firestore, selectedIds, collection, toast]);

  // Bulk archive (mark as archived)
  const bulkArchive = useCallback(async (): Promise<boolean> => {
    if (!firestore || selectedIds.size === 0) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'لم يتم تحديد أي عنصر',
      });
      return false;
    }

    setIsProcessing(true);

    try {
      const batch = writeBatch(firestore);
      const ids = Array.from(selectedIds);

      ids.forEach((id) => {
        const docRef = doc(firestore, collection, id);
        batch.update(docRef, {
          archived: true,
          archivedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();

      toast({
        title: 'تم الأرشفة ✅',
        description: `تم أرشفة ${ids.length} عنصر`,
      });

      // Clear selection
      setSelectedIds(new Set());
      setIsSelecting(false);

      return true;
    } catch (error: any) {
      console.error('Bulk archive error:', error);
      toast({
        variant: 'destructive',
        title: 'فشل الأرشفة',
        description: error.message || 'حدث خطأ أثناء الأرشفة',
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [firestore, selectedIds, collection, toast]);

  return {
    selectedIds,
    isSelecting,
    isProcessing,
    selectAll,
    deselectAll,
    toggleSelect,
    toggleSelectMode,
    bulkUpdateStatus,
    bulkDelete,
    bulkArchive,
  };
}
