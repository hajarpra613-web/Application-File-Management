#!/bin/bash
# Build APK Helper Script - Manajemen Berkas Lamaran

echo "🚀 APK BUILD HELPER"
echo "===================="
echo ""

# Check if in correct directory
if [ ! -f "package.json" ] || [ ! -f "app.json" ]; then
    echo "❌ Error: Jalankan script ini dari folder artifacts/mobile"
    exit 1
fi

echo "Pilih opsi build:"
echo ""
echo "1) Build APK Preview (untuk testing - EAS Cloud)"
echo "2) Build APK Production (EAS Cloud)"
echo "3) Build APK Lokal (memerlukan Android SDK)"
echo "4) Lihat status build yang sedang berjalan"
echo "5) Download APK dari build yang sudah selesai"
echo ""

read -p "Pilih opsi (1-5): " choice

case $choice in
    1)
        echo "📦 Building Preview APK..."
        echo "Pastikan sudah login: npx eas login"
        echo ""
        npx eas build --platform android --profile preview
        ;;
    2)
        echo "📦 Building Production APK..."
        echo "Pastikan sudah login: npx eas login"
        echo ""
        npx eas build --platform android --profile production
        ;;
    3)
        echo "🔨 Building APK Lokal..."
        echo "⚠️  Memerlukan Android SDK, Java 17+, dan ANDROID_HOME configured"
        echo ""
        npx eas build --platform android --local=true
        ;;
    4)
        echo "📊 Melihat status build..."
        npx eas build:list
        ;;
    5)
        echo "📥 Download APK..."
        npx eas build:list
        echo ""
        read -p "Masukkan Build ID: " build_id
        npx eas build:download $build_id
        ;;
    *)
        echo "❌ Opsi tidak valid"
        exit 1
        ;;
esac

echo ""
echo "✅ Selesai!"
