// /components/NavBar.tsx
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { TOKENS } from "@/src/shared/theme/tokens";

export function NavBar() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.brand}>Bosko</Text>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <TouchableOpacity>
          <Text>🔍</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text>🔔</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: TOKENS.color.bg,
  },
  brand: { fontSize: 22, fontWeight: "800", color: TOKENS.color.text },
});
