#!/bin/bash

# Script لتوليد أيقونات PWA من SVG
# الاستخدام: ./GENERATE_ICONS.sh

echo "🎨 توليد أيقونات PWA..."

# التحقق من وجود ImageMagick
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick غير مثبت!"
    echo ""
    echo "📥 للتثبيت:"
    echo "   Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "   macOS:         brew install imagemagick"
    echo "   Windows:       https://imagemagick.org/script/download.php"
    echo ""
    echo "💡 أو استخدم الطريقة الأونلاين:"
    echo "   https://www.pwabuilder.com/imageGenerator"
    exit 1
fi

# التحقق من وجود الأيقونة الأساسية
if [ ! -f "../icon.svg" ]; then
    echo "❌ الملف icon.svg غير موجود في /public/"
    exit 1
fi

echo "✅ تم العثور على icon.svg"
echo "🔄 جارٍ التوليد..."

# توليد جميع الأحجام
convert ../icon.svg -resize 72x72 icon-72x72.png
echo "  ✓ icon-72x72.png"

convert ../icon.svg -resize 96x96 icon-96x96.png
echo "  ✓ icon-96x96.png"

convert ../icon.svg -resize 128x128 icon-128x128.png
echo "  ✓ icon-128x128.png"

convert ../icon.svg -resize 144x144 icon-144x144.png
echo "  ✓ icon-144x144.png"

convert ../icon.svg -resize 152x152 icon-152x152.png
echo "  ✓ icon-152x152.png"

convert ../icon.svg -resize 192x192 icon-192x192.png
echo "  ✓ icon-192x192.png"

convert ../icon.svg -resize 384x384 icon-384x384.png
echo "  ✓ icon-384x384.png"

convert ../icon.svg -resize 512x512 icon-512x512.png
echo "  ✓ icon-512x512.png"

echo ""
echo "🎉 تم توليد جميع الأيقونات بنجاح!"
echo ""
echo "📁 الملفات موجودة في: /public/icons/"
echo ""
echo "✅ الخطوة التالية:"
echo "   افتح المتصفح وجرّب التثبيت!"
