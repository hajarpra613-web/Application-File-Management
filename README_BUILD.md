# Manajemen Berkas Lamaran Kerja

Aplikasi mobile (Android/iOS) untuk mengelola berkas lamaran kerja dari Google Drive — pilih file, gabungkan menjadi satu PDF, dan simpan ke perangkat.

---

## Prasyarat

| Tool | Versi |
|------|-------|
| Node.js | >= 20 |
| pnpm | >= 9 |
| Expo CLI | otomatis via pnpm |
| EAS CLI | `npm install -g eas-cli` (untuk build APK) |

Install pnpm jika belum ada:
```bash
npm install -g pnpm
```

---

## Struktur Project

```
├── artifacts/
│   ├── mobile/          ← Expo app (source APK)
│   └── api-server/      ← Backend Express server
├── lib/
│   ├── api-spec/        ← OpenAPI spec
│   ├── api-client-react/← Generated React Query hooks
│   ├── api-zod/         ← Generated Zod schemas
│   └── db/              ← Database schema (Drizzle ORM)
├── pnpm-workspace.yaml
└── package.json
```

---

## Setup Environment Variables

Buat file `.env` di `artifacts/api-server/` (atau set di server hosting):

```env
# Wajib untuk Google Drive
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
GOOGLE_DRIVE_FOLDER_ID=your_folder_id_here

# Wajib untuk server
SESSION_SECRET=random_secret_string_min_32_chars
PORT=8080

# Database (opsional jika tidak pakai fitur DB)
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

> **Tanpa credentials Google Drive**, server otomatis berjalan dalam **Mode Demo** dengan 6 file contoh.

---

## Cara Menjalankan Lokal

### 1. Install dependencies
```bash
pnpm install
```

### 2. Jalankan API Server
```bash
pnpm --filter @workspace/api-server run dev
```
Server berjalan di `http://localhost:8080`

### 3. Jalankan Expo App
```bash
# Set domain API server (ganti dengan IP lokal kamu)
export EXPO_PUBLIC_DOMAIN=192.168.1.x:8080

pnpm --filter @workspace/mobile run dev
```

Scan QR code dengan **Expo Go** di HP untuk preview langsung.

---

## Build APK (Android)

### Opsi A: EAS Build (Disarankan — cloud build, tidak perlu Android Studio)

1. Login ke Expo:
```bash
eas login
```

2. Konfigurasi project (pertama kali):
```bash
cd artifacts/mobile
eas build:configure
```

3. Set URL API server production di `artifacts/mobile/app.json`:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://your-api-server.com"
    }
  }
}
```

4. Update `artifacts/mobile/lib/api.ts` — ganti `getApiUrl` agar baca dari `Constants.expoConfig.extra.apiUrl`.

5. Build APK:
```bash
cd artifacts/mobile
eas build --platform android --profile preview
```

APK akan tersedia di dashboard EAS untuk didownload.

### Opsi B: Local Build (Perlu Android Studio + JDK 17)

1. Generate native project:
```bash
cd artifacts/mobile
npx expo prebuild --platform android
```

2. Build APK:
```bash
cd artifacts/mobile/android
./gradlew assembleRelease
```

APK tersedia di: `artifacts/mobile/android/app/build/outputs/apk/release/`

---

## Deploy API Server

Server perlu di-deploy agar APK bisa terhubung ke Google Drive. Pilihan hosting:

- **Railway** — `railway up` (gratis tier tersedia)
- **Render** — connect ke GitHub repo
- **VPS** — copy folder `artifacts/api-server/`, jalankan `pnpm install && pnpm run build && pnpm run start`

Set environment variables di platform hosting sesuai bagian "Setup Environment Variables" di atas.

---

## Konfigurasi Google Drive (Service Account)

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru → aktifkan **Google Drive API**
3. Buat **Service Account** → download file JSON credentials
4. Isi `GOOGLE_SERVICE_ACCOUNT_JSON` dengan seluruh isi file JSON tersebut
5. Share folder Google Drive ke email service account (format: `xxx@xxx.iam.gserviceaccount.com`) dengan akses **Viewer**
6. Copy ID folder dari URL Drive ke `GOOGLE_DRIVE_FOLDER_ID`

---

## Regenerate API Hooks (opsional)

Jika kamu mengubah `lib/api-spec/openapi.yaml`:
```bash
pnpm --filter @workspace/api-spec run codegen
```
