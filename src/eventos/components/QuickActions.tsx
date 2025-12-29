// /components/QuickActions.tsx
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { TOKENS } from "@/src/shared/theme/tokens";

export function QuickActions({
  onPublish,
  onRequest,
}: {
  onPublish: () => void;
  onRequest: () => void;
}) {
  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[styles.cta, { backgroundColor: TOKENS.color.primary }]}
        onPress={onPublish}
      >
        <Text style={styles.txt}>Publicar servicio</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.cta,
          {
            backgroundColor: "#fff",
            borderColor: TOKENS.color.primary,
            borderWidth: 1,
          },
        ]}
        onPress={onRequest}
      >
        <Text style={[styles.txt, { color: TOKENS.color.primary }]}>
          Pedir servicio
        </Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 12, paddingHorizontal: 16 },
  cta: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    ...TOKENS.shadow.soft,
  },
  txt: { color: "#fff", fontWeight: "800" },
});
