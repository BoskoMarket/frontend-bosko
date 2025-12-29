import { View, FlatList, Text } from "react-native";
import { NavBar } from "@/shared/components/Navbar";
import { HeroCarousel } from "@/features/servicesUser/components/HeroCarousel";
import { CategoryChips } from "@/features/servicesUser/components/CategoryChips";
import { ProfessionalsCarousel } from "@/features/servicesUser/components/ProfesionalCarousel";
import { PromoBanner } from "@/features/servicesUser/components/PromoBanner";
import { OffersGrid } from "@/features/servicesUser/components/OffersGrid";
import { QuickActions } from "@/features/servicesUser/components/QuickActions";
import { TOKENS } from "@/core/design-system/tokens";
import { PremiumButton } from "@/components/PremiumButton";
import { StatusBar } from "expo-status-bar";
import Colors from "@/core/design-system/Colors";
import { PremiumBanner } from "@/components/PremiumBanner";
import { CategoryVideoCarousel } from "@/components/CategoryVideoCarousel";
import { router } from "expo-router";

const hero = [
  {
    title: "Encontrá profesionales",
    subtitle: "Cerca tuyo, verificados",
    cta: "Explorar",
  },
  {
    title: "Ofrecé tu trabajo",
    subtitle: "Mostrá tu perfil y crecé",
    cta: "Publicar",
    color: TOKENS.color.primaryDark,
  },
  {
    title: "Promocioná tu negocio",
    subtitle: "Llega a más clientes",
    cta: "Anunciar",
    color: TOKENS.color.primary,
  },
];

const categories = [
  { id: "1", label: "Plomería" },
  { id: "2", label: "Electricidad" },
  { id: "3", label: "Belleza" },
  { id: "4", label: "Diseño" },
];
const pros = [
  {
    id: "p1",
    name: "Pedro García",
    role: "Plomero",
    rating: 4.9,
    avatar: "https://i.pravatar.cc/100?img=1",
  },
  {
    id: "p2",
    name: "Ana López",
    role: "Electricista",
    rating: 4.8,
    avatar: "https://i.pravatar.cc/100?img=2",
  },
];
const offers = [
  { id: "o1", title: "Instalación de grifería", price: "$12.000" },
  { id: "o2", title: "Cambio de luminarias", price: "$9.500" },
  { id: "o3", title: "Pintura ambiente", price: "$25.000" },
  { id: "o4", title: "Logo express", price: "$18.000" },
];

export default function DashboardScreen() {
  return (
    <>
      <FlatList
        data={[]}
        style={{ backgroundColor: Colors.white }}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListHeaderComponent={
          <View>
            <PremiumBanner />
            <CategoryVideoCarousel
              onSelectCategory={(id) =>
                router.push({
                  pathname: "/(tabs)/services/category/[id]",
                  params: { id },
                })
              }
            />

            <View style={{ paddingHorizontal: 5, gap: 24 }}>
              <ProfessionalsCarousel data={pros} />
              <PromoBanner />
              <OffersGrid data={offers} />
              <QuickActions onPublish={() => {}} onRequest={() => {}} />

              <View style={{ padding: 20, gap: 15, alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: Colors.premium.textPrimary,
                  }}
                >
                  New Button System
                </Text>
                <PremiumButton
                  title="Solicitar Servicio"
                  onPress={() => {}}
                  icon="flash"
                />
                <PremiumButton
                  title="Ver Detalles"
                  variant="secondary"
                  onPress={() => {}}
                  iconRight="arrow-forward"
                />
                <PremiumButton
                  title="Omitir"
                  variant="ghost"
                  onPress={() => {}}
                />
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <PremiumButton
                    title="Call"
                    size="small"
                    variant="outline"
                    icon="call"
                    onPress={() => {}}
                  />
                  <PremiumButton
                    title="Chat"
                    size="small"
                    onPress={() => {}}
                    icon="chatbubble"
                  />
                </View>
              </View>
            </View>
          </View>
        }
        renderItem={null}
      />
    </>
  );
}
