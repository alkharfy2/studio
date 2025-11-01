'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
          <Card className="w-full max-w-2xl shadow-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold text-red-600 dark:text-red-400">
                عذراً، حدث خطأ غير متوقع!
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                نعتذر عن الإزعاج. حدث خطأ أثناء تحميل هذه الصفحة.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Error Details (Development Mode) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                    تفاصيل الخطأ (وضع التطوير فقط):
                  </h3>
                  <div className="text-sm text-red-700 dark:text-red-300 space-y-2">
                    <p className="font-mono bg-red-100 dark:bg-red-900 p-2 rounded overflow-x-auto">
                      <strong>الرسالة:</strong> {this.state.error.message}
                    </p>
                    {this.state.error.stack && (
                      <details className="cursor-pointer">
                        <summary className="font-semibold hover:text-red-900 dark:hover:text-red-100">
                          عرض Stack Trace
                        </summary>
                        <pre className="mt-2 text-xs bg-red-100 dark:bg-red-900 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                          {this.state.error.stack}
                        </pre>
                      </details>
                    )}
                    {this.state.errorInfo && (
                      <details className="cursor-pointer">
                        <summary className="font-semibold hover:text-red-900 dark:hover:text-red-100">
                          عرض Component Stack
                        </summary>
                        <pre className="mt-2 text-xs bg-red-100 dark:bg-red-900 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              )}

              {/* User-friendly message */}
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  ماذا يمكنك فعله؟
                </h3>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-2 list-disc list-inside">
                  <li>حاول تحديث الصفحة باستخدام الزر أدناه</li>
                  <li>إذا استمرت المشكلة، ارجع إلى الصفحة الرئيسية</li>
                  <li>تحقق من اتصالك بالإنترنت</li>
                  <li>امسح ذاكرة التخزين المؤقت للمتصفح (Cache)</li>
                  <li>إذا استمرت المشكلة، تواصل مع الدعم الفني</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleReload}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  تحديث الصفحة
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="mr-2 h-4 w-4" />
                  العودة للرئيسية
                </Button>
              </div>

              {/* Reset Button (Development) */}
              {process.env.NODE_ENV === 'development' && (
                <Button
                  onClick={this.handleReset}
                  variant="ghost"
                  className="w-full text-gray-500"
                  size="sm"
                >
                  إعادة تعيين Error Boundary (Dev Only)
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for easier use
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
