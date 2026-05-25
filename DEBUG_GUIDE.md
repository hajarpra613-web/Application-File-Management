# Panduan Debug: "Gagal Memuat, Periksa Koneksi Anda Kembali"

## 🔍 Diagnosis Masalah

Error ini terjadi ketika mobile app tidak bisa menghubungi API server. Ada beberapa kemungkinan penyebab:

---

## ✅ Checklist Troubleshooting

### 1. **Pastikan Server API Running**

```bash
# Arahkan ke folder api-server
cd artifacts/api-server

# Jalankan server (development mode)
pnpm run dev
```

Jika berhasil, Anda akan melihat output seperti:
```
Server listening on port 3000
```

### 2. **Verifikasi Environment Variables di Server**

Buat file `.env` di `artifacts/api-server/`:

```env
PORT=3000
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"YOUR_PROJECT","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"..."}
GOOGLE_DRIVE_FOLDER_ID=1234567890abcdefghijk
SESSION_SECRET=your_random_secret_min_32_chars_here_0123456789
```

**PENTING**: 
- Pastikan `GOOGLE_SERVICE_ACCOUNT_JSON` adalah valid JSON (single line, semua quote di-escape)
- Dapatkan dari Google Cloud Console → Service Accounts → Create key (JSON format)
- Pastikan service account sudah punya akses ke folder Google Drive

### 3. **Verifikasi Environment Variable di Mobile App**

Cek file `artifacts/mobile/.env.local` atau `artifacts/mobile/.env`:

```env
EXPO_PUBLIC_DOMAIN=localhost:3000
```

Jika testing dengan physical device atau emulator, gunakan IP address yang benar:

```env
EXPO_PUBLIC_DOMAIN=192.168.1.100:3000
```

### 4. **Test API Endpoint Langsung**

Buka browser atau gunakan curl untuk test:

```bash
# Test endpoint drive files
curl http://localhost:3000/api/drive/files

# Response should be JSON with structure:
# { "files": [...], "total": 0, "configured": false, "message": "..." }
```

Jika dapat response, maka server berjalan baik.

### 5. **Check Mobile App Network Configuration**

Edit `artifacts/mobile/lib/api.ts` untuk debug:

```typescript
import { Platform } from "react-native";

export function getApiUrl(path: string): string {
  if (Platform.OS === "web") {
    return path;
  }
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  
  // Debug log
  console.log("API Domain:", domain);
  console.log("Full API URL:", domain ? `https://${domain}${path}` : path);
  
  if (domain) {
    return `https://${domain}${path}`;
  }
  return path;
}
```

### 6. **Check Browser Console / Logcat**

**Untuk Expo Go (Android)**:
```bash
# Terminal 1: Start Expo dev server
cd artifacts/mobile
pnpm run dev

# Terminal 2: Watch Android logs
adb logcat | grep "expo\|fetch\|error"
```

**Untuk Web/Browser**:
```bash
cd artifacts/mobile
pnpm run web

# Buka DevTools (F12) → Console → lihat error network requests
```

---

## 🐛 Common Issues dan Solusi

### Issue: "PORT environment variable is required"
**Solusi**: Set `PORT=3000` di `.env` atau saat startup
```bash
PORT=3000 pnpm run start
```

### Issue: "GOOGLE_SERVICE_ACCOUNT_JSON is invalid JSON"
**Solusi**: 
- Pastikan JSON adalah single line tanpa line breaks
- Semua double quotes dalam string harus di-escape dengan backslash
- Gunakan JSON validator: https://jsonlint.com/

### Issue: "Service account doesn't have access to folder"
**Solusi**:
1. Dapatkan email dari service account: `xxxxx@xxxxxx.iam.gserviceaccount.com`
2. Share folder Google Drive ke email tersebut
3. Tunggu ~5 menit untuk propagasi permission

### Issue: "EXPO_PUBLIC_DOMAIN not set, using relative paths"
**Solusi**: 
- Set `EXPO_PUBLIC_DOMAIN` di `.env.local` atau environment
- Pastikan domain + port benar (e.g., `localhost:3000` untuk local testing)
- Untuk physical device, gunakan IP lokal, bukan `localhost`

---

## 🚀 Workflow Testing

### Local Testing (Web + Server di Localhost)

```bash
# Terminal 1: Start API Server
cd artifacts/api-server
PORT=3000 pnpm run dev

# Terminal 2: Start Mobile Web
cd artifacts/mobile
EXPO_PUBLIC_DOMAIN=localhost:3000 pnpm run web
```

### Physical Device Testing

```bash
# Terminal 1: Start API Server (akses dari mana saja dalam network)
cd artifacts/api-server
PORT=3000 pnpm run dev

# Terminal 2: Start Expo
cd artifacts/mobile
EXPO_PUBLIC_DOMAIN=192.168.1.100:3000 pnpm run dev
```

(Ganti `192.168.1.100` dengan IP address komputer Anda di local network)

---

## 📝 Debug Output yang Membantu

Jika masalah persisten, kumpulkan info ini:

1. Output terminal saat server startup:
   ```bash
   PORT=3000 pnpm run start
   ```

2. Response dari API endpoint:
   ```bash
   curl -v http://localhost:3000/api/drive/files
   ```

3. Browser console error (jika web app):
   - Buka DevTools → Network tab
   - Lihat request ke `/api/drive/files`
   - Check response status dan body

4. Server logs saat mobile app mencoba fetch
   - Lihat error message detail di terminal server

---

## 🔗 Referensi

- [Google Cloud Service Account Setup](https://cloud.google.com/docs/authentication/provide-credentials-adc)
- [Expo Environment Variables](https://docs.expo.dev/build-reference/variables/)
- [Express/Node.js Troubleshooting](https://nodejs.org/en/docs/guides/debugging-getting-started/)
