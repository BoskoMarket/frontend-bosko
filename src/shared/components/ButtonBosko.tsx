/**
 * ButtonBosko - Botón principal con diseño moderno y animaciones de alta calidad
 * Incluye efecto de escala al presionar y sombras difuminadas (glow)
 */

import {
  Text,
  StyleSheet,
  Pressable,
} from "react-native";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { globalStyles } from "@/core/design-system/global-styles";
import Colors from "@/core/design-system/Colors";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

interface ButtonBoskoProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
}

export default function ButtonBosko({ title, onPress, isLoading }: ButtonBoskoProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pressable}
      >
        <LinearGradient
          // Gradiente más rico con un toque de brillo
          colors={[globalStyles.colorPrimary, "#a0032a", Colors.colorPrimaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Text style={styles.text}>
            {isLoading ? "Cargando..." : title}
          </Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: 200,
    borderRadius: 30,

    // Sombra "Glow" moderna
    shadowColor: Colors.colorPrimary,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  pressable: {
    width: "100%",
    borderRadius: 30,
    overflow: "hidden", // Para que el gradiente respete el borde
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30, // Asegura que el gradiente tenga border radius
  },
  text: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase", // Estilo moderno tipo botón de acción
  },
});
