import {
  View,
  Text,
  Pressable,
  StyleSheet,
  PressableProps,
} from "react-native";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { globalStyles } from "@/core/design-system/global-styles";

interface ButtonBoskoProps extends PressableProps {
  title: string;
  onPress: () => void;
}

export default function ButtonBosko({ title, onPress }: ButtonBoskoProps) {
  return (
    <LinearGradient
      colors={[globalStyles.colorPrimary, globalStyles.colorPrimary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.buttonContainer}
    >
      <Pressable onPress={onPress}>
        <Text style={styles.buttonText}>{title}</Text>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    // maxWidth: 200,
    width: "100%",

    maxWidth: 180,
    borderRadius: 55,
    padding: 12,
    paddingHorizontal: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.85,
    shadowRadius: 3.84,
    elevation: 15,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
