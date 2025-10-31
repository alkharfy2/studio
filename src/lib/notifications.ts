import { addDoc, collection, Firestore, serverTimestamp } from 'firebase/firestore';
import type { Notification } from './types';

export interface CreateNotificationParams {
  firestore: Firestore;
  userId: string;
  title: string;
  message: string;
  body?: string;
  link?: string;
  type?: 'task' | 'system' | 'payment';
  taskId?: string;
}

/**
 * Create a notification in Firestore
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  const { firestore, userId, title, message, body, link, type, taskId } = params;

  try {
    await addDoc(collection(firestore, 'notifications'), {
      userId,
      title,
      message,
      body,
      link,
      type: type || 'system',
      taskId,
      isRead: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Send notification to multiple users
 */
export async function createNotificationForMultipleUsers(
  params: Omit<CreateNotificationParams, 'userId'> & { userIds: string[] }
): Promise<void> {
  const { firestore, userIds, title, message, body, link, type, taskId } = params;

  try {
    await Promise.all(
      userIds.map((userId) =>
        createNotification({
          firestore,
          userId,
          title,
          message,
          body,
          link,
          type,
          taskId,
        })
      )
    );
  } catch (error) {
    console.error('Error creating notifications for multiple users:', error);
    throw error;
  }
}

/**
 * Notify when a new task is created
 */
export async function notifyTaskCreated(
  firestore: Firestore,
  taskId: string,
  taskDisplayId: string,
  clientName: string,
  designerId: string,
  moderatorId: string
): Promise<void> {
  // Notify designer
  await createNotification({
    firestore,
    userId: designerId,
    title: 'مهمة جديدة تم تعيينها لك',
    message: `تم تعيين مهمة جديدة لك: ${clientName}`,
    body: `رقم المهمة: #${taskDisplayId.slice(-8)}`,
    link: `/dashboard/tasks/${taskId}`,
    type: 'task',
    taskId,
  });

  // Notify moderator
  await createNotification({
    firestore,
    userId: moderatorId,
    title: 'مهمة جديدة تم إنشاؤها',
    message: `تم إنشاء مهمة جديدة: ${clientName}`,
    body: `رقم المهمة: #${taskDisplayId.slice(-8)}`,
    link: `/dashboard/tasks/${taskId}`,
    type: 'task',
    taskId,
  });
}

/**
 * Notify when task status changes
 */
export async function notifyTaskStatusChanged(
  firestore: Firestore,
  taskId: string,
  taskDisplayId: string,
  clientName: string,
  newStatus: string,
  moderatorId: string,
  designerId: string
): Promise<void> {
  const statusText: Record<string, string> = {
    new: 'جديد',
    in_progress: 'قيد التنفيذ',
    submitted: 'تم التسليم',
    to_review: 'قيد المراجعة',
    done: 'مكتمل',
    cancelled: 'ملغي',
  };

  const userIds = [moderatorId, designerId].filter(Boolean);

  await createNotificationForMultipleUsers({
    firestore,
    userIds,
    title: 'تحديث حالة المهمة',
    message: `تم تحديث حالة مهمة ${clientName} إلى: ${statusText[newStatus] || newStatus}`,
    body: `رقم المهمة: #${taskDisplayId.slice(-8)}`,
    link: `/dashboard/tasks/${taskId}`,
    type: 'task',
    taskId,
  });
}

/**
 * Notify when delivery files are uploaded
 */
export async function notifyDeliveryUploaded(
  firestore: Firestore,
  taskId: string,
  taskDisplayId: string,
  clientName: string,
  moderatorId: string
): Promise<void> {
  await createNotification({
    firestore,
    userId: moderatorId,
    title: 'تم رفع ملفات التسليم',
    message: `تم رفع ملفات التسليم لمهمة: ${clientName}`,
    body: `رقم المهمة: #${taskDisplayId.slice(-8)}. يرجى المراجعة.`,
    link: `/dashboard/tasks/${taskId}`,
    type: 'task',
    taskId,
  });
}

/**
 * Notify when payment is updated
 */
export async function notifyPaymentUpdated(
  firestore: Firestore,
  taskId: string,
  taskDisplayId: string,
  clientName: string,
  amount: number,
  moderatorId: string,
  designerId: string
): Promise<void> {
  const userIds = [moderatorId, designerId].filter(Boolean);

  await createNotificationForMultipleUsers({
    firestore,
    userIds,
    title: 'تحديث الدفع',
    message: `تم تحديث الدفع لمهمة ${clientName}: ${amount} جنيه`,
    body: `رقم المهمة: #${taskDisplayId.slice(-8)}`,
    link: `/dashboard/tasks/${taskId}`,
    type: 'payment',
    taskId,
  });
}

/**
 * Notify when task is overdue
 */
export async function notifyTaskOverdue(
  firestore: Firestore,
  taskId: string,
  taskDisplayId: string,
  clientName: string,
  designerId: string,
  moderatorId: string
): Promise<void> {
  const userIds = [moderatorId, designerId].filter(Boolean);

  await createNotificationForMultipleUsers({
    firestore,
    userIds,
    title: '⚠️ مهمة متأخرة',
    message: `مهمة ${clientName} متأخرة عن موعد التسليم`,
    body: `رقم المهمة: #${taskDisplayId.slice(-8)}. يرجى المتابعة بشكل عاجل.`,
    link: `/dashboard/tasks/${taskId}`,
    type: 'task',
    taskId,
  });
}
