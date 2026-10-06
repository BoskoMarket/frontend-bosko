import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { PremiumButton } from "@/components/PremiumButton";
import { PREMIUM_SHADOWS, TOKENS, withAlpha } from "@/core/design-system";

export function PromoBanner() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Bosko Pro</Text>
      <Text style={styles.desc}>
        Más visibilidad, más trabajos. Activalo hoy.
      </Text>
      <PremiumButton
        title="Suscribirme"
        variant="outline"
        onPress={() => {}}
        size="small"
        style={{
          alignSelf: "flex-start",
          marginTop: 12,
          borderColor: withAlpha(TOKENS.color.onPrimary, 0.4),
        }}
        textStyle={{ color: TOKENS.color.onPrimary }}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 16,
    backgroundColor: TOKENS.color.primary,
    ...PREMIUM_SHADOWS.global,
  },
  title: { color: TOKENS.color.onPrimary, fontSize: 18, fontWeight: "800" },
  desc: { color: withAlpha(TOKENS.color.onPrimary, 0.85), marginVertical: 6 },
});
