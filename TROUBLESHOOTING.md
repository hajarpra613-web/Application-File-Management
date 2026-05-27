# 🔧 Troubleshooting Guide - Gagal Memuat Berkas Lamaran

## Masalah: "Gagal memuat - Periksa koneksi dan coba lagi"

### 🔍 Step-by-Step Debugging

#### Step 1: Cek Console Log
Buka Chrome DevTools atau mobile console untuk melihat output debug:

```bash
=== DEBUG API URL ===
Test URL: https://superhero-geiger-enticing.ngrok-free.dev/api/drive/files
Environment:
  EXPO_PUBLIC_API_URL: https://superhero-geiger-enticing.ngrok-free.dev
  EXPO_PUBLIC_DOMAIN: (not set)
```

**Apa yang harus terlihat:**
- ✅ EXPO_PUBLIC_API_URL harus ada dan tidak kosong
- ✅ Response status harus `200`
- ✅ CORS headers harus ada: `access-control-allow-origin`

#### Step 2: Pastikan API Server Berjalan

```bash
# Terminal 1: Jalankan API Server
cd artifacts/api-server
pnpm dev

# Output yang diharapkan:
# [API] GET /api/drive/files - Processing request
# [API] GET /api/drive/files - Success { files: 5, configured: false }
```

**Jika error:**
```bash
# Build ulang
pnpm build

# Cek error
pnpm dev
```

#### Step 3: Test API Secara Langsung

```bash
# Test dengan curl
curl -H "Accept: application/json" \
  -H "ngrok-skip-browser-warning: true" \
  https://superhero-geiger-enticing.ngrok-free.dev/api/drive/files

# Respon yang diharapkan:
{
  "files": [
    {
      "id": "demo-1",
      "name": "CV_Ahmad_Fauzi.pdf",
      "mimeType": "application/pdf",
      "size": 245760,
      "modifiedTime": "2026-05-24T...",
      "configured": false
    }
  ],
  "total": 5,
  "configured": false,
  "message": "Google Drive not configured. Showing demo files..."
}
```

---

## 🛠️ Solusi Berdasarkan Gejala

### ❌ Error: "Failed to fetch"
**Penyebab:** 
- API server tidak running
- ngrok URL expired
- Network unreachable

**Solusi:**
1. Jalankan API server: `cd artifacts/api-server && pnpm dev`
2. Tunggu hingga melihat `listening on port 3000`
3. Jika ngrok URL tidak valid, generate URL baru dengan ngrok

### ❌ CORS Error: "No 'Access-Control-Allow-Origin' header"
**Penyebab:** CORS tidak dikonfigurasi di server

**Solusi:** CORS sudah diperbaiki di `artifacts/api-server/src/app.ts`
```bash
pnpm build  # Rebuild dengan CORS config baru
pnpm dev    # Jalankan
```

### ❌ Error: "0 files" di halaman
**Penyebab:** 
- Google Drive belum dikonfigurasi (normal - menampil demo files)
- Atau error fetch tapi tidak ditampilkan

**Solusi:**
1. Jika `configured: false` → ini NORMAL, menampil demo files
2. Jika loading forever → cek CORS error di console
3. Lihat banner "Mode Demo" - ini konfirmasi demo files ditampilkan

### ❌ ngrok URL Expired: "Tunnel not found"
**Penyebab:** ngrok URL mengalami timeout setelah beberapa jam

**Solusi:**
```bash
# 1. Generate URL ngrok baru
ngrok http 3000

# 2. Update .env.local dengan URL baru
# artifacts/mobile/.env.local
EXPO_PUBLIC_API_URL=https://[NEW-NGROK-URL]

# 3. Restart aplikasi
pnpm dev
```

---

## ✅ Checklist Verifikasi

- [ ] API Server berjalan di port 3000
- [ ] `pnpm run build` di artifacts/api-server berhasil
- [ ] .env.local berisi EXPO_PUBLIC_API_URL
- [ ] Console log menampilkan URL yang benar
- [ ] Response status 200
- [ ] CORS headers present di response
- [ ] Demo files ditampilkan (5 file: CV, Surat, Ijazah, Sertifikat, Portofolio)

---

## 📝 Log yang Berguna untuk Debugging

Jalankan di console dan capture output:

```javascript
// Di console browser atau Expo dev tools
(() => {
  const testUrl = "https://superhero-geiger-enticing.ngrok-free.dev/api/drive/files";
  fetch(testUrl, {
    headers: {
      'Accept': 'application/json',
      'ngrok-skip-browser-warning': 'true'
    }
  })
    .then(res => {
      console.log("Status:", res.status);
      console.log("Headers:", Object.fromEntries(res.headers));
      return res.json();
    })
    .then(data => console.log("Data:", JSON.stringify(data, null, 2)))
    .catch(err => console.error("Error:", err));
})();
```

---

## 🆘 Jika Masih Error

1. **Kumpulkan informasi:**
   - Screenshot console error
   - Output dari `pnpm dev`
   - Network tab dari DevTools
   - Output dari `curl` test

2. **Reset lingkungan:**
   ```bash
   pnpm install
   pnpm build
   ```

3. **Cek ulang konfigurasi:**
   - `.env.local` file ada
   - Tidak ada typo di URL
   - Port 3000 tidak sudah terpakai

---

## 📞 Quick Commands

```bash
# Clean install
pnpm install && pnpm build

# Build & run server
cd artifacts/api-server
pnpm build && pnpm dev

# Run mobile in separate terminal
cd artifacts/mobile  
pnpm dev

# Test API endpoint
curl -H "Accept: application/json" -H "ngrok-skip-browser-warning: true" \
  "https://superhero-geiger-enticing.ngrok-free.dev/api/drive/files"
```
