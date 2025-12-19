import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { TOKENS } from "@/theme/tokens";
import { PremiumButton } from "@/src/components/PremiumButton";
import Colors from "@/constants/Colors";

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
        onPress={() => { }}
        size="small"
        style={{ alignSelf: 'flex-start', marginTop: 12, borderColor: 'rgba(255,255,255,0.4)' }}
        textStyle={{ color: '#fff' }}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 16,
    backgroundColor: Colors.colorPrimary,
    ...Colors.premium.shadows.global,
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "800" },
  desc: { color: "#FFE7EE", marginVertical: 6 },

});
