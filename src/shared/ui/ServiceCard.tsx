import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Service } from "@/src/types";
import { Gallery } from "@/src/shared/ui/Gallery";
import { KeywordChips } from "@/src/shared/ui/KeywordChips";

export const ServiceCard = ({ service }: { service: Service }) => (
  <View style={styles.card} accessibilityRole="summary">
    <Text style={styles.title}>{service.name}</Text>
    <Text style={styles.description}>{service.description}</Text>
    <Gallery photos={service.photos} />
    <KeywordChips keywords={service.keywords} />
    <View style={styles.metaRow}>
      {service.price && <Text style={styles.meta}>${service.price.toLocaleString()}</Text>}
      <Text style={styles.meta}>{service.area}</Text>
      <Text style={styles.meta}>{service.availability}</Text>
      {service.rating && <Text style={styles.meta}>⭐ {service.rating.toFixed(1)}</Text>}
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    marginVertical: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  description: {
    color: "#4b5563",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  },
  meta: {
    fontWeight: "600",
    color: "#111827",
  },
});
