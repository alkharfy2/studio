'use client';

import React, { useRef, useState } from 'react';
import { Upload, X, FileIcon, ImageIcon, Loader2 } from 'lucide-react';
import { Button } from './button';
import { Card } from './card';
import { Progress } from './progress';
import { cn } from '@/lib/utils';

export interface FileUploadProps {
  /**
   * الملفات المرفوعة حالياً (URLs)
   */
  value?: string[];

  /**
   * دالة يتم استدعاؤها عند تغيير الملفات
   */
  onChange?: (urls: string[]) => void;

  /**
   * دالة الرفع الفعلية (يجب أن تُمرر من الخارج)
   */
  onUpload: (files: File[]) => Promise<string[]>;

  /**
   * السماح برفع ملفات متعددة
   */
  multiple?: boolean;

  /**
   * النص التوضيحي
   */
  label?: string;

  /**
   * وصف إضافي
   */
  description?: string;

  /**
   * حالة التعطيل
   */
  disabled?: boolean;

  /**
   * الحد الأقصى لعدد الملفات
   */
  maxFiles?: number;
}

export function FileUpload({
  value = [],
  onChange,
  onUpload,
  multiple = true,
  label,
  description,
  disabled = false,
  maxFiles,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState('');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // التحقق من الحد الأقصى
    if (maxFiles && value.length + files.length > maxFiles) {
      alert(`الحد الأقصى للملفات: ${maxFiles}`);
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // رفع الملفات مع تتبع التقدم
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCurrentFile(file.name);
        setProgress(((i + 1) / files.length) * 100);

        const result = await onUpload([file]);
        urls.push(...result);
      }

      // إضافة الـ URLs الجديدة
      onChange?.([...value, ...urls]);
    } catch (error) {
      console.error('Upload error:', error);
      alert('فشل رفع الملفات');
    } finally {
      setUploading(false);
      setProgress(0);
      setCurrentFile('');
      // إعادة تعيين input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (index: number) => {
    const newUrls = value.filter((_, i) => i !== index);
    onChange?.(newUrls);
  };

  const handleBrowse = () => {
    fileInputRef.current?.click();
  };

  const isImage = (url: string) => {
    return /\.(jpg|jpeg|png|webp|gif)$/i.test(url);
  };

  return (
    <div className="space-y-3">
      {/* Label */}
      {label && (
        <div>
          <label className="text-sm font-medium">{label}</label>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      )}

      {/* Upload Button */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/heic,application/pdf"
          disabled={disabled || uploading}
        />

        <Button
          type="button"
          variant="outline"
          onClick={handleBrowse}
          disabled={disabled || uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              جاري الرفع...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              اختر ملفات
            </>
          )}
        </Button>
      </div>

      {/* Progress Bar */}
      {uploading && (
        <Card className="p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{currentFile}</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        </Card>
      )}

      {/* Uploaded Files */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {value.map((url, index) => (
            <Card
              key={index}
              className="relative group overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Remove Button */}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                disabled={disabled}
                className={cn(
                  "absolute top-1 right-1 z-10",
                  "bg-destructive text-destructive-foreground",
                  "rounded-full p-1",
                  "opacity-0 group-hover:opacity-100",
                  "transition-opacity",
                  "hover:bg-destructive/90"
                )}
              >
                <X className="h-3 w-3" />
              </button>

              {/* File Preview */}
              <div className="aspect-square relative">
                {isImage(url) ? (
                  <img
                    src={url}
                    alt={`File ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-muted">
                    <FileIcon className="h-12 w-12 text-muted-foreground mb-2" />
                    <span className="text-xs text-muted-foreground px-2 text-center">
                      {url.split('/').pop()?.slice(0, 20)}...
                    </span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {value.length === 0 && !uploading && (
        <Card className="p-8 border-dashed">
          <div className="flex flex-col items-center justify-center text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              لم يتم رفع ملفات بعد
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
