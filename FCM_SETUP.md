# إعداد Firebase Cloud Messaging (FCM) - دليل التثبيت الكامل

هذا الدليل يشرح كيفية تفعيل نظام الإشعارات الفورية (Push Notifications) في Cveeez باستخدام Firebase Cloud Messaging.

## 📋 المتطلبات الأساسية

- مشروع Firebase نشط (موجود بالفعل)
- صلاحيات المدير في Firebase Console
- Node.js و npm مثبتين على الجهاز

---

## 🔧 الخطوة 1: الحصول على VAPID Key من Firebase

1. افتح [Firebase Console](https://console.firebase.google.com/)
2. اختر مشروعك
3. اذهب إلى **Project Settings** (إعدادات المشروع)
4. انتقل إلى تبويب **Cloud Messaging**
5. ابحث عن قسم **Web Push certificates**
6. إذا لم يكن موجودًا، اضغط على **Generate key pair**
7. انسخ الـ **Key pair** (VAPID Key)

---

## 🔑 الخطوة 2: تحديث Service Worker

افتح الملف `/public/firebase-messaging-sw.js` وقم بتحديث إعدادات Firebase:

```javascript
// استبدل هذه القيم بقيم مشروعك من Firebase Console
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

يمكنك العثور على هذه القيم في:
- Firebase Console → Project Settings → General → Your apps

---

## 🌐 الخطوة 3: تحديث ملف البيئة

أضف VAPID Key إلى ملف `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key-here
```

---

## ⚙️ الخطوة 4: تثبيت Firebase Functions

### 4.1 تثبيت Firebase CLI

إذا لم يكن مثبتًا بالفعل:

```bash
npm install -g firebase-tools
```

### 4.2 تسجيل الدخول

```bash
firebase login
```

### 4.3 تهيئة Functions

من مجلد المشروع الرئيسي:

```bash
cd functions
npm install
```

### 4.4 نشر Cloud Functions

```bash
firebase deploy --only functions
```

هذا سينشر 4 Cloud Functions:
- ✅ `sendNotification` - إرسال إشعار فوري عند إنشاء notification جديد
- ✅ `checkOverdueTasks` - فحص المهام المتأخرة كل ساعة
- ✅ `sendWelcomeNotification` - إرسال رسالة ترحيبية للمستخدمين الجدد
- ✅ `cleanOldNotifications` - حذف الإشعارات القديمة يوميًا

---

## 🔐 الخطوة 5: تفعيل FCM API في Google Cloud

1. افتح [Google Cloud Console](https://console.cloud.google.com/)
2. اختر مشروعك (نفس اسم مشروع Firebase)
3. اذهب إلى **APIs & Services** → **Library**
4. ابحث عن **"Firebase Cloud Messaging API"**
5. اضغط **Enable**

---

## 📱 الخطوة 6: تفعيل الإشعارات في التطبيق

### 6.1 تحديث Dashboard Layout

في الكود الحالي، يجب استدعاء `setupFCM` بعد تسجيل دخول المستخدم.

أضف هذا الكود في `src/app/dashboard/layout.tsx`:

```typescript
'use client';

import { useEffect } from 'react';
import { useUser, useFirestore, useFirebaseApp } from '@/firebase';
import { setupFCM } from '@/lib/fcm';

export default function DashboardLayout({ children }) {
  const user = useUser();
  const firestore = useFirestore();
  const firebaseApp = useFirebaseApp();

  useEffect(() => {
    if (user && firestore && firebaseApp) {
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (vapidKey) {
        setupFCM(firebaseApp, firestore, user.uid, vapidKey);
      }
    }
  }, [user, firestore, firebaseApp]);

  return <>{children}</>;
}
```

### 6.2 طلب الإذن من المستخدم

عند أول تسجيل دخول، سيظهر للمستخدم نافذة منبثقة تطلب الإذن بإرسال الإشعارات.

---

## 🧪 الخطوة 7: اختبار الإشعارات

### اختبار من Firebase Console

1. اذهب إلى **Engage** → **Messaging**
2. اضغط **Create your first campaign**
3. اختر **Firebase Notification messages**
4. املأ البيانات واضغط **Send test message**
5. أدخل FCM token (يمكنك رؤيته في Console.log بعد تسجيل الدخول)

### اختبار من التطبيق

1. سجل دخول كمدير
2. أنشئ مهمة جديدة
3. يجب أن يتلقى المودريتور إشعارًا فوريًا
4. قم بتحديث حالة المهمة
5. يجب أن يتلقى المصمم إشعارًا

---

## 📊 الخطوة 8: مراقبة الإشعارات

### عرض السجلات (Logs)

```bash
firebase functions:log
```

### في Firebase Console

اذهب إلى **Functions** → اختر function → **Logs**

---

## 🔍 استكشاف الأخطاء

### المشكلة: "Permission denied"

**الحل:** تأكد أن المستخدم وافق على إذن الإشعارات في المتصفح.

```javascript
// في Console
Notification.permission // يجب أن يكون "granted"
```

### المشكلة: "No FCM token"

**الحل:** تأكد أن:
1. VAPID Key صحيح في `.env.local`
2. Service Worker مسجل بشكل صحيح
3. Firebase Config صحيح في `firebase-messaging-sw.js`

### المشكلة: "Function not found"

**الحل:** تأكد أنك نشرت Functions:

```bash
firebase deploy --only functions
```

### المشكلة: "Service Worker not registered"

**الحل:** تأكد أن ملف `firebase-messaging-sw.js` موجود في `/public`

---

## 📝 ملاحظات مهمة

### أنواع الإشعارات

النظام يرسل إشعارات في الحالات التالية:

1. **عند إنشاء مهمة جديدة** → إشعار للمودريتور المسؤول
2. **عند تغيير حالة المهمة** → إشعار للمصمم والعميل
3. **عند رفع ملفات التسليم** → إشعار للمودريتور والعميل
4. **عند تأخر المهام** → إشعار للمصمم والمودريتور (كل ساعة)
5. **عند تسجيل مستخدم جديد** → رسالة ترحيبية

### FCM Tokens

- يتم حفظ FCM Token في حقل `fcmToken` في مستند المستخدم
- يتم تحديثه تلقائيًا عند كل تسجيل دخول
- صالح لمدة طويلة، لكن قد يتغير (Firebase يجدده تلقائيًا)

### الحد الأقصى للإشعارات

- Firebase FCM لديه حصة مجانية سخية
- يمكن إرسال ملايين الإشعارات شهريًا مجانًا
- راقب الاستخدام في Firebase Console → Usage

---

## 🚀 خطوات ما بعد التثبيت

1. ✅ اختبر الإشعارات على أجهزة مختلفة (Desktop, Mobile)
2. ✅ تأكد من عمل الإشعارات في الخلفية (Background)
3. ✅ تأكد من عمل الإشعارات في المقدمة (Foreground)
4. ✅ اختبر النقر على الإشعار (يجب أن ينقل للصفحة المناسبة)
5. ✅ راقب السجلات (Logs) للتأكد من عدم وجود أخطاء

---

## 📚 موارد إضافية

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Notifications Guide](https://web.dev/push-notifications-overview/)
- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)

---

## 🆘 الدعم

إذا واجهت أي مشكلة:

1. تحقق من السجلات (Logs) في Firebase Console
2. تحقق من Console في المتصفح (F12)
3. تأكد من تطبيق جميع الخطوات أعلاه
4. راجع ملف `/src/lib/fcm.ts` للتأكد من التكوين

---

## ✅ قائمة التحقق النهائية

- [ ] تم الحصول على VAPID Key من Firebase
- [ ] تم تحديث `firebase-messaging-sw.js` بإعدادات Firebase
- [ ] تم إضافة VAPID Key إلى `.env.local`
- [ ] تم تثبيت Firebase Functions (`cd functions && npm install`)
- [ ] تم نشر Cloud Functions (`firebase deploy --only functions`)
- [ ] تم تفعيل Firebase Cloud Messaging API في Google Cloud
- [ ] تم تحديث Dashboard Layout لاستدعاء `setupFCM`
- [ ] تم اختبار الإشعارات وتعمل بنجاح
