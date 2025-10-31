import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

/**
 * Cloud Function: Send Push Notification
 * Triggered when a new notification document is created in Firestore
 */
export const sendNotification = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snapshot, context) => {
    try {
      const notification = snapshot.data();
      const userId = notification.userId;

      functions.logger.info('Processing notification for user:', userId);

      // Get user's FCM token from Firestore
      const userDoc = await admin.firestore()
        .collection('users')
        .where('uid', '==', userId)
        .limit(1)
        .get();

      if (userDoc.empty) {
        functions.logger.warn('User not found:', userId);
        return null;
      }

      const userData = userDoc.docs[0].data();
      const fcmToken = userData?.fcmToken;

      if (!fcmToken) {
        functions.logger.info('No FCM token for user:', userId);
        return null;
      }

      // Prepare the message
      const message: admin.messaging.Message = {
        notification: {
          title: notification.title || 'إشعار جديد',
          body: notification.message || notification.body || '',
        },
        data: {
          link: notification.link || '/dashboard/notifications',
          type: notification.type || 'general',
          taskId: notification.taskId || '',
          notificationId: snapshot.id,
        },
        token: fcmToken,
        android: {
          notification: {
            icon: 'notification_icon',
            color: '#673AB7',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
        apns: {
          payload: {
            aps: {
              badge: 1,
              sound: 'default',
            },
          },
        },
        webpush: {
          notification: {
            icon: '/icon-192.png',
            badge: '/badge-72.png',
          },
          fcmOptions: {
            link: notification.link || '/dashboard/notifications',
          },
        },
      };

      // Send the message
      const response = await admin.messaging().send(message);
      functions.logger.info('Successfully sent message:', response);

      return response;
    } catch (error) {
      functions.logger.error('Error sending notification:', error);
      return null;
    }
  });

/**
 * Cloud Function: Check Overdue Tasks (Scheduled)
 * Runs every hour to check for overdue tasks and send notifications
 */
export const checkOverdueTasks = functions.pubsub
  .schedule('every 1 hours')
  .timeZone('Africa/Cairo') // Egyptian timezone
  .onRun(async (context) => {
    try {
      functions.logger.info('Starting overdue tasks check');

      const now = admin.firestore.Timestamp.now();
      const oneHourAgo = admin.firestore.Timestamp.fromMillis(
        now.toMillis() - (60 * 60 * 1000)
      );

      // Get all overdue tasks that are not completed or cancelled
      const overdueTasks = await admin.firestore()
        .collection('tasks')
        .where('dueDate', '<', now)
        .where('dueDate', '>', oneHourAgo) // Only tasks that became overdue in the last hour
        .where('status', 'in', ['new', 'in_progress', 'submitted', 'to_review'])
        .get();

      functions.logger.info(`Found ${overdueTasks.size} overdue tasks`);

      const notificationPromises: Promise<any>[] = [];

      for (const taskDoc of overdueTasks.docs) {
        const task = taskDoc.data();

        // Create notification for moderator
        notificationPromises.push(
          admin.firestore().collection('notifications').add({
            userId: task.moderatorId,
            title: '⚠️ مهمة متأخرة!',
            message: `المهمة "${task.clientName}" تجاوزت موعد التسليم`,
            body: `رقم المهمة: #${task.taskId.slice(-8)}. يرجى المتابعة بشكل عاجل.`,
            link: `/dashboard/tasks/${taskDoc.id}`,
            taskId: taskDoc.id,
            type: 'task',
            isRead: false,
            createdAt: now,
          })
        );

        // Create notification for designer
        notificationPromises.push(
          admin.firestore().collection('notifications').add({
            userId: task.designerId,
            title: '⚠️ مهمة متأخرة!',
            message: `المهمة "${task.clientName}" تجاوزت موعد التسليم`,
            body: `رقم المهمة: #${task.taskId.slice(-8)}. يرجى إكمال العمل بشكل عاجل.`,
            link: `/dashboard/tasks/${taskDoc.id}`,
            taskId: taskDoc.id,
            type: 'task',
            isRead: false,
            createdAt: now,
          })
        );

        // Update task to mark it as notified (optional)
        notificationPromises.push(
          admin.firestore()
            .collection('tasks')
            .doc(taskDoc.id)
            .update({
              overdueNotificationSent: true,
              overdueNotificationSentAt: now,
            })
        );
      }

      // Wait for all notifications to be created
      await Promise.all(notificationPromises);

      functions.logger.info(`Created ${notificationPromises.length / 3} overdue notifications`);

      return null;
    } catch (error) {
      functions.logger.error('Error checking overdue tasks:', error);
      return null;
    }
  });

/**
 * Cloud Function: Send Welcome Notification
 * Triggered when a new user is created
 */
export const sendWelcomeNotification = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snapshot, context) => {
    try {
      const user = snapshot.data();
      const now = admin.firestore.Timestamp.now();

      // Create welcome notification
      await admin.firestore().collection('notifications').add({
        userId: user.uid,
        title: 'مرحباً بك في Cveeez! 🎉',
        message: `أهلاً ${user.name}، نحن سعداء بانضمامك إلى نظام Cveeez لإدارة السير الذاتية.`,
        body: 'يمكنك الآن البدء في استكشاف النظام والاستفادة من جميع المميزات المتاحة.',
        link: '/dashboard',
        type: 'system',
        isRead: false,
        createdAt: now,
      });

      functions.logger.info('Welcome notification sent to:', user.uid);

      return null;
    } catch (error) {
      functions.logger.error('Error sending welcome notification:', error);
      return null;
    }
  });

/**
 * Cloud Function: Clean Old Notifications (Scheduled)
 * Runs daily to delete read notifications older than 30 days
 */
export const cleanOldNotifications = functions.pubsub
  .schedule('every 24 hours')
  .timeZone('Africa/Cairo')
  .onRun(async (context) => {
    try {
      functions.logger.info('Starting old notifications cleanup');

      const thirtyDaysAgo = admin.firestore.Timestamp.fromMillis(
        Date.now() - (30 * 24 * 60 * 60 * 1000)
      );

      // Get old read notifications
      const oldNotifications = await admin.firestore()
        .collection('notifications')
        .where('isRead', '==', true)
        .where('createdAt', '<', thirtyDaysAgo)
        .get();

      functions.logger.info(`Found ${oldNotifications.size} old notifications to delete`);

      // Delete in batches
      const batch = admin.firestore().batch();
      oldNotifications.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      functions.logger.info(`Deleted ${oldNotifications.size} old notifications`);

      return null;
    } catch (error) {
      functions.logger.error('Error cleaning old notifications:', error);
      return null;
    }
  });
