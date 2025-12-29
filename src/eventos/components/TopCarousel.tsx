import { View, Text, FlatList, Pressable } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { Image } from "expo-image";

export default function TopCarousel({
  users,
}: {
  users: { id: string; image: string }[];
}) {
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
            backgroundColor: "white",
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "bold",
              textAlign: "center",
              marginBottom: 10,
            }}
          >
            {item.name}
          </Text>
        </Pressable>
      )}
      // contentContainerStyle={{ paddingBottom: 20 }}
      showsHorizontalScrollIndicator
      indicatorStyle="black"
      pagingEnabled
      bouncesZoom
      centerContent
      horizontal
    />
  );
}
