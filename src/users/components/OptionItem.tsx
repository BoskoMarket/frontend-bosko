import { Text, TouchableOpacity, StyleSheet } from "react-native";
import React from "react";

export default function OptionItem({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.item}>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: { paddingVertical: 12, borderBottomWidth: 0.5, borderColor: "#eee" },
  label: { fontSize: 15 },
});
