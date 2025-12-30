/**
 * OnBoardingSlide - Componente individual de cada slide del carrusel de onboarding
 * Muestra el título, animación Lottie y subtítulo de cada pantalla de bienvenida
 * Con animaciones de entrada suaves usando react-native-reanimated
 */

import { View, Text, StyleSheet } from "react-native";
import React, { useEffect } from "react";
import LottieView from "lottie-react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { globalStyles } from "@/core/design-system/global-styles";
import Colors from "@/core/design-system/Colors";

interface OnBoardingSlideProps {
  item: {
    image?: any;
    title: string;
    subtitle: string;
  };
}

export default function OnBoardingSlide({ item }: OnBoardingSlideProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 600 });
    translateY.value = withSpring(0, { damping: 15 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={styles.title}>{item.title}</Text>

      {item.image && (
        <View style={styles.lottieContainer}>
          <LottieView
            source={item.image}
            autoPlay
            loop
            style={styles.lottie}
          />
        </View>
      )}

      <Text style={styles.subtitle}>{item.subtitle}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    color: Colors.colorPrimary,
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  lottieContainer: {
    width: 320,
    height: 320,
    justifyContent: "center",
    alignItems: "center",
  },
  lottie: {
    width: "100%",
    height: "100%",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#555",
    lineHeight: 24,
    maxWidth: 300,
    marginTop: 10,
  },
});
