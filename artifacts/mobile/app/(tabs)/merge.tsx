import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as LegacyFS from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelectedFiles } from "@/context/SelectedFilesContext";
import { useColors } from "@/hooks/useColors";
import { getApiUrl } from "@/lib/api";
import { FileChip } from "@/components/FileChip";

type MergeState = "idle" | "merging" | "done" | "error";

export default function MergeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { selectedIds, selectedFiles, removeFile, clearSelection } = useSelectedFiles();

  const [mergeState, setMergeState] = useState<MergeState>("idle");
  const [renameModal, setRenameModal] = useState(false);
  const [fileName, setFileName] = useState("Dokumen_Gabungan");
  const [downloadToken, setDownloadToken] = useState<string | null>(null);
  const [mergedFileName, setMergedFileName] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [savedPath, setSavedPath] = useState<string | null>(null);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : 0;

  const handleMerge = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setRenameModal(true);
  }, [selectedIds]);

  const handleConfirmMerge = useCallback(async () => {
    setRenameModal(false);
    setMergeState("merging");
    setErrorMsg("");

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await fetch(getApiUrl("/api/pdf/merge"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileIds: Array.from(selectedIds),
          outputName: fileName.trim() || "Dokumen_Gabungan",
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Gagal menggabungkan file");
      }

      setDownloadToken(json.token);
      setMergedFileName(json.fileName ?? fileName);
      setPageCount(json.pageCount ?? 0);
      setMergeState("done");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      setErrorMsg(msg);
      setMergeState("error");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [selectedIds, fileName]);

  // ── helpers ────────────────────────────────────────────────────────────────

  const downloadToCache = useCallback(async (url: string, safeFileName: string): Promise<string> => {
    const cacheDir = LegacyFS.cacheDirectory ?? "";
    const destUri = cacheDir + safeFileName;
    // Delete stale file if exists
    const info = await LegacyFS.getInfoAsync(destUri);
    if (info.exists) await LegacyFS.deleteAsync(destUri, { idempotent: true });
    const result = await LegacyFS.downloadAsync(url, destUri);
    return result.uri;
  }, []);

  const writeToSafDir = useCallback(async (
    localUri: string,
    safDirUri: string,
    safeFileName: string,
  ): Promise<string> => {
    const base64 = await LegacyFS.readAsStringAsync(localUri, {
      encoding: LegacyFS.EncodingType.Base64,
    });
    const destUri = await LegacyFS.StorageAccessFramework.createFileAsync(
      safDirUri,
      safeFileName,
      "application/pdf",
    );
    await LegacyFS.writeAsStringAsync(destUri, base64, {
      encoding: LegacyFS.EncodingType.Base64,
    });
    return destUri;
  }, []);

  // ── save options ───────────────────────────────────────────────────────────

  const handleDownload = useCallback(() => {
    if (!downloadToken || downloading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Web: browser download langsung
    if (Platform.OS === "web") {
      const url = getApiUrl(`/api/pdf/download/${downloadToken}`);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${mergedFileName || "Dokumen_Gabungan"}.pdf`;
      a.click();
      return;
    }

    // iOS: hanya ada satu opsi (share sheet)
    if (Platform.OS === "ios") {
      saveViaSharing();
      return;
    }

    // Android: 2 opsi
    Alert.alert(
      "Simpan PDF",
      "Pilih lokasi penyimpanan:",
      [
        { text: "📥 Folder Downloads", onPress: () => saveToDownloads() },
        { text: "📁 Pilih Folder Lain...", onPress: () => saveToCustomFolder() },
        { text: "Batal", style: "cancel" },
      ],
      { cancelable: true }
    );
  }, [downloadToken, mergedFileName, downloading]);

  const saveViaSharing = useCallback(async () => {
    if (!downloadToken) return;
    const url = getApiUrl(`/api/pdf/download/${downloadToken}`);
    const safeFileName = `${mergedFileName || "Dokumen_Gabungan"}.pdf`;
    setDownloading(true);
    try {
      const localUri = await downloadToCache(url, safeFileName);
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert("Tidak Tersedia", "Fitur berbagi tidak tersedia di perangkat ini.");
        return;
      }
      await Sharing.shareAsync(localUri, {
        mimeType: "application/pdf",
        UTI: "com.adobe.pdf",
        dialogTitle: `Simpan ${safeFileName}`,
      });
      setSavedPath(localUri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      Alert.alert("Gagal Menyimpan", err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setDownloading(false);
    }
  }, [downloadToken, mergedFileName, downloadToCache]);

  const saveToDownloads = useCallback(async () => {
    if (!downloadToken) return;
    const url = getApiUrl(`/api/pdf/download/${downloadToken}`);
    const safeFileName = `${mergedFileName || "Dokumen_Gabungan"}.pdf`;
    setDownloading(true);
    try {
      // Pre-point picker at the Downloads root so user just taps "Use this folder"
      const downloadsHintUri = LegacyFS.StorageAccessFramework.getUriForDirectoryInRoot("Download");
      const perms = await LegacyFS.StorageAccessFramework.requestDirectoryPermissionsAsync(downloadsHintUri);
      if (!perms.granted) {
        setDownloading(false);
        return;
      }
      const localUri = await downloadToCache(url, safeFileName);
      const destUri = await writeToSafDir(localUri, perms.directoryUri, safeFileName);
      setSavedPath(destUri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Tersimpan di Downloads!", `"${safeFileName}" berhasil disimpan.`);
    } catch (err) {
      Alert.alert("Gagal Menyimpan", err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setDownloading(false);
    }
  }, [downloadToken, mergedFileName, downloadToCache, writeToSafDir]);

  const saveToCustomFolder = useCallback(async () => {
    if (!downloadToken) return;
    const url = getApiUrl(`/api/pdf/download/${downloadToken}`);
    const safeFileName = `${mergedFileName || "Dokumen_Gabungan"}.pdf`;
    setDownloading(true);
    try {
      // Buka folder picker — semua folder bisa dipilih
      const perms = await LegacyFS.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!perms.granted) {
        setDownloading(false);
        return;
      }
      const localUri = await downloadToCache(url, safeFileName);
      const destUri = await writeToSafDir(localUri, perms.directoryUri, safeFileName);
      setSavedPath(destUri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Berhasil Disimpan!", `"${safeFileName}" tersimpan di folder yang kamu pilih.`);
    } catch (err) {
      Alert.alert("Gagal Menyimpan", err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setDownloading(false);
    }
  }, [downloadToken, mergedFileName, downloadToCache, writeToSafDir]);

  const handleReset = useCallback(() => {
    setMergeState("idle");
    setDownloadToken(null);
    setSavedPath(null);
    clearSelection();
    setFileName("Dokumen_Gabungan");
  }, [clearSelection]);

  const styles = makeStyles(colors, insets);

  const renderContent = () => {
    if (mergeState === "merging") {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.mergingTitle}>Menggabungkan file...</Text>
          <Text style={styles.mergingSub}>Mohon tunggu</Text>
        </View>
      );
    }

    if (mergeState === "done") {
      return (
        <View style={styles.center}>
          <View style={styles.successIcon}>
            <Feather name="check-circle" size={56} color={colors.success} />
          </View>
          <Text style={styles.doneTitle}>Berhasil Digabungkan</Text>
          <Text style={styles.doneSub}>{pageCount} halaman</Text>
          <View style={styles.doneCard}>
            <Feather name="file-text" size={20} color={colors.primary} />
            <Text style={styles.doneFileName} numberOfLines={1}>
              {mergedFileName}.pdf
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.downloadBtn, downloading && styles.downloadBtnDisabled]}
            onPress={handleDownload}
            disabled={downloading}
            activeOpacity={0.8}
          >
            {downloading ? (
              <>
                <ActivityIndicator size="small" color={colors.primaryForeground} />
                <Text style={styles.downloadBtnText}>Mengunduh...</Text>
              </>
            ) : savedPath ? (
              <>
                <Feather name="check" size={18} color={colors.primaryForeground} />
                <Text style={styles.downloadBtnText}>
                  {Platform.OS === "ios" ? "Bagikan Lagi" : "Simpan Lagi"}
                </Text>
              </>
            ) : (
              <>
                <Feather
                  name={Platform.OS === "android" ? "folder" : "download"}
                  size={18}
                  color={colors.primaryForeground}
                />
                <Text style={styles.downloadBtnText}>
                  {Platform.OS === "android"
                    ? "Pilih Folder & Simpan"
                    : Platform.OS === "ios"
                    ? "Simpan / Bagikan..."
                    : "Unduh PDF"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {savedPath && Platform.OS === "android" && (
            <View style={styles.savedBanner}>
              <Feather name="check-circle" size={14} color={colors.success} />
              <Text style={styles.savedBannerText} numberOfLines={2}>
                Tersimpan di folder yang kamu pilih
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Text style={styles.resetBtnText}>Selesai</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (mergeState === "error") {
      return (
        <View style={styles.center}>
          <Feather name="alert-circle" size={48} color={colors.destructive} />
          <Text style={styles.errorTitle}>Gagal Menggabungkan</Text>
          <Text style={styles.errorMsg}>{errorMsg}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => setMergeState("idle")}>
            <Text style={styles.retryText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <>
        {selectedIds.size === 0 ? (
          <View style={styles.center}>
            <Feather name="layers" size={56} color={colors.mutedForeground} />
            <Text style={styles.emptyTitle}>Belum ada file dipilih</Text>
            <Text style={styles.emptyText}>
              Pilih file dari tab Berkas, lalu gabungkan di sini
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            <Text style={styles.sectionLabel}>
              {selectedIds.size} file dipilih
            </Text>
            <FlatList
              data={selectedFiles}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ gap: 8, paddingBottom: bottomPad + 140 }}
              showsVerticalScrollIndicator={false}
              scrollEnabled={!!selectedFiles.length}
              renderItem={({ item }) => (
                <FileChip
                  name={item.name}
                  mimeType={item.mimeType}
                  size={item.size}
                  onRemove={() => {
                    Haptics.selectionAsync();
                    removeFile(item.id);
                  }}
                />
              )}
            />
          </View>
        )}
      </>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gabung PDF</Text>
        {selectedIds.size > 0 && mergeState === "idle" && (
          <TouchableOpacity onPress={clearSelection}>
            <Text style={styles.clearAll}>Hapus Semua</Text>
          </TouchableOpacity>
        )}
      </View>

      {renderContent()}

      {selectedIds.size > 0 && mergeState === "idle" && (
        <View style={[styles.mergeBar, { bottom: insets.bottom + (isWeb ? 34 : 16) }]}>
          <TouchableOpacity style={styles.mergeBtn} onPress={handleMerge}>
            <Feather name="git-merge" size={18} color={colors.primaryForeground} />
            <Text style={styles.mergeBtnText}>
              Gabungkan {selectedIds.size} File
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={renameModal}
        transparent
        animationType="slide"
        onRequestClose={() => setRenameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nama File Output</Text>
            <Text style={styles.modalSub}>Beri nama file PDF yang akan digabungkan</Text>
            <TextInput
              style={styles.renameInput}
              value={fileName}
              onChangeText={setFileName}
              placeholder="Nama file..."
              placeholderTextColor={colors.mutedForeground}
              autoFocus
              selectTextOnFocus
            />
            <Text style={styles.fileNamePreview}>{fileName || "Dokumen_Gabungan"}.pdf</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setRenameModal(false)}
              >
                <Text style={styles.modalCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirm}
                onPress={handleConfirmMerge}
              >
                <Text style={styles.modalConfirmText}>Gabungkan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, insets: ReturnType<typeof useSafeAreaInsets>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    headerTitle: {
      fontSize: 26,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
    },
    clearAll: {
      fontSize: 14,
      color: colors.destructive,
      fontFamily: "Inter_400Regular",
    },
    listContainer: { flex: 1, paddingHorizontal: 20 },
    sectionLabel: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_500Medium",
      marginBottom: 10,
      textTransform: "uppercase" as const,
      letterSpacing: 0.5,
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      paddingHorizontal: 40,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "600" as const,
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
      textAlign: "center" as const,
    },
    emptyText: {
      fontSize: 14,
      color: colors.mutedForeground,
      textAlign: "center" as const,
      fontFamily: "Inter_400Regular",
      lineHeight: 20,
    },
    mergingTitle: {
      fontSize: 20,
      fontWeight: "600" as const,
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
    },
    mergingSub: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    successIcon: { marginBottom: 8 },
    doneTitle: {
      fontSize: 22,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
    },
    doneSub: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    doneCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.accent,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginTop: 8,
      width: "100%",
    },
    doneFileName: {
      flex: 1,
      fontSize: 14,
      color: colors.primary,
      fontFamily: "Inter_500Medium",
    },
    downloadBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingHorizontal: 28,
      paddingVertical: 14,
      marginTop: 16,
      width: "100%",
      justifyContent: "center",
    },
    downloadBtnDisabled: {
      opacity: 0.65,
    },
    downloadBtnText: {
      fontSize: 16,
      color: colors.primaryForeground,
      fontWeight: "600" as const,
      fontFamily: "Inter_600SemiBold",
    },
    savedBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "#e8f5e9",
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginTop: 8,
      width: "100%",
      borderLeftWidth: 3,
      borderLeftColor: colors.success,
    },
    savedBannerText: {
      flex: 1,
      fontSize: 13,
      color: colors.success,
      fontFamily: "Inter_400Regular",
    },
    resetBtn: {
      paddingHorizontal: 28,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      width: "100%",
      alignItems: "center",
    },
    resetBtnText: {
      fontSize: 15,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    errorTitle: {
      fontSize: 20,
      fontWeight: "600" as const,
      color: colors.destructive,
      fontFamily: "Inter_600SemiBold",
    },
    errorMsg: {
      fontSize: 14,
      color: colors.mutedForeground,
      textAlign: "center" as const,
      fontFamily: "Inter_400Regular",
    },
    retryBtn: {
      marginTop: 8,
      paddingHorizontal: 24,
      paddingVertical: 12,
      backgroundColor: colors.primary,
      borderRadius: 10,
    },
    retryText: {
      color: colors.primaryForeground,
      fontWeight: "600" as const,
      fontFamily: "Inter_600SemiBold",
    },
    mergeBar: {
      position: "absolute",
      left: 20,
      right: 20,
    },
    mergeBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 16,
      // Shadow styling (using elevation for Android)
      elevation: 8,
      // iOS shadow props (kept for compatibility)
      shadowColor: colors.primary,
      shadowOpacity: 0.3,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 12,
    },
    mergeBtnText: {
      fontSize: 16,
      fontWeight: "700" as const,
      color: colors.primaryForeground,
      fontFamily: "Inter_700Bold",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 24,
      paddingBottom: Math.max(insets.bottom, 24),
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      marginBottom: 4,
    },
    modalSub: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      marginBottom: 20,
    },
    renameInput: {
      borderWidth: 1.5,
      borderColor: colors.primary,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
      backgroundColor: colors.background,
    },
    fileNamePreview: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      marginTop: 6,
      marginLeft: 4,
    },
    modalButtons: {
      flexDirection: "row",
      gap: 12,
      marginTop: 20,
    },
    modalCancel: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
    },
    modalCancelText: {
      fontSize: 15,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    modalConfirm: {
      flex: 2,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: "center",
    },
    modalConfirmText: {
      fontSize: 15,
      color: colors.primaryForeground,
      fontWeight: "600" as const,
      fontFamily: "Inter_600SemiBold",
    },
  });
}
