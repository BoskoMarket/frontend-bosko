import React, { useMemo, useRef } from "react";
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
import { GRADIENTS, PREMIUM_SHADOWS, TOKENS, usePremiumColors } from "@/core/design-system";
import type { PremiumColors } from "@/core/design-system";
import { FONT_FAMILY } from '@/core/design-system';

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
  const pc = usePremiumColors();
  const styles = useMemo(() => createStyles(pc), [pc]);
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
            colors={GRADIENTS.overlayFadeDown}
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
  const pc = usePremiumColors();
  const styles = useMemo(() => createStyles(pc), [pc]);

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

const createStyles = (pc: PremiumColors) => StyleSheet.create({
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
    fontFamily: FONT_FAMILY.heading,
    color: pc.primary,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.body,
    color: pc.textPrimary,
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
    backgroundColor: pc.card,
    ...PREMIUM_SHADOWS.global,
  },
  pressable: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: pc.card,
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
    color: TOKENS.onMedia.text,
    fontSize: 16,
    fontFamily: FONT_FAMILY.heading,
    marginBottom: 4,
    textShadowColor: TOKENS.scrim.medium,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  serviceCount: {
    color: pc.goldFill,
    fontSize: 12,
    fontFamily: FONT_FAMILY.headingMedium,
  },
});
