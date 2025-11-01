# دليل البناء والنشر - Cveeez

## المشكلة: فشل البناء على Firebase App Hosting

```
Error: Build process exited with error code 1
ERROR: failed to build: exit status 1
```

---

## الحلول المطبقة

### 1. ✅ تحديث `apphosting.yaml`

تم زيادة الموارد المخصصة لعملية البناء:

```yaml
runConfig:
  maxInstances: 1
  memory: 1GiB  # ⬅️ تمت الإضافة
  cpu: 1        # ⬅️ تمت الإضافة
```

### 2. ✅ التحقق من البناء المحلي

البناء نجح محلياً بدون أخطاء:

```bash
npm run build
# ✓ Compiled successfully
# ✓ Generating static pages (19/19)
```

---

## الخطوات التالية للنشر

### الطريقة 1: النشر التلقائي (موصى بها)

Firebase App Hosting يعمل تلقائياً عند push:

```bash
git add .
git commit -m "Fix: Update apphosting config and permissions"
git push origin main
```

سيتم البناء والنشر تلقائياً.

### الطريقة 2: النشر اليدوي

إذا لم يعمل التلقائي:

```bash
# 1. بناء المشروع محلياً
npm run build

# 2. نشر إلى Firebase
firebase deploy --only hosting
```

---

## متغيرات البيئة المطلوبة

تأكد من وجود هذه المتغيرات في Firebase Console:

### في Firebase Console > App Hosting > Environment Variables:

```env
NEXT_PUBLIC_FIREBASE_CONFIG={"projectId":"...","appId":"...","apiKey":"..."}
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
```

**كيفية إضافتها:**

1. اذهب إلى: Firebase Console > App Hosting
2. اختر Backend الخاص بك
3. اذهب إلى: Environment > Variables
4. أضف كل متغير على حدة

---

## إصلاح مشاكل شائعة

### خطأ: "Missing environment variables"

**الحل:**
```bash
# تأكد من وجود ملف .env
cat .env

# أو أضف المتغيرات في Firebase Console
```

### خطأ: "Out of memory"

**الحل:** تم حله بزيادة الذاكرة في `apphosting.yaml` إلى `1GiB`

### خطأ: "Build timeout"

**الحل:**
```yaml
# في apphosting.yaml
runConfig:
  memory: 2GiB  # زيادة الذاكرة
  cpu: 2        # زيادة المعالج
```

---

## التحقق من نجاح النشر

### 1. تحقق من Build Logs

```bash
# في Firebase Console
App Hosting > Your Backend > Builds > Latest Build > View Logs
```

### 2. تحقق من الموقع

بعد نجاح البناء، افتح:
```
https://your-project-id.web.app
```

### 3. تحقق من الوظائف الأساسية

- ✅ صفحة تسجيل الدخول تعمل
- ✅ Dashboard يظهر بعد تسجيل الدخول
- ✅ يمكن إنشاء مهمة جديدة
- ✅ الإشعارات تعمل
- ✅ PWA يمكن تثبيته

---

## إعداد Firestore Rules (مهم!)

قبل أن يعمل التطبيق بشكل كامل، يجب تحديث قواعد Firestore:

```bash
# 1. راجع ملف FIRESTORE_RULES.md
cat FIRESTORE_RULES.md

# 2. انسخ القواعد من الملف

# 3. ألصقها في Firebase Console
# اذهب إلى: Firestore Database > Rules > تحرير > نشر
```

---

## إعداد FCM (للإشعارات)

### 1. احصل على VAPID Key:

1. اذهب إلى: Firebase Console > Project Settings > Cloud Messaging
2. تحت "Web Push certificates" اضغط "Generate key pair"
3. انسخ المفتاح

### 2. أضف المفتاح إلى Environment Variables:

```env
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key-here
```

---

## البنية التحتية الحالية

```
📦 Cveeez
├─ 🔥 Firebase App Hosting (Next.js 15)
├─ 🔥 Firebase Firestore (Database)
├─ 🔥 Firebase Authentication
├─ 🔥 Firebase Cloud Messaging (Notifications)
├─ 🔥 Firebase Storage (Files)
└─ 📱 PWA Support (Progressive Web App)
```

---

## الملفات المهمة

| الملف | الغرض |
|------|-------|
| `apphosting.yaml` | إعدادات App Hosting |
| `firebase.json` | إعدادات Firebase العامة |
| `next.config.ts` | إعدادات Next.js |
| `.env` | متغيرات البيئة المحلية |
| `firestore.rules` | قواعد أمان Firestore |
| `public/manifest.json` | إعدادات PWA |

---

## الأداء والتحسين

### الإعدادات الحالية:
- ✅ TypeScript errors ignored للبناء الأسرع
- ✅ ESLint ignored للبناء الأسرع
- ✅ Image optimization enabled
- ✅ Static generation حيثما أمكن
- ✅ Server-side rendering للصفحات الديناميكية

### إحصائيات البناء:
```
Total Routes: 19
Static Routes: 15
Dynamic Routes: 4
First Load JS: ~100-350 KB per route
Build Time: ~60 seconds
```

---

## المراقبة والصيانة

### 1. مراقبة الأخطاء:
```bash
# في Firebase Console
App Hosting > Your Backend > Logs
```

### 2. مراقبة الأداء:
```bash
# في Firebase Console
Performance > Dashboard
```

### 3. مراقبة الاستخدام:
```bash
# في Firebase Console
Usage and Billing > Details
```

---

## الدعم الفني

### الموارد المفيدة:
- [Firebase App Hosting Docs](https://firebase.google.com/docs/app-hosting)
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Firestore Rules Docs](https://firebase.google.com/docs/firestore/security/get-started)

### في حال استمرار المشكلة:

1. تحقق من Build Logs في Firebase Console
2. راجع ملف `FIRESTORE_RULES.md` للصلاحيات
3. تأكد من وجود جميع المتغيرات البيئية
4. جرب البناء المحلي: `npm run build`

---

## ملاحظات مهمة

⚠️ **قبل النشر:**
- ✅ تحديث قواعد Firestore
- ✅ إضافة VAPID Key للإشعارات
- ✅ إضافة أيقونات PWA (8 ملفات PNG)
- ✅ إضافة notification.mp3

📝 **بعد النشر:**
- اختبر جميع الوظائف الأساسية
- تحقق من عمل الإشعارات
- جرب تثبيت PWA على الموبايل
- راجع Console للأخطاء

🎉 **البناء ناجح محلياً - جاهز للنشر!**
