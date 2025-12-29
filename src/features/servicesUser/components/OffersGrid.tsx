// /components/OffersGrid.tsx
import { FlatList, View, Text, StyleSheet } from "react-native";
import { TOKENS } from "@/core/design-system/tokens";

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
      columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={{ fontWeight: "700", color: TOKENS.color.text }}>
            {item.title}
          </Text>
          <Text style={{ color: TOKENS.color.primary, marginTop: 6 }}>
            {item.price}
          </Text>
        </View>
      )}
      scrollEnabled={false}
      contentContainerStyle={{ gap: 12 }}
    />
  );
}
const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    ...TOKENS.shadow.soft,
  },
});
