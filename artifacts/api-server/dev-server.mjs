import express from "express";

const app = express();
app.use(express.json());

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

function demoFiles() {
  const now = new Date().toISOString();
  return {
    files: [
      { id: "demo-1", name: "Contoh Surat Lamaran.pdf", mimeType: "application/pdf", size: 102400, modifiedTime: now },
      { id: "demo-2", name: "CV.pdf", mimeType: "application/pdf", size: 204800, modifiedTime: now },
    ],
    total: 2,
    configured: false,
    message: "Demo mode: Google Drive belum dikonfigurasi atau server dev."
  };
}

app.get('/api/drive/files', (req, res) => {
  try {
    res.json(demoFiles());
  } catch (err) {
    res.status(500).json({ files: [], total: 0, configured: false, message: 'Internal error' });
  }
});

app.post('/api/drive/sync', (req, res) => {
  res.json({ success: true, added: 0, message: 'Demo sync: no-op' });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Dev server listening on http://0.0.0.0:${PORT}`);
});
