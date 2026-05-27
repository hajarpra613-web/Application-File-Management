@echo off
REM Build APK Helper Script for Windows - Manajemen Berkas Lamaran

echo.
echo =========================================
echo 🚀 APK BUILD HELPER (Windows)
echo =========================================
echo.

REM Check if in correct directory
if not exist "package.json" (
    echo ❌ Error: Jalankan script ini dari folder artifacts\mobile
    exit /b 1
)

echo Pilih opsi build:
echo.
echo 1) Build APK Preview (untuk testing - EAS Cloud)
echo 2) Build APK Production (EAS Cloud)
echo 3) Build APK Lokal (memerlukan Android SDK)
echo 4) Lihat status build yang sedang berjalan
echo 5) Download APK dari build yang sudah selesai
echo.

set /p choice="Pilih opsi (1-5): "

if "%choice%"=="1" (
    echo.
    echo 📦 Building Preview APK...
    echo Pastikan sudah login: npx eas login
    echo.
    call npx eas build --platform android --profile preview
) else if "%choice%"=="2" (
    echo.
    echo 📦 Building Production APK...
    echo Pastikan sudah login: npx eas login
    echo.
    call npx eas build --platform android --profile production
) else if "%choice%"=="3" (
    echo.
    echo 🔨 Building APK Lokal...
    echo ⚠️  Memerlukan Android SDK, Java 17+, dan ANDROID_HOME configured
    echo.
    call npx eas build --platform android --local=true
) else if "%choice%"=="4" (
    echo.
    echo 📊 Melihat status build...
    call npx eas build:list
) else if "%choice%"=="5" (
    echo.
    echo 📥 Download APK...
    call npx eas build:list
    echo.
    set /p build_id="Masukkan Build ID: "
    call npx eas build:download %build_id%
) else (
    echo ❌ Opsi tidak valid
    exit /b 1
)

echo.
echo ✅ Selesai!
echo.
pause
