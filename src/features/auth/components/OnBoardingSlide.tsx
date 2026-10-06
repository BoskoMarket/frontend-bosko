import React, { useRef, useEffect } from "react";
import { View, StyleSheet, Animated } from "react-native";
import LottieView from "lottie-react-native";
import { PREMIUM, Text, useThemeColors } from "@/core/design-system";

interface OnBoardingSlideProps {
  item: {
    image?: any;
    title: string;
    subtitle: string;
  };
}

export default function OnBoardingSlide({ item }: OnBoardingSlideProps) {
  const tc = useThemeColors();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, damping: 15, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity, transform: [{ translateY }] }]}>
      <Text variant="h2" center color={PREMIUM.colorPrimary} style={styles.title}>{item.title}</Text>
      {item.image && (
        <View style={styles.lottieContainer}>
          <LottieView source={item.image} autoPlay loop style={styles.lottie} />
        </View>
      )}
      <Text variant="subtitle" weight="400" center color={tc.textSub} style={styles.subtitle}>{item.subtitle}</Text>
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
    lineHeight: 36,
    textTransform: "none",
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
    lineHeight: 24,
    maxWidth: 300,
    marginTop: 10,
  },
});
