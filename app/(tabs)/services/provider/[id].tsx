import { useEffect, useState } from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { MotiView } from "moti";

import { SERVICE_CATEGORIES } from "@/constants/serviceCategories";
import {
  SERVICE_PROVIDERS,
  ServiceProvider,
} from "@/constants/serviceProviders";
import { TOKENS } from "@/theme/tokens";

export default function ProviderProfileScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const [provider, setProvider] = useState<ServiceProvider | undefined>();

  useEffect(() => {
    const providerId = typeof params.id === "string" ? params.id : undefined;
    const foundProvider = SERVICE_PROVIDERS.find(
      (item) => item.id === providerId
    );
    setProvider(foundProvider);
  }, [params.id]);

  function handleBack() {
    router.back();
  }

  // function formatRate(rate: ServiceProvider["rate"]) {
  //   const symbol =
  //     rate.currency === "ARS"
  //       ? "$"
  //       : rate.currency === "USD"
  //       ? "US$"
  //       : `${rate.currency} `;
  //   return `${symbol}${rate.amount} / ${rate.unit}`;
  // }

  if (!provider) {
    return (
      <SafeAreaView edges={["left", "right"]} style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.emptyState}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <Text style={styles.emptyTitle}>No encontramos este profesional</Text>
          <Text style={styles.emptySubtitle}>
            Volvé a la lista y elegí otro servicio disponible.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const category = SERVICE_CATEGORIES.find(
    (item) => item.id === provider.categoryId
  );
  const accentColor = category?.accent ?? "#E8ECF2";

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <ImageBackground
            source={{ uri: provider.heroImage }}
            style={styles.heroBackground}
            imageStyle={styles.heroBackgroundImage}
          >
            <View style={styles.heroOverlay} />
            <View style={styles.heroContent}>
              <Image
                source={{ uri: provider.photo }}
                style={[styles.heroAvatar, { borderColor: accentColor }]}
              />
              <Text style={styles.heroName}>{provider.name}</Text>
              <Text style={styles.heroTitle}>{provider.title}</Text>
              <Text style={styles.heroSummary}>{provider.summary}</Text>
              <View style={styles.heroStats}>
                <Text style={styles.heroRating}>
                  ★ {provider.rating.toFixed(1)}
                </Text>
                <View style={styles.dot} />
                <Text style={styles.heroReviews}>
                  {provider.reviews} reseñas
                </Text>
              </View>
              <Text style={styles.heroLocation}>{provider.location}</Text>
              <View style={styles.heroActions}>
                {/* <Text style={styles.heroRate}>
                  Desde {formatRate(provider.rate)}
                </Text> */}
                <Pressable style={styles.quoteButton}>
                  <Text style={styles.quoteButtonText}>Cotizar servicio</Text>
                </Pressable>
              </View>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre el servicio</Text>
          <Text style={styles.sectionBody}>{provider.bio}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Especialidades</Text>
          <View style={styles.tagsRow}>
            {provider.tags.map((tag) => (
              <View
                key={tag}
                style={[styles.tag, { backgroundColor: accentColor }]}
              >
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trabajos recientes</Text>
          <View style={styles.worksList}>
            {provider.recentWorks.map((work, index) => (
              <MotiView
                key={work.id}
                from={{ opacity: 0, translateY: 16 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  type: "timing",
                  duration: 420,
                  delay: index * 80,
                }}
                style={styles.workCard}
              >
                <Image source={{ uri: work.image }} style={styles.workImage} />
                <View style={styles.workInfo}>
                  <Text style={styles.workTitle}>{work.title}</Text>
                  <Text style={styles.workTime}>{work.timeAgo}</Text>
                </View>
              </MotiView>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
    paddingBottom: 40,
  },
  headerRow: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    zIndex: 10,
    top: 30,
    left: 40,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: TOKENS.radius.lg,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    ...TOKENS.shadow.soft,
  },
  backIcon: {
    fontSize: 20,
    color: TOKENS.color.text,
  },
  heroCard: {
    borderRadius: TOKENS.radius.xl,
    overflow: "hidden",
    ...TOKENS.shadow.soft,
  },
  heroBackground: {
    padding: 24,
  },
  heroBackgroundImage: {
    borderRadius: TOKENS.radius.xl,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
  },
  heroContent: {
    alignItems: "center",
    gap: 10,
  },
  heroAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    backgroundColor: "#FFFFFF",
  },
  heroName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  heroTitle: {
    fontSize: 16,
    color: "#F5F7FA",
  },
  heroSummary: {
    fontSize: 14,
    color: "#E1E6EC",
    textAlign: "center",
    lineHeight: 20,
  },
  heroStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroRating: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFE082",
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  heroReviews: {
    fontSize: 13,
    color: "#F1F5F9",
  },
  heroLocation: {
    fontSize: 13,
    color: "#F1F5F9",
  },
  heroActions: {
    marginTop: 4,
    alignItems: "center",
    gap: 8,
  },
  heroRate: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  quoteButton: {
    marginTop: 4,
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 26,
    borderRadius: TOKENS.radius.pill,
  },
  quoteButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: TOKENS.color.text,
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: TOKENS.radius.lg,
    padding: 18,
    gap: 12,
    ...TOKENS.shadow.soft,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: TOKENS.color.text,
  },
  sectionBody: {
    fontSize: 14,
    color: TOKENS.color.sub,
    lineHeight: 20,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: TOKENS.radius.pill,
  },
  tagText: {
    fontSize: 12,
    color: TOKENS.color.text,
  },
  worksList: {
    gap: 12,
  },
  workCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  workImage: {
    width: 72,
    height: 72,
    borderRadius: TOKENS.radius.lg,
  },
  workInfo: {
    flex: 1,
    gap: 4,
  },
  workTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: TOKENS.color.text,
  },
  workTime: {
    fontSize: 12,
    color: TOKENS.color.sub,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: TOKENS.color.text,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: TOKENS.color.sub,
    textAlign: "center",
  },
});
