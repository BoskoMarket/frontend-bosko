// animations/SlideUp.tsx
import React, { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

export default function SlideUp({ children }: { children: React.ReactNode }) {
  const translateY = useSharedValue(40);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  useEffect(() => {
    translateY.value = withTiming(0, { duration: 500 });
    opacity.value = withTiming(1, { duration: 500 });
  }, []);

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}
