# PWA Icons

## ⚠️ الأيقونات مطلوبة

هذا المجلد يجب أن يحتوي على 8 أيقونات بأحجام مختلفة.

---

## 🚀 الطريقة السريعة (موصى بها)

### استخدم PWA Asset Generator الأونلاين:

1. **اذهب إلى:** https://www.pwabuilder.com/imageGenerator

2. **ارفع الأيقونة الأساسية:**
   - استخدم `/public/icon.svg` الموجود في المشروع
   - أو أي صورة بحجم 512x512 على الأقل

3. **حمّل جميع الأحجام:**
   - سيعطيك ملف ZIP يحتوي على جميع الأحجام
   - فك الضغط وضع الملفات هنا

4. **إعادة التسمية:**
   تأكد من أن الملفات مسماة كالتالي:
   ```
   icon-72x72.png
   icon-96x96.png
   icon-128x128.png
   icon-144x144.png
   icon-152x152.png
   icon-192x192.png
   icon-384x384.png
   icon-512x512.png
   ```

---

## 🛠 الطريقة اليدوية (باستخدام ImageMagick)

إذا كان لديك ImageMagick مثبت:

\`\`\`bash
cd public

# توليد جميع الأحجام من SVG
convert icon.svg -resize 72x72 icons/icon-72x72.png
convert icon.svg -resize 96x96 icons/icon-96x96.png
convert icon.svg -resize 128x128 icons/icon-128x128.png
convert icon.svg -resize 144x144 icons/icon-144x144.png
convert icon.svg -resize 152x152 icons/icon-152x152.png
convert icon.svg -resize 192x192 icons/icon-192x192.png
convert icon.svg -resize 384x384 icons/icon-384x384.png
convert icon.svg -resize 512x512 icons/icon-512x512.png
\`\`\`

---

## 📱 أو استخدم NPM Package

\`\`\`bash
# تثبيت pwa-asset-generator
npm install -g pwa-asset-generator

# توليد جميع الأيقونات
pwa-asset-generator public/icon.svg public/icons --icon-only --background "#000000"
\`\`\`

---

## ✅ التحقق

بعد إضافة الأيقونات، تأكد من:

\`\`\`bash
ls public/icons/

# يجب أن ترى:
# icon-72x72.png
# icon-96x96.png
# icon-128x128.png
# icon-144x144.png
# icon-152x152.png
# icon-192x192.png
# icon-384x384.png
# icon-512x512.png
\`\`\`

---

## 📖 مزيد من التفاصيل

راجع: `/PWA_ICONS_GUIDE.md` للتعليمات الكاملة
