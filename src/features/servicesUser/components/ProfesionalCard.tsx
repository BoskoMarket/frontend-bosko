// /components/ProfessionalCard.tsx
import { useMemo } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { PREMIUM_SHADOWS, TOKENS, useThemeColors } from "@/core/design-system";
import type { ThemeColors } from "@/core/design-system";
import { FONT_FAMILY } from '@/core/design-system';

export function ProfessionalCard({
  item,
}: {
  item: {
    id: string;
    name: string;
    role: string;
    rating: number;
    avatar: string;
  };
}) {
  const tc = useThemeColors();
  const styles = useMemo(() => createStyles(tc), [tc]);
  return (
    <View style={styles.card}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.role}>
          {item.role} • ★ {item.rating}
        </Text>
        <TouchableOpacity style={styles.cta}>
          <Text style={styles.ctaText}>Reservar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const createStyles = (tc: ThemeColors) => StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: tc.surface,
    borderRadius: 18,
    padding: 12,
    marginHorizontal: 16,
    ...PREMIUM_SHADOWS.global,
  },
  avatar: { width: 56, height: 56, borderRadius: 12 },
  name: { fontFamily: FONT_FAMILY.display, color: tc.text },
  role: { color: tc.textSub, marginVertical: 4 },
  cta: {
    alignSelf: "flex-start",
    backgroundColor: TOKENS.color.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  ctaText: { color: TOKENS.color.onPrimary, fontFamily: FONT_FAMILY.heading },
});
