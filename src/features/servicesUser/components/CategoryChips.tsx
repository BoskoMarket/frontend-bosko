// /components/CategoryChips.tsx
import {
  FlatList,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { TOKENS } from "@/core/design-system/tokens";

export function CategoryChips({
  items,
}: {
  items: { id: string; label: string; icon?: string }[];
}) {
  return (
    <FlatList
      horizontal
      data={items}
      keyExtractor={(i) => i.id}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.chip}>
          <Text style={{ color: TOKENS.color.primary, fontWeight: "700" }}>
            {item.label}
          </Text>
        </TouchableOpacity>
      )}
      showsHorizontalScrollIndicator={false}
    />
  );
}
const styles = StyleSheet.create({
  chip: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    ...TOKENS.shadow.soft,
  },
});
