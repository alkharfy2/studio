# قواعد Firestore المطلوبة

## المشكلة الحالية

خطأ في صلاحيات التعليقات:
```
Error loading comments: FirebaseError: Missing or insufficient permissions.
```

## الحل: تحديث قواعد Firestore

يجب تحديث قواعد Firestore في Firebase Console لتسمح بقراءة وكتابة التعليقات.

### الخطوات:

1. **افتح Firebase Console:**
   - اذهب إلى: https://console.firebase.google.com/
   - اختر مشروعك

2. **اذهب إلى Firestore Database:**
   - من القائمة الجانبية: Build > Firestore Database
   - اختر تبويب "Rules"

3. **أضف القواعد التالية:**

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Users collection - يمكن للمستخدمين قراءة وكتابة بياناتهم فقط
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null &&
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Tasks collection
    match /tasks/{taskId} {
      // القراءة: جميع المستخدمين المسجلين
      allow read: if request.auth != null;

      // الكتابة: Admin و Moderator فقط
      allow create: if request.auth != null &&
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'moderator'];

      allow update: if request.auth != null &&
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'moderator'];

      allow delete: if request.auth != null &&
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Task Comments collection - **الإضافة المطلوبة**
    match /taskComments/{commentId} {
      // القراءة: جميع المستخدمين المسجلين
      allow read: if request.auth != null;

      // الإنشاء: أي مستخدم مسجل يمكنه إضافة تعليق
      allow create: if request.auth != null &&
                       request.resource.data.userId == request.auth.uid;

      // الحذف: صاحب التعليق أو Admin
      allow delete: if request.auth != null &&
                       (resource.data.userId == request.auth.uid ||
                        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }

    // Notifications collection
    match /notifications/{notificationId} {
      // القراءة: المستخدم المالك فقط
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;

      // الكتابة: Admin و Moderator
      allow create: if request.auth != null &&
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'moderator'];

      allow update: if request.auth != null && resource.data.userId == request.auth.uid;

      allow delete: if request.auth != null &&
                       (resource.data.userId == request.auth.uid ||
                        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }

    // Task Timeline collection
    match /taskTimeline/{timelineId} {
      // القراءة: جميع المستخدمين المسجلين
      allow read: if request.auth != null;

      // الإنشاء: النظام تلقائياً عند تحديث المهام
      allow create: if request.auth != null;
    }

    // FCM Tokens collection
    match /fcmTokens/{tokenId} {
      // القراءة والكتابة: المستخدم المالك فقط
      allow read, write: if request.auth != null && request.auth.uid == tokenId;

      // القراءة: Admin لإرسال الإشعارات
      allow read: if request.auth != null &&
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

4. **انشر القواعد (Publish):**
   - اضغط على زر "Publish" في الأعلى

## التحقق من نجاح التحديث

بعد تحديث القواعد:

1. أعد تحميل الصفحة في المتصفح
2. افتح صفحة تفاصيل مهمة
3. يجب أن تظهر التعليقات بدون أخطاء
4. جرب إضافة تعليق جديد

## ملاحظات مهمة

- ✅ **الأمان:** القواعد تسمح فقط للمستخدمين المصرح لهم
- ✅ **التعليقات:** أي مستخدم مسجل يمكنه قراءة وإضافة تعليق
- ✅ **الحذف:** فقط صاحب التعليق أو Admin
- ⚠️ **انتبه:** القواعد تتطلب أن يكون حقل `role` موجود في مستند المستخدم في collection `users`

## البديل المؤقت (للتطوير فقط - غير آمن)

إذا كنت في بيئة تطوير وتريد السماح بكل شيء مؤقتاً:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

⚠️ **تحذير:** لا تستخدم هذه القواعد في الإنتاج!

## مصادر إضافية

- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Testing Firestore Rules](https://firebase.google.com/docs/firestore/security/test-rules-emulator)
