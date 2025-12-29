// /components/ProfessionalCard.tsx
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { TOKENS } from "@/core/design-system/tokens";
import Colors from "@/core/design-system/Colors";

export function ProfessionalCard({
  item,
}: {
  item: {
    id: string;
    name: string;
    role: string;
    rating: number;
    avatar: string;
  };
}) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.role}>
          {item.role} • ★ {item.rating}
        </Text>
        <TouchableOpacity style={styles.cta}>
          <Text style={{ color: "#fff", fontWeight: "700" }}>Reservar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,1)",
    borderRadius: 18,
    padding: 12,
    marginHorizontal: 16,
    ...Colors.premium.shadows.global,
  },
  avatar: { width: 56, height: 56, borderRadius: 12 },
  name: { fontWeight: "800", color: TOKENS.color.text },
  role: { color: TOKENS.color.sub, marginVertical: 4 },
  cta: {
    alignSelf: "flex-start",
    backgroundColor: TOKENS.color.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
});
