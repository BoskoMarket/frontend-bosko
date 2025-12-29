import { View, FlatList } from "react-native";
import { NavBar } from "@/src/eventos/components/Navbar";
import { HeroCarousel } from "@/src/eventos/components/HeroCarousel";
import { CategoryChips } from "@/src/eventos/components/CategoryChips";
import { ProfessionalsCarousel } from "@/src/eventos/components/ProfesionalCarousel";
import { PromoBanner } from "@/src/eventos/components/PromoBanner";
import { OffersGrid } from "@/src/eventos/components/OffersGrid";
import { QuickActions } from "@/src/eventos/components/QuickActions";
import { TOKENS } from "@/src/shared/theme/tokens";

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

export default function Dashboard() {
  return (
    <FlatList
      data={[]}
      style={{ backgroundColor: TOKENS.color.bg }}
      ListHeaderComponent={
        <View style={{ gap: 20, paddingBottom: 120, paddingHorizontal: 5 }}>
          <NavBar />
          <HeroCarousel data={hero} />
          <CategoryChips items={categories} />
          <ProfessionalsCarousel data={pros} />
          <PromoBanner />
          <OffersGrid data={offers} />
          <QuickActions onPublish={() => {}} onRequest={() => {}} />
        </View>
      }
      renderItem={null}
    />
  );
}
