import React, { useEffect } from "react";
import { Dimensions, View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

export default function AnimatedBarsBackground() {
  // Creamos varias shared values (1 por barra)
  const bars = Array.from({ length: 6 }).map(() => useSharedValue(0));

  useEffect(() => {
    bars.forEach((bar, index) => {
      const delay = index * 400; // cada barra empieza más tarde
      setTimeout(() => {
        bar.value = withRepeat(withTiming(20, { duration: 3000 }), -1, true);
      }, delay);
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFill}>
      {bars.map((bar, index) => {
        const animStyle = useAnimatedStyle(() => ({
          transform: [{ translateY: bar.value }],
        }));

        return (
          <Animated.View
            key={index}
            style={[
              styles.bar,
              animStyle,
              {
                left: index * 60 + 20,
                backgroundColor: "red",
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    width: 20,
    height: height * 1.5,
    borderRadius: 10,
  },
});
