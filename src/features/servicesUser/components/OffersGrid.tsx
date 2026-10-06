// /components/OffersGrid.tsx
import { FlatList } from "react-native";
import { Card, SPACING, Text, TOKENS } from "@/core/design-system";

export function OffersGrid({
  data,
}: {
  data: { id: string; title: string; price: string }[];
}) {
  return (
    <FlatList
      numColumns={2}
      data={data}
      keyExtractor={(i) => i.id}
      columnWrapperStyle={{ gap: SPACING.md, paddingHorizontal: SPACING.lg }}
      renderItem={({ item }) => (
        <Card padding="md" style={{ flex: 1 }}>
          <Text variant="subtitle">{item.title}</Text>
          <Text color={TOKENS.color.primary} style={{ marginTop: SPACING.xs + 2 }}>
            {item.price}
          </Text>
        </Card>
      )}
      scrollEnabled={false}
      contentContainerStyle={{ gap: SPACING.md }}
    />
  );
}
