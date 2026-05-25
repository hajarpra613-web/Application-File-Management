import { google } from "googleapis";

const FOLDER_ID = process.env["GOOGLE_DRIVE_FOLDER_ID"] ?? "";
const SERVICE_ACCOUNT_JSON = process.env["GOOGLE_SERVICE_ACCOUNT_JSON"] ?? "";

function getAuth() {
  if (!SERVICE_ACCOUNT_JSON) return null;
  try {
    const credentials = JSON.parse(SERVICE_ACCOUNT_JSON);
    return new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });
  } catch {
    return null;
  }
}

export async function getDriveFiles() {
  const auth = getAuth();

  if (!auth || !FOLDER_ID) {
    return {
      files: getDemoFiles(),
      total: getDemoFiles().length,
      configured: false,
      message: "Google Drive not configured. Showing demo files. Set GOOGLE_SERVICE_ACCOUNT_JSON and GOOGLE_DRIVE_FOLDER_ID to connect.",
    };
  }

  const drive = google.drive({ version: "v3", auth });
  const response = await drive.files.list({
    q: `'${FOLDER_ID}' in parents and trashed = false`,
    fields: "files(id, name, mimeType, size, modifiedTime, webViewLink, iconLink)",
    orderBy: "modifiedTime desc",
    pageSize: 100,
  });

  const files = (response.data.files ?? []).map((f) => ({
    id: f.id ?? "",
    name: f.name ?? "Unnamed",
    mimeType: f.mimeType ?? "application/octet-stream",
    size: f.size ? Number(f.size) : 0,
    modifiedTime: f.modifiedTime ?? new Date().toISOString(),
    webViewLink: f.webViewLink ?? undefined,
    iconLink: f.iconLink ?? undefined,
  }));

  return { files, total: files.length, configured: true };
}

export async function syncDriveFiles() {
  const auth = getAuth();

  if (!auth || !FOLDER_ID) {
    return { success: false, added: 0, message: "Google Drive not configured" };
  }

  const drive = google.drive({ version: "v3", auth });
  const response = await drive.files.list({
    q: `'${FOLDER_ID}' in parents and trashed = false`,
    fields: "files(id, name)",
    pageSize: 100,
  });

  const count = response.data.files?.length ?? 0;
  return { success: true, added: count, message: `Synced ${count} files from Google Drive` };
}

export async function downloadFileBuffer(fileId: string): Promise<Buffer> {
  const auth = getAuth();

  if (!auth) {
    throw new Error("Google Drive not configured");
  }

  const drive = google.drive({ version: "v3", auth });

  const meta = await drive.files.get({ fileId, fields: "mimeType, name" });
  const mimeType = meta.data.mimeType ?? "";

  if (mimeType === "application/pdf") {
    const response = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "arraybuffer" }
    );
    return Buffer.from(response.data as ArrayBuffer);
  }

  if (
    mimeType === "application/vnd.google-apps.document" ||
    mimeType === "application/vnd.google-apps.presentation" ||
    mimeType === "application/vnd.google-apps.spreadsheet"
  ) {
    const response = await drive.files.export(
      { fileId, mimeType: "application/pdf" },
      { responseType: "arraybuffer" }
    );
    return Buffer.from(response.data as ArrayBuffer);
  }

  const response = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "arraybuffer" }
  );
  return Buffer.from(response.data as ArrayBuffer);
}

function getDemoFiles() {
  return [
    {
      id: "demo-1",
      name: "CV_Ahmad_Fauzi.pdf",
      mimeType: "application/pdf",
      size: 245760,
      modifiedTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      webViewLink: undefined,
      iconLink: undefined,
    },
    {
      id: "demo-2",
      name: "Surat_Lamaran_PT_Maju.pdf",
      mimeType: "application/pdf",
      size: 102400,
      modifiedTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      webViewLink: undefined,
      iconLink: undefined,
    },
    {
      id: "demo-3",
      name: "Ijazah_S1_Teknik_Informatika.pdf",
      mimeType: "application/pdf",
      size: 512000,
      modifiedTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      webViewLink: undefined,
      iconLink: undefined,
    },
    {
      id: "demo-4",
      name: "Sertifikat_React_Developer.pdf",
      mimeType: "application/pdf",
      size: 178432,
      modifiedTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      webViewLink: undefined,
      iconLink: undefined,
    },
    {
      id: "demo-5",
      name: "Portofolio_2024.pdf",
      mimeType: "application/pdf",
      size: 1048576,
      modifiedTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      webViewLink: undefined,
      iconLink: undefined,
    },
    {
      id: "demo-6",
      name: "Transkrip_Nilai.pdf",
      mimeType: "application/pdf",
      size: 320000,
      modifiedTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      webViewLink: undefined,
      iconLink: undefined,
    },
  ];
}
