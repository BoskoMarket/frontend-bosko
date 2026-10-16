// /components/CategoryChips.tsx
import { FlatList } from "react-native";
import { Chip, SPACING } from "@/core/design-system";

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
      contentContainerStyle={{ paddingHorizontal: SPACING.lg, gap: SPACING.sm + 2 }}
      renderItem={({ item }) => <Chip label={item.label} />}
      showsHorizontalScrollIndicator={false}
    />
  );
}
