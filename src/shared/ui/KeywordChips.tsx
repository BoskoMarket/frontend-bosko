import React from "react";
import { View, Text, StyleSheet } from "react-native";

export const KeywordChips = ({ keywords }: { keywords: string[] }) => (
  <View style={styles.container}>
    {keywords.map((keyword) => (
      <View key={keyword} style={styles.chip}>
        <Text style={styles.text}>#{keyword}</Text>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 8,
  },
  chip: {
    backgroundColor: "#eef2ff",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  text: {
    color: "#4338ca",
    fontSize: 12,
    fontWeight: "600",
  },
});
