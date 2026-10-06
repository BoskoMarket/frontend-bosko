import React from "react";
import { FlatList, View, StyleSheet, Dimensions } from "react-native";
import { SPACING, Text, TOKENS, useThemeColors } from "@/core/design-system";
import { PremiumButton } from "@/components/PremiumButton";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

export function HeroCarousel({
  data,
}: {
  data: { title: string; subtitle: string; cta: string }[];
}) {
  const tc = useThemeColors();
  return (
    <FlatList
      data={data}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      keyExtractor={(_, i) => String(i)}
      renderItem={({ item }) => (
        <View style={styles.cardShadow}>
          <View style={styles.card}>
            <Text variant="h3" style={styles.title}>{item.title}</Text>
            <Text color={tc.textSub} style={styles.sub}>{item.subtitle}</Text>
            <PremiumButton
              title="Explorar"
              onPress={() => router.push("/(tabs)/services")}
            />
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  cardShadow: {
    width: width - SPACING.xxxl,
    marginHorizontal: SPACING.lg,
    height: 200,
    borderRadius: TOKENS.radius.lg,
    ...TOKENS.shadow.soft,
  },
  card: {
    flex: 1,
    borderRadius: TOKENS.radius.lg,
    overflow: "hidden",
    padding: SPACING.lg,
    backgroundColor: "transparent",
  },
  title: { fontSize: 22, fontWeight: "800" },
  sub: { marginTop: SPACING.xs + 2 },
});
