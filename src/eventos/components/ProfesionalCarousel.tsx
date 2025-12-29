// /components/ProfessionalsCarousel.tsx
import { FlatList } from "react-native";
import { ProfessionalCard } from "./ProfesionalCard";

export function ProfessionalsCarousel({ data }: { data: any[] }) {
  return (
    <FlatList
      horizontal
      data={data}
      keyExtractor={(i) => i.id}
      renderItem={({ item }) => <ProfessionalCard item={item} />}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 12, paddingRight: 16 }}
    />
  );
}
