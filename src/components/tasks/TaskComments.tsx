'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { MessageSquare, Trash2, Loader2, Send } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Comment {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  userRole: string;
  text: string;
  createdAt: any;
}

interface TaskCommentsProps {
  taskId: string;
}

export function TaskComments({ taskId }: TaskCommentsProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // تحميل التعليقات
  useEffect(() => {
    if (!taskId || !firestore) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(firestore, 'taskComments'),
      where('taskId', '==', taskId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedComments = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Comment[];
        setComments(loadedComments);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading comments:', error);
        toast({
          variant: 'destructive',
          title: 'خطأ في التعليقات',
          description: 'تحقق من صلاحيات Firestore للمجموعة taskComments',
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [taskId, firestore, toast]);

  // إضافة تعليق جديد
  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'يرجى كتابة تعليق',
      });
      return;
    }

    if (!user) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'يجب تسجيل الدخول أولاً',
      });
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(firestore, 'taskComments'), {
        taskId,
        userId: user.uid,
        userName: user.name || user.email || 'مستخدم',
        userRole: user.role || 'user',
        text: newComment.trim(),
        createdAt: serverTimestamp(),
      });

      setNewComment('');
      toast({
        title: 'تم بنجاح',
        description: 'تم إضافة التعليق',
      });
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast({
        variant: 'destructive',
        title: 'فشل',
        description: error.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // حذف تعليق
  const handleDeleteComment = async (commentId: string, userId: string) => {
    // التحقق من الصلاحيات
    if (user?.uid !== userId && user?.role !== 'admin') {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'غير مصرح لك بحذف هذا التعليق',
      });
      return;
    }

    try {
      await deleteDoc(doc(firestore, 'taskComments', commentId));
      toast({
        title: 'تم الحذف',
        description: 'تم حذف التعليق بنجاح',
      });
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      toast({
        variant: 'destructive',
        title: 'فشل',
        description: error.message,
      });
    }
  };

  const formatCommentDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'PPp', { locale: ar });
  };

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      admin: 'مدير',
      moderator: 'مشرف',
      designer: 'مصمم',
      client: 'عميل',
      team_leader: 'قائد فريق',
    };
    return roles[role] || role;
  };

  const getInitials = (name: string) => {
    if (!name) return 'M';
    const words = name.split(' ');
    if (words.length >= 2) {
      return words[0][0] + words[1][0];
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          التعليقات ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* نموذج إضافة تعليق جديد */}
        <div className="space-y-3">
          <Textarea
            placeholder="اكتب تعليقك هنا..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <Button
            onClick={handleAddComment}
            disabled={submitting || !newComment.trim()}
            className="w-full"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                جاري الإرسال...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                إضافة تعليق
              </>
            )}
          </Button>
        </div>

        {/* قائمة التعليقات */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-600" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p className="text-muted-foreground">لا توجد تعليقات بعد</p>
              <p className="text-sm text-muted-foreground">كن أول من يعلق على هذه المهمة</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="flex gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                {/* الأفاتار */}
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white font-semibold">
                    {getInitials(comment.userName)}
                  </AvatarFallback>
                </Avatar>

                {/* المحتوى */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h4 className="font-semibold text-sm">{comment.userName}</h4>
                      <p className="text-xs text-muted-foreground">
                        {getRoleLabel(comment.userRole)} • {formatCommentDate(comment.createdAt)}
                      </p>
                    </div>
                    {/* زر الحذف */}
                    {(user?.uid === comment.userId || user?.role === 'admin') && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteComment(comment.id, comment.userId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap break-words">{comment.text}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
