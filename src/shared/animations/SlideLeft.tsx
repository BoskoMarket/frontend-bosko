// animations/SlideLeft.tsx
import React, { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

export default function SlideLeft({ children }: { children: React.ReactNode }) {
  const translateX = useSharedValue(80);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateX: translateX.value }],
    };
  });

  useEffect(() => {
    translateX.value = withTiming(0, { duration: 500 });
    opacity.value = withTiming(1, { duration: 500 });
  }, []);

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}
