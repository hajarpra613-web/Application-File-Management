import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  modifiedTime: string;
}

interface FileCardProps {
  file: DriveFile;
  selected: boolean;
  onPress: () => void;
}

function formatSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function getFileIcon(mimeType: string): string {
  if (mimeType === "application/pdf") return "file-text";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.includes("document") || mimeType.includes("word")) return "file";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "grid";
  if (mimeType.includes("presentation")) return "monitor";
  return "file";
}

function getFileColor(mimeType: string): string {
  if (mimeType === "application/pdf") return "#e03131";
  if (mimeType.startsWith("image/")) return "#2f9e44";
  if (mimeType.includes("document")) return "#1a56db";
  if (mimeType.includes("sheet")) return "#2f9e44";
  if (mimeType.includes("presentation")) return "#e67700";
  return "#6b7a99";
}

export function FileCard({ file, selected, onPress }: FileCardProps) {
  const colors = useColors();
  const icon = getFileIcon(file.mimeType) as keyof typeof Feather.glyphMap;
  const iconColor = getFileColor(file.mimeType);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: selected ? colors.selected : colors.card,
          borderColor: selected ? colors.selectedBorder : colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconColor + "18" }]}>
        <Feather name={icon} size={22} color={iconColor} />
      </View>

      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
          {file.name}
        </Text>
        <View style={styles.meta}>
          {file.size ? (
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {formatSize(file.size)}
            </Text>
          ) : null}
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
            {formatDate(file.modifiedTime)}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.checkbox,
          {
            backgroundColor: selected ? colors.primary : "transparent",
            borderColor: selected ? colors.primary : colors.border,
          },
        ]}
      >
        {selected && <Feather name="check" size={14} color={colors.primaryForeground} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },
  meta: {
    flexDirection: "row",
    gap: 10,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});
