// /components/HeroCarousel.tsx
import Carousel from "react-native-reanimated-carousel";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { BlurView } from "expo-blur";
import { TOKENS } from "@/core/design-system/tokens";
import { Image } from "expo-image";
import ButtonBosko from "@/shared/components/ButtonBosko";
import { router } from "expo-router";
const { width } = Dimensions.get("window");

export function HeroCarousel({
  data,
}: {
  data: { title: string; subtitle: string; cta: string }[];
}) {
  return (
    <Carousel
      width={width}
      height={200}
      data={data}
      pagingEnabled
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.sub}>{item.subtitle}</Text>

          <ButtonBosko
            title="Explorar"
            onPress={() => router.push("/(tabs)/services")}
          />
        </View>
      )}
    />
  );
}
const styles = StyleSheet.create({
  card: {
    height: 200,
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: "hidden",
    padding: 16,
    backgroundColor: "transparent",
    // ...TOKENS.shadow.soft,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  title: { fontSize: 22, fontWeight: "800", color: TOKENS.color.text },
  sub: { color: TOKENS.color.sub, marginTop: 6 },
  btn: {
    width: 120,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    backgroundColor: TOKENS.color.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
});
