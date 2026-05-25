import { Router } from "express";
import { getDriveFiles, syncDriveFiles } from "../lib/driveService";

const router = Router();

router.get("/drive/files", async (req, res) => {
  try {
    const result = await getDriveFiles();
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to list drive files");
    res.status(500).json({ files: [], total: 0, configured: false, message: "Internal server error" });
  }
});

router.post("/drive/sync", async (req, res) => {
  try {
    const result = await syncDriveFiles();
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to sync drive files");
    res.status(500).json({ success: false, added: 0, message: "Internal server error" });
  }
});

export default router;
