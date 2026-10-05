import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Animated,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";

import { useCategories } from "@/hooks/queries/useMarketplaceQuery";
import { Category } from "@/interfaces/category";
import { PREMIUM } from "@/core/design-system";

const CARD_WIDTH = 160;
const CARD_HEIGHT = 300;

interface VideoCategoryCardProps {
  category: Category;
  index: number;
  onPress: (category: Category) => void;
}

const VideoCategoryCard: React.FC<VideoCategoryCardProps> = ({
  category,
  index,
  onPress,
}) => {
  const video = useRef<Video>(null);
  const scale = useRef(new Animated.Value(1)).current;

  const videoSources = [
    "https://www.pexels.com/es-es/download/video/6755152/",
    "https://www.pexels.com/es-es/download/video/6755152/",
    "https://www.pexels.com/es-es/download/video/6755152/",
    "https://www.pexels.com/es-es/download/video/6755152/",
  ];

  const source = {
    uri: category.video || videoSources[index % videoSources.length],
  };

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={[styles.cardContainer, { transform: [{ scale }] }]}>
      <Pressable
        onPress={() => onPress(category)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pressable}
      >
        <View style={styles.videoWrapper}>
          <Video
            ref={video}
            style={styles.video}
            source={source}
            resizeMode={ResizeMode.COVER}
            isLooping
            shouldPlay
            isMuted={true}
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)"]}
            style={styles.gradient}
          />
          <View style={styles.content}>
            <Text style={styles.categoryName}>{category.name}</Text>
            <Text style={styles.serviceCount}>Explorar</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

export const CategoryVideoCarousel = ({
  onSelectCategory,
}: {
  onSelectCategory?: (id: string) => void;
}) => {
  const { data: categories = [] } = useCategories();

  const displayCategories = categories.slice(0, 6);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Categorías Populares</Text>
        <Text style={styles.subtitle}>Desliza para ver más</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + 12}
      >
        {displayCategories.map((cat, index) => (
          <VideoCategoryCard
            key={cat.id}
            category={cat}
            index={index}
            onPress={(c) => onSelectCategory?.(c.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: PREMIUM.colorPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: PREMIUM.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
    paddingVertical: 22,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    backgroundColor: PREMIUM.card,
    ...PREMIUM.shadows.global,
  },
  pressable: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: PREMIUM.card,
  },
  videoWrapper: {
    flex: 1,
    position: "relative",
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  categoryName: {
    color: PREMIUM.white,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  serviceCount: {
    color: PREMIUM.gold,
    fontSize: 12,
    fontWeight: "600",
  },
});
