import { Router } from "express";
import { mergePdfFiles, getDownloadBuffer, cleanExpiredTokens } from "../lib/pdfService";

const router = Router();

setInterval(cleanExpiredTokens, 5 * 60 * 1000);

router.post("/pdf/merge", async (req, res) => {
  try {
    const { fileIds, outputName } = req.body as { fileIds: string[]; outputName: string };

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      res.status(400).json({ success: false, error: "fileIds is required and must be a non-empty array" });
      return;
    }
    if (!outputName || typeof outputName !== "string") {
      res.status(400).json({ success: false, error: "outputName is required" });
      return;
    }

    const result = await mergePdfFiles(fileIds, outputName, req.log);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to merge PDFs");
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

router.get("/pdf/download/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const entry = getDownloadBuffer(token);

    if (!entry) {
      res.status(404).json({ error: "Token not found or expired" });
      return;
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(entry.fileName)}.pdf"`);
    res.setHeader("Content-Length", entry.buffer.length.toString());
    res.send(entry.buffer);
  } catch (err) {
    req.log.error({ err }, "Failed to download merged PDF");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
