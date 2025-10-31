'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUpload } from '@/components/ui/file-upload';
import { uploadMultipleFiles } from '@/lib/storage-service';
import { STORAGE_FOLDERS } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

export default function TestUploadPage() {
  const [urls, setUrls] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  // معرف مهمة تجريبي
  const testTaskId = `test_${Date.now()}`;

  const handleUpload = async (files: File[]) => {
    setTesting(true);
    try {
      const uploadedUrls = await uploadMultipleFiles(
        files,
        testTaskId,
        STORAGE_FOLDERS.OLD_CV,
        (current, total, fileName) => {
          console.log(`رفع ${current}/${total}: ${fileName}`);
        }
      );
      return uploadedUrls;
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3F51B5] to-[#9575CD] p-8">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-white/95 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {urls.length > 0 ? (
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              ) : (
                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-3xl">📤</span>
                </div>
              )}
            </div>
            <CardTitle className="text-3xl font-headline">
              اختبار Supabase Storage
            </CardTitle>
            <CardDescription>
              تأكد من أن نظام رفع الملفات يعمل بشكل صحيح
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* FileUpload Component */}
            <FileUpload
              value={urls}
              onChange={setUrls}
              onUpload={handleUpload}
              multiple={true}
              label="رفع ملفات تجريبية"
              description="يمكنك رفع صور أو ملفات PDF (الحد الأقصى 8 ميجابايت)"
            />

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">معلومات الاختبار:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• معرف المهمة التجريبي: <code className="bg-blue-100 px-1 rounded">{testTaskId}</code></li>
                <li>• المجلد: <code className="bg-blue-100 px-1 rounded">tasks/{testTaskId}/old_cv/</code></li>
                <li>• عدد الملفات المرفوعة: <strong>{urls.length}</strong></li>
              </ul>
            </div>

            {/* URLs */}
            {urls.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">✅ الملفات المرفوعة بنجاح:</h3>
                <div className="space-y-2">
                  {urls.map((url, index) => (
                    <div key={index} className="text-xs bg-white border rounded p-2 break-all">
                      <strong>#{index + 1}:</strong>{' '}
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {url}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => setUrls([])}
                variant="outline"
                className="flex-1"
                disabled={urls.length === 0}
              >
                مسح الكل
              </Button>
              <Button
                onClick={() => window.location.reload()}
                className="flex-1"
              >
                إعادة الاختبار
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
