import { FlatList, Pressable } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { SPACING, Text, useIsDark, useThemeColors } from "@/core/design-system";

export default function TopCarousel({
  users,
}: {
  users: { id: string; image: string }[];
}) {
  const tc = useThemeColors();
  const isDark = useIsDark();
  const flatListRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const nextIndex = (index + 1) % users.length;
      setIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }, 2000); // cambia cada 3 segundos

    return () => clearInterval(timer);
  }, [index]);

  return (
    <FlatList
      ref={flatListRef}
      data={users}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Pressable
          style={{
            width: 350,
            height: 300,
            marginRight: 40,
            backgroundColor: tc.surface,
          }}
        >
          <Text
            variant="subtitle"
            center
            style={{ marginBottom: SPACING.sm + 2 }}
          >
            {item.name}
          </Text>
        </Pressable>
      )}
      // contentContainerStyle={{ paddingBottom: 20 }}
      showsHorizontalScrollIndicator
      indicatorStyle={isDark ? "white" : "black"}
      pagingEnabled
      bouncesZoom
      centerContent
      horizontal
    />
  );
}
