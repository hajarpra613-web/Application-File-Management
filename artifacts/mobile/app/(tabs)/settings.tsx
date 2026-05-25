import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : 0;

  const styles = makeStyles(colors);

  return (
    <ScrollView
      style={[styles.container, { paddingTop: topPad }]}
      contentContainerStyle={{ paddingBottom: bottomPad + 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerPad}>
        <Text style={styles.headerTitle}>Pengaturan</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Koneksi Google Drive</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: "#e8f0fe" }]}>
              <Feather name="hard-drive" size={18} color="#1a56db" />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Service Account</Text>
              <Text style={styles.rowSub}>
                Set GOOGLE_SERVICE_ACCOUNT_JSON di environment
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: "#e8f0fe" }]}>
              <Feather name="folder" size={18} color="#1a56db" />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Folder Drive</Text>
              <Text style={styles.rowSub}>
                Set GOOGLE_DRIVE_FOLDER_ID di environment
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Panduan Setup</Text>
        <View style={styles.card}>
          {STEPS.map((step, i) => (
            <React.Fragment key={i}>
              <View style={styles.stepRow}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
              {i < STEPS.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Tautan Berguna</Text>
        <View style={styles.card}>
          {LINKS.map((link, i) => (
            <React.Fragment key={i}>
              <TouchableOpacity
                style={styles.linkRow}
                onPress={() => Linking.openURL(link.url)}
              >
                <Feather name="external-link" size={16} color={colors.primary} />
                <Text style={styles.linkText}>{link.label}</Text>
              </TouchableOpacity>
              {i < LINKS.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Tentang</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: colors.accent }]}>
              <Feather name="info" size={18} color={colors.primary} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Manajemen Berkas Lamaran</Text>
              <Text style={styles.rowSub}>Versi 1.0.0</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const STEPS = [
  "Buka console.cloud.google.com dan buat project",
  "Aktifkan Google Drive API di APIs & Services",
  "Buat Service Account, unduh JSON key",
  "Share folder Google Drive ke email service account",
  "Set GOOGLE_SERVICE_ACCOUNT_JSON (isi JSON key) di Secrets",
  "Set GOOGLE_DRIVE_FOLDER_ID (ID folder Drive) di Secrets",
];

const LINKS = [
  { label: "Google Cloud Console", url: "https://console.cloud.google.com" },
  { label: "Google Drive API", url: "https://console.cloud.google.com/apis/library/drive.googleapis.com" },
];

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    headerPad: { paddingHorizontal: 20, paddingBottom: 12 },
    headerTitle: {
      fontSize: 26,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
    },
    section: { marginHorizontal: 20, marginBottom: 24 },
    sectionLabel: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_500Medium",
      textTransform: "uppercase" as const,
      letterSpacing: 0.8,
      marginBottom: 8,
      marginLeft: 4,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      gap: 12,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    rowContent: { flex: 1 },
    rowTitle: {
      fontSize: 15,
      fontWeight: "600" as const,
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
    },
    rowSub: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      marginTop: 2,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: 14,
    },
    stepRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      padding: 14,
      gap: 12,
    },
    stepNum: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 1,
    },
    stepNumText: {
      fontSize: 12,
      color: colors.primaryForeground,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
    },
    stepText: {
      flex: 1,
      fontSize: 14,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
      lineHeight: 20,
    },
    linkRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 14,
    },
    linkText: {
      fontSize: 14,
      color: colors.primary,
      fontFamily: "Inter_400Regular",
    },
  });
}
