import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  TextInput,
  Animated,
} from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useSelectedFiles } from "@/context/SelectedFilesContext";
import { FileCard } from "@/components/FileCard";
import { getApiUrl } from "@/lib/api";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  modifiedTime: string;
  webViewLink?: string;
}

interface DriveFilesResponse {
  files: DriveFile[];
  total: number;
  configured: boolean;
  message?: string;
}

async function fetchFiles(): Promise<DriveFilesResponse> {
  const res = await fetch(getApiUrl("/api/drive/files"));
  if (!res.ok) throw new Error("Failed to fetch files");
  return res.json();
}

export default function FilesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { selectedIds, toggleFile, clearSelection } = useSelectedFiles();
  const [search, setSearch] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const spinLoop = useRef<Animated.CompositeAnimation | null>(null);

  const startSpin = useCallback(() => {
    spinAnim.setValue(0);
    spinLoop.current = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: Platform.OS !== "web",
      })
    );
    spinLoop.current.start();
  }, [spinAnim]);

  const stopSpin = useCallback(() => {
    spinLoop.current?.stop();
    spinAnim.setValue(0);
  }, [spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const { data, isLoading, isError, refetch, isFetching } = useQuery<DriveFilesResponse>({
    queryKey: ["drive-files"],
    queryFn: fetchFiles,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (data) setLastUpdated(new Date());
  }, [data]);

  const handleRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    startSpin();
    await fetch(getApiUrl("/api/drive/sync"), { method: "POST" });
    await queryClient.invalidateQueries({ queryKey: ["drive-files"] });
    stopSpin();
    setLastUpdated(new Date());
  }, [queryClient, startSpin, stopSpin]);

  const formatLastUpdated = (date: Date | null) => {
    if (!date) return null;
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "baru saja";
    if (diffMin === 1) return "1 menit lalu";
    return `${diffMin} menit lalu`;
  };

  const filteredFiles = (data?.files ?? []).filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const styles = makeStyles(colors, insets);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : 0;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Berkas Lamaran</Text>
          <Text style={styles.headerSub}>
            {data?.configured === false
              ? "Mode Demo"
              : `${data?.total ?? 0} file`}
            {lastUpdated ? `  ·  ${formatLastUpdated(lastUpdated)}` : ""}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.refreshBtn, isFetching && styles.refreshBtnActive]}
          onPress={handleRefresh}
          disabled={isFetching}
          activeOpacity={0.75}
        >
          <Animated.View style={{ transform: [{ rotate: isFetching ? spin : "0deg" }] }}>
            <Feather name="refresh-cw" size={17} color={isFetching ? colors.primaryForeground : colors.primary} />
          </Animated.View>
          <Text style={[styles.refreshBtnText, isFetching && styles.refreshBtnTextActive]}>
            {isFetching ? "Memuat..." : "Refresh"}
          </Text>
        </TouchableOpacity>
      </View>

      {data?.configured === false && data?.message && (
        <View style={styles.demoBanner}>
          <Feather name="info" size={14} color={colors.warning} />
          <Text style={styles.demoBannerText} numberOfLines={2}>
            {data.message}
          </Text>
        </View>
      )}

      <View style={styles.searchRow}>
        <Feather name="search" size={16} color={colors.mutedForeground} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari file..."
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {selectedIds.size > 0 && (
        <View style={styles.selectionBar}>
          <Text style={styles.selectionText}>{selectedIds.size} dipilih</Text>
          <TouchableOpacity onPress={clearSelection}>
            <Text style={styles.clearText}>Batalkan</Text>
          </TouchableOpacity>
        </View>
      )}

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Memuat file...</Text>
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Feather name="wifi-off" size={48} color={colors.mutedForeground} />
          <Text style={styles.emptyTitle}>Gagal memuat</Text>
          <Text style={styles.emptyText}>Periksa koneksi dan coba lagi</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : filteredFiles.length === 0 ? (
        <View style={styles.center}>
          <Feather name="folder" size={48} color={colors.mutedForeground} />
          <Text style={styles.emptyTitle}>Tidak ada file</Text>
          <Text style={styles.emptyText}>
            {search ? "Tidak ada file yang cocok" : "Folder Google Drive kosong"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredFiles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 100 }]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={filteredFiles.length > 0}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <FileCard
              file={item}
              selected={selectedIds.has(item.id)}
              onPress={() => {
                Haptics.selectionAsync();
                toggleFile(item.id, item);
              }}
            />
          )}
        />
      )}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, insets: ReturnType<typeof useSafeAreaInsets>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    headerTitle: {
      fontSize: 26,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
    },
    headerSub: {
      fontSize: 13,
      color: colors.mutedForeground,
      marginTop: 2,
      fontFamily: "Inter_400Regular",
    },
    refreshBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 20,
      backgroundColor: colors.accent,
      borderWidth: 1.5,
      borderColor: colors.selectedBorder,
    },
    refreshBtnActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    refreshBtnText: {
      fontSize: 14,
      fontWeight: "600" as const,
      color: colors.primary,
      fontFamily: "Inter_600SemiBold",
    },
    refreshBtnTextActive: {
      color: colors.primaryForeground,
    },
    demoBanner: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      marginHorizontal: 20,
      marginBottom: 12,
      backgroundColor: "#fff8e1",
      borderRadius: 8,
      padding: 10,
      borderLeftWidth: 3,
      borderLeftColor: colors.warning,
    },
    demoBannerText: {
      flex: 1,
      fontSize: 12,
      color: colors.warning,
      fontFamily: "Inter_400Regular",
    },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 20,
      marginBottom: 12,
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: colors.border,
      height: 44,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
    },
    selectionBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginHorizontal: 20,
      marginBottom: 8,
      backgroundColor: colors.selected,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.selectedBorder,
    },
    selectionText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: "600" as const,
      fontFamily: "Inter_600SemiBold",
    },
    clearText: {
      fontSize: 14,
      color: colors.primary,
      fontFamily: "Inter_400Regular",
    },
    list: {
      paddingHorizontal: 20,
      gap: 8,
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      paddingHorizontal: 40,
    },
    loadingText: {
      fontSize: 15,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "600" as const,
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
    },
    emptyText: {
      fontSize: 14,
      color: colors.mutedForeground,
      textAlign: "center",
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
  });
}
