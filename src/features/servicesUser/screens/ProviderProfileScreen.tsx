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


import { Provider } from "@/src/interfaces/provider";
import { useProviders } from "@/contexts/ProvidersContext";
import { useCategories } from "@/contexts/CategoriesContext";
import { TOKENS } from "@/core/design-system/tokens";
import { Service } from "@/src/interfaces/service";
import ServiceCard from "../components/ServiceCard";
import { ServiceSummary } from "@/types/services";
import { ServiceDetailModal } from "../components/ServiceDetailModal";

export default function ProviderProfileScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { fetchProvider, findProvider, loadProviderServices } = useProviders();
  const { categories } = useCategories();

  const [provider, setProvider] = useState<Provider | undefined>();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedService, setSelectedService] = useState<ServiceSummary | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const providerId = typeof params.id === "string" ? params.id : undefined;
    console.log(providerId, "providerId en providerProfileScreen");

    if (!providerId) return;

    let isMounted = true;

    const loadData = async () => {
      const foundProvider = await findProvider(providerId);
      console.log(foundProvider, "foundProvider en providerProfileScreen");


      if (foundProvider) {
        if (isMounted) setProvider(foundProvider);
      } else {
        if (isMounted) setLoading(true);
        try {
          const data = await fetchProvider(providerId);
          console.log(data, "data provider en providerProfileScreen");
          if (data && isMounted) setProvider(data);
        } catch (err) {
          console.error(err);
        } finally {
          if (isMounted) setLoading(false);
        }
      }
    };


    loadData();

    return () => {
      isMounted = false;
    };
  }, [params.id, findProvider, fetchProvider]);

  // Fetch services for the provider
  useEffect(() => {
    if (!provider?.id) return;

    let isMounted = true;

    loadProviderServices(provider.id)
      .then(data => {
        if (isMounted && data) {
          setServices(data);
        }
      })
      .catch(err => console.error("Error loading services:", err));

    return () => { isMounted = false; };
  }, [provider?.id, loadProviderServices]);

  function handleBack() {
    router.back();
  }

  function formatRate(rate: Provider["rate"]) {
    if (!rate) return "Consultar";
    const symbol =
      rate.currency === "ARS"
        ? "$"
        : rate.currency === "USD"
          ? "US$"
          : `${rate.currency} `;
    return `${symbol}${rate.amount} / ${rate.unit}`;
  }

  if (!provider) {
    if (loading) {
      return (
        <SafeAreaView style={styles.safeArea}>
          <Stack.Screen options={{ headerShown: false }} />
          <View style={styles.emptyState}>
            <MotiView
              from={{ opacity: 0.5, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                type: "timing",
                duration: 800,
                loop: true,
              }}
            >
              <Text style={styles.emptyTitle}>Cargando perfil...</Text>
            </MotiView>
          </View>
        </SafeAreaView>
      )
    }
    return (
      <SafeAreaView style={styles.safeArea}>
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

  const category = categories.find(
    (item) => item.id === (provider.categoryId as string)
  );
  const accentColor = category?.id ? TOKENS.color.primary : "#E8ECF2"; // Fallback color logic

  return (
    <SafeAreaView style={styles.safeArea}>
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
                  ★ {provider.rating ? provider.rating : "N/D"}
                </Text>
                <View style={styles.dot} />
                <Text style={styles.heroReviews}>
                  {provider.reviews} reseñas
                </Text>
              </View>
              <Text style={styles.heroLocation}>{provider.location}</Text>
              <View style={styles.heroActions}>
                <Text style={styles.heroRate}>
                  Desde {formatRate(provider.rate)}
                </Text>
                <Pressable style={styles.quoteButton}>
                  <Text style={styles.quoteButtonText}>Cotizar servicio</Text>
                </Pressable>
              </View>
            </View>
          </ImageBackground>
        </View>

        {services.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Servicios disponibles</Text>
            <View style={styles.servicesList}>
              {services.map((service) => {
                // Map Service to ServiceSummary fallback
                // We create a temporary fallback object because ServiceCard expects ServiceSummary
                // and Service interface might differ slightly.
                const fallback: ServiceSummary = {
                  id: service.id,
                  title: service.title,
                  name: provider.name || "", // Provider name
                  thumbnail: service.image || "",
                  providerId: provider.id || service.providerId || "",
                  location: service.location || provider.location || "",
                  categoryId: (service.categoryId as string) || (provider.categoryId as string) || "",
                  summary: service.description || "",
                  averageRating: service.rating ?? 0,
                  reviewsCount: service.reviewCount ?? 0,
                  rate: {
                    amount: service.price || 0,
                    currency: service.currency || 'USD',
                    unit: 'fixed' // Defaulting to fixed as Service doesn't have unit
                  }
                };

                return (
                  <ServiceCard
                    key={service.id}
                    serviceId={service.id}
                    fallback={fallback}
                    onPress={() => {
                      setSelectedService(fallback);
                      setModalVisible(true);
                    }}
                  />
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre el servicio</Text>
          <Text style={styles.sectionBody}>{provider.bio}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Especialidades</Text>
          <View style={styles.tagsRow}>
            {provider.tags?.map((tag) => (
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
            {provider.recentWorks?.map((work, index) => (
              <MotiView
                key={work.id as string}
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

      <ServiceDetailModal
        visible={modalVisible}
        service={selectedService}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: TOKENS.color.bg,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
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
  servicesList: {
    gap: 16,
    paddingTop: 8,
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
