import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  onPress: () => void;
}

export const SettingsButton = ({ onPress }: Props) => (
  <TouchableOpacity
    style={styles.button}
    accessibilityRole="button"
    accessibilityLabel="Abrir configuración"
    onPress={onPress}
  >
    <Ionicons name="settings-outline" size={20} color="#111827" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
  },
});
