import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { TOKENS } from "@/core/design-system/tokens";
import { PremiumButton } from "@/components/PremiumButton";

export function QuickActions({
  onPublish,
  onRequest,
}: {
  onPublish: () => void;
  onRequest: () => void;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <PremiumButton
          title="Publicar servicio"
          onPress={onPublish}
          variant="primary"
          style={{ width: "100%" }}
        />
      </View>
      <View style={{ flex: 1 }}>
        <PremiumButton
          title="Pedir servicio"
          onPress={onRequest}
          variant="secondary"
          style={{ width: "100%" }}
        />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 12, paddingHorizontal: 16 },
});
