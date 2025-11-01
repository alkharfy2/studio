'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X, ChevronLeft, ChevronRight, FileText, Image as ImageIcon } from 'lucide-react';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: Array<{
    url: string;
    name?: string;
    type?: 'image' | 'pdf' | 'other';
  }>;
  initialIndex?: number;
}

export function FilePreviewModal({
  isOpen,
  onClose,
  files,
  initialIndex = 0,
}: FilePreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (files.length === 0) return null;

  const currentFile = files[currentIndex];
  const hasMultiple = files.length > 1;

  // تحديد نوع الملف من الامتداد
  const getFileType = (url: string): 'image' | 'pdf' | 'other' => {
    if (currentFile.type) return currentFile.type;

    const extension = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
      return 'image';
    }
    if (extension === 'pdf') {
      return 'pdf';
    }
    return 'other';
  };

  const fileType = getFileType(currentFile.url);

  // التنقل للملف التالي
  const handleNext = () => {
    if (currentIndex < files.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // التنقل للملف السابق
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // تحميل الملف
  const handleDownload = async () => {
    try {
      const response = await fetch(currentFile.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentFile.name || `file-${currentIndex + 1}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      // فتح في تاب جديد كبديل
      window.open(currentFile.url, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>
                {currentFile.name || `ملف ${currentIndex + 1}`}
              </DialogTitle>
              {hasMultiple && (
                <DialogDescription>
                  {currentIndex + 1} من {files.length}
                </DialogDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleDownload}
                title="تحميل"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* محتوى الملف */}
        <div className="flex-1 relative overflow-hidden bg-muted/20">
          {/* عرض الصورة */}
          {fileType === 'image' && (
            <div className="h-full flex items-center justify-center p-6">
              <img
                src={currentFile.url}
                alt={currentFile.name || 'Preview'}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          )}

          {/* عرض PDF */}
          {fileType === 'pdf' && (
            <iframe
              src={currentFile.url}
              className="w-full h-full"
              title={currentFile.name || 'PDF Preview'}
            />
          )}

          {/* عرض الملفات الأخرى */}
          {fileType === 'other' && (
            <div className="h-full flex flex-col items-center justify-center gap-4 p-6">
              <FileText className="h-24 w-24 text-muted-foreground" />
              <p className="text-lg font-medium text-muted-foreground">
                لا يمكن معاينة هذا النوع من الملفات
              </p>
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                تحميل الملف
              </Button>
            </div>
          )}

          {/* أزرار التنقل */}
          {hasMultiple && (
            <>
              {/* السابق */}
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full shadow-lg"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>

              {/* التالي */}
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full shadow-lg"
                onClick={handleNext}
                disabled={currentIndex === files.length - 1}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {hasMultiple && (
          <div className="border-t p-4 bg-background">
            <div className="flex gap-2 overflow-x-auto">
              {files.map((file, index) => {
                const thumbType = getFileType(file.url);
                return (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`
                      relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all
                      ${
                        index === currentIndex
                          ? 'border-purple-600 ring-2 ring-purple-600/20'
                          : 'border-transparent hover:border-gray-300'
                      }
                    `}
                  >
                    {thumbType === 'image' ? (
                      <img
                        src={file.url}
                        alt={file.name || `File ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
