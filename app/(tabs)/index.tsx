// /screens/Dashboard.tsx
import { View, FlatList, StatusBar } from "react-native";
import { NavBar } from "@/components/Navbar";
import { ProfessionalsCarousel } from "@/components/ProfesionalCarousel";
import { OffersGrid } from "@/components/OffersGrid";
import { PromoBanner } from "@/components/PromoBanner";
import { PremiumBanner } from "@/src/components/PremiumBanner";
import { CategoryVideoCarousel } from "@/src/components/CategoryVideoCarousel";
import { QuickActions } from "@/components/QuickActions";
import { TOKENS } from "@/theme/tokens";
import Colors from "@/constants/Colors";
import { useRouter } from "expo-router";

// Mock data for other components (keeping existing mocks)
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

export default function Dashboard() {
  const router = useRouter();

  return (
    <>
      <StatusBar barStyle="light-content" />
      <FlatList
        data={[]}
        style={{ backgroundColor: Colors.white }}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListHeaderComponent={
          <View>
            <PremiumBanner />
            <CategoryVideoCarousel
              onSelectCategory={(id) => router.push({ pathname: "/(tabs)/services/category/[id]", params: { id } })}
            />

            <View style={{ paddingHorizontal: 5, gap: 24 }}>
              <ProfessionalsCarousel data={pros} />
              <PromoBanner />
              <OffersGrid data={offers} />
              <QuickActions onPublish={() => { }} onRequest={() => { }} />
            </View>
          </View>
        }
        renderItem={null}
      />
    </>
  );
}
