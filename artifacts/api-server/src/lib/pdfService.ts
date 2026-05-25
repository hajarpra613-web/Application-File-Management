import { PDFDocument } from "pdf-lib";
import { downloadFileBuffer } from "./driveService";
import type { Logger } from "pino";

interface DownloadEntry {
  buffer: Buffer;
  fileName: string;
  expiresAt: number;
}

const downloadStore = new Map<string, DownloadEntry>();

function generateToken(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

export function getDownloadBuffer(token: string): DownloadEntry | null {
  const entry = downloadStore.get(token);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    downloadStore.delete(token);
    return null;
  }
  return entry;
}

export function cleanExpiredTokens() {
  const now = Date.now();
  for (const [token, entry] of downloadStore.entries()) {
    if (now > entry.expiresAt) {
      downloadStore.delete(token);
    }
  }
}

export async function mergePdfFiles(
  fileIds: string[],
  outputName: string,
  log: Logger
): Promise<{ success: boolean; token?: string; fileName?: string; pageCount?: number; error?: string }> {
  const mergedPdf = await PDFDocument.create();

  const isDemoMode = fileIds.every((id) => id.startsWith("demo-"));

  if (isDemoMode) {
    for (let i = 0; i < fileIds.length; i++) {
      const page = mergedPdf.addPage([595.28, 841.89]);
      const { rgb } = await import("pdf-lib");
      page.drawRectangle({
        x: 0,
        y: 0,
        width: 595.28,
        height: 841.89,
        color: rgb(0.98, 0.98, 0.98),
      });
      page.drawText(`Demo Page ${i + 1}`, {
        x: 200,
        y: 500,
        size: 24,
        color: rgb(0.2, 0.4, 0.7),
      });
      page.drawText(`File: ${fileIds[i]}`, {
        x: 150,
        y: 460,
        size: 14,
        color: rgb(0.4, 0.4, 0.4),
      });
      page.drawText(`Merged: ${outputName}.pdf`, {
        x: 150,
        y: 430,
        size: 14,
        color: rgb(0.4, 0.4, 0.4),
      });
    }
  } else {
    for (const fileId of fileIds) {
      try {
        const buf = await downloadFileBuffer(fileId);
        const srcDoc = await PDFDocument.load(buf, { ignoreEncryption: true });
        const pages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
        pages.forEach((p) => mergedPdf.addPage(p));
      } catch (err) {
        log.warn({ err, fileId }, "Failed to include file in merge, skipping");
      }
    }
  }

  const totalPages = mergedPdf.getPageCount();

  if (totalPages === 0) {
    return { success: false, error: "No pages could be merged. Check that files are valid PDFs." };
  }

  const pdfBytes = await mergedPdf.save();
  const buffer = Buffer.from(pdfBytes);

  const token = generateToken();
  downloadStore.set(token, {
    buffer,
    fileName: outputName,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  return {
    success: true,
    token,
    fileName: outputName,
    pageCount: totalPages,
  };
}
