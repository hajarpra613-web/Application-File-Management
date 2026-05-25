import React, { createContext, useContext, useState, useCallback } from "react";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  modifiedTime: string;
}

interface SelectedFilesContextValue {
  selectedIds: Set<string>;
  selectedFiles: DriveFile[];
  toggleFile: (id: string, file?: DriveFile) => void;
  removeFile: (id: string) => void;
  clearSelection: () => void;
}

const SelectedFilesContext = createContext<SelectedFilesContextValue | null>(null);

export function SelectedFilesProvider({ children }: { children: React.ReactNode }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedFiles, setSelectedFiles] = useState<DriveFile[]>([]);

  const toggleFile = useCallback((id: string, file?: DriveFile) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setSelectedFiles((f) => f.filter((x) => x.id !== id));
      } else {
        next.add(id);
        if (file) {
          setSelectedFiles((f) => [...f, file]);
        }
      }
      return next;
    });
  }, []);

  const removeFile = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setSelectedFiles((f) => f.filter((x) => x.id !== id));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectedFiles([]);
  }, []);

  return (
    <SelectedFilesContext.Provider
      value={{ selectedIds, selectedFiles, toggleFile, removeFile, clearSelection }}
    >
      {children}
    </SelectedFilesContext.Provider>
  );
}

export function useSelectedFiles() {
  const ctx = useContext(SelectedFilesContext);
  if (!ctx) throw new Error("useSelectedFiles must be used inside SelectedFilesProvider");
  return ctx;
}
