import { View, Text, StyleSheet } from "react-native";
import React from "react";
import OptionItem from "./OptionItem";

type Option = {
  label: string;
  onPress: () => void;
};

export default function ProfileSection({
  title,
  options,
}: {
  title: string;
  options: Option[];
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      {options.map((opt, i) => (
        <OptionItem key={i} label={opt.label} onPress={opt.onPress} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginVertical: 12, paddingHorizontal: 16 },
  title: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
});
