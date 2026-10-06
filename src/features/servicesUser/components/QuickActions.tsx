import { View, StyleSheet } from "react-native";
import { SPACING } from "@/core/design-system";
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
  row: { flexDirection: "row", gap: SPACING.md, paddingHorizontal: SPACING.lg },
});
