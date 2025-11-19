import React from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { t } from "@/src/shared/i18n";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export const SearchBar = ({ value, onChange }: Props) => (
  <View style={styles.container} accessibilityRole="search">
    <Ionicons name="search" size={20} color="#6b7280" accessibilityLabel="Buscar" />
    <TextInput
      style={styles.input}
      placeholder={t("searchPlaceholder")}
      value={value}
      onChangeText={onChange}
      accessibilityLabel={t("searchPlaceholder")}
      returnKeyType="search"
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
});
