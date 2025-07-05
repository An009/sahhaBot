'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <WifiOff className="h-8 w-8 text-gray-400" />
          </div>
          <CardTitle className="text-xl">غير متصل بالإنترنت</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            يبدو أنك غير متصل بالإنترنت. يمكنك الاستمرار في استخدام التطبيق مع الميزات المحدودة.
          </p>
          <div className="space-y-2">
            <p className="text-sm font-medium">الميزات المتاحة:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• تحليل الأعراض الأساسي</li>
              <li>• النصائح الطبية العامة</li>
              <li>• أرقام الطوارئ</li>
            </ul>
          </div>
          <Button onClick={handleRefresh} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            إعادة المحاولة
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}