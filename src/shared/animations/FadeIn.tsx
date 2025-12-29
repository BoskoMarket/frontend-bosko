// animations/FadeIn.tsx
import React, { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

export default function FadeIn({ children }: { children: React.ReactNode }) {
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 600 });
  }, []);

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}
