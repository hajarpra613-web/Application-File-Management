# 📱 PANDUAN BUILD APK - Manajemen Berkas Lamaran

## ⚠️ PRE-REQUISITE SEBELUM BUILD

### 1. **Setup Expo Account** (Wajib untuk EAS Build)
```bash
# Login ke Expo
npx eas login
# Masukkan username dan password Expo Anda
```

### 2. **Verifikasi Project ID**
Project ID sudah setup di `app.json`:
```
projectId: 8d367402-bb6f-47b0-8f90-a9093630368f
```

---

## 🔧 OPSI BUILD

### **OPSI A: EAS Build (RECOMMENDED - Tanpa Butuh Android SDK)**

#### Step 1: Build APK via EAS
```bash
# Pergi ke folder mobile
cd artifacts/mobile

# Build APK (di cloud, tidak perlu Android SDK)
npx eas build --platform android --local=false

# Atau untuk preview/testing:
npx eas build --platform android --profile preview --local=false
```

#### Step 2: Download APK
- Tunggu proses build selesai (biasanya 10-15 menit)
- Buka link yang diberikan atau akses di https://expo.dev
- Download file APK ke device Android

#### Step 3: Install APK
```bash
# Via ADB (jika punya Android SDK)
adb install manajemen-berkas-lamaran.apk

# Atau: Transfer file ke device dan install manual
```

---

### **OPSI B: Local Build (Butuh Android SDK)**

#### Prerequisites:
- Java Development Kit (JDK) 17+
- Android SDK (API 33 minimum)
- ANDROID_HOME environment variable configured

#### Build Command:
```bash
cd artifacts/mobile

# Build APK locally
npx eas build --platform android --local=true
```

---

## 🌐 KONFIGURASI API UNTUK APK

### Saat Ini Menggunakan:
```
EXPO_PUBLIC_API_URL=https://superhero-geiger-enticing.ngrok-free.dev
```

### ⚠️ PENTING UNTUK PRODUCTION:

#### **Opsi 1: Gunakan ngrok (Testing)**
```bash
# Di folder api-server, jalankan server dengan ngrok tunneling
cd artifacts/api-server
pnpm run dev

# Di terminal terpisah, setup ngrok
ngrok http 3000
# Copy ngrok URL (contoh: https://xxx-xxx.ngrok-free.dev)
# Update di .env.production dan eas.json
```

#### **Opsi 2: Deploy ke Railway (Recommended)**
1. Pergi ke https://railway.app
2. Create new project
3. Deploy `artifacts/api-server` folder
4. Copy deployment URL
5. Update di `.env.production` dan `eas.json`:
```json
{
  "env": {
    "EXPO_PUBLIC_API_URL": "https://your-railway-domain.railway.app"
  }
}
```

#### **Opsi 3: IP Address Lokal (LAN Testing)**
Jika APK ditest dalam network yang sama:
```json
{
  "env": {
    "EXPO_PUBLIC_API_URL": "http://192.168.0.X:3000"
  }
}
```

---

## 📋 BUILD FLOW SUMMARY

### Untuk Development Testing:
```
1. npx eas login                          # Login Expo
2. Update .env.production dengan ngrok    # Setup API URL
3. npx eas build --platform android      # Build APK
4. Download & test di Android device
```

### Untuk Production:
```
1. Setup Railway/Render deployment        # Deploy API server
2. Update eas.json dengan production URL  # Update config
3. Update version di app.json             # Bump version
4. npx eas build --platform android      # Build final APK
5. Deploy ke Google Play Store (optional) # Publish
```

---

## 🐛 TROUBLESHOOTING

### Masalah: "API Connection Failed" di APK
**Solusi:**
- Pastikan API server running dan accessible
- Cek ngrok tunnel masih active
- Verify EXPO_PUBLIC_API_URL di eas.json

### Masalah: "Build Failed"
**Solusi:**
- Jalankan `npx eas build --local` untuk melihat error detail
- Pastikan `expo-env.d.ts` ada
- Check semua import paths benar

### Masalah: Android app crash
**Solusi:**
- Cek logs: `npx eas build --local --verbose`
- Verify Android API level compatibility
- Check GoogleDrive credentials valid

---

## ✅ CHECKLIST SEBELUM BUILD PRODUCTION

- [ ] API server deployed dan accessible
- [ ] EXPO_PUBLIC_API_URL di eas.json sesuai dengan deployment
- [ ] Version di app.json sudah updated
- [ ] Environment variables di Railway/server sudah correct
- [ ] Google Drive credentials valid dan active
- [ ] CORS properly configured di API server
- [ ] Test APK di least 1 Android device

---

## 🚀 COMMAND QUICK REFERENCE

```bash
# Development
npm run dev                               # Test di web/emulator

# Build Preview APK (untuk testing)
npx eas build --platform android --profile preview

# Build Production APK
npx eas build --platform android --profile production

# Build Lokal (tanpa cloud)
npx eas build --platform android --local=true

# Lihat build status
npx eas build:list

# Cancel build
npx eas build:cancel <BUILD_ID>
```

---

## 📞 NEXT STEPS

1. **Pilih opsi deploy API server** (ngrok/Railway)
2. **Update URL di eas.json & .env.production**
3. **Run EAS build command**
4. **Download & test APK**
5. **Iterasi jika ada issue**

Selamat build! 🎉
