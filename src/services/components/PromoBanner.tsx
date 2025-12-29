// /components/PromoBanner.tsx
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { TOKENS } from "@/core/design-system/tokens";

export function PromoBanner() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Bosko Pro</Text>
      <Text style={styles.desc}>
        Más visibilidad, más trabajos. Activalo hoy.
      </Text>
      <TouchableOpacity style={styles.btn}>
        <Text style={{ color: "#fff", fontWeight: "700" }}>Suscribirme</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 16,
    backgroundColor: TOKENS.color.primary,
    ...TOKENS.shadow.soft,
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "800" },
  desc: { color: "#FFE7EE", marginVertical: 6 },
  btn: {
    marginTop: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
});
