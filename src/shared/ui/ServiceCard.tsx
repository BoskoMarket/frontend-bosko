import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ServiceProvider } from "@/src/types";
import { Gallery } from "@/src/shared/ui/Gallery";
import { KeywordChips } from "@/src/shared/ui/KeywordChips";

export const ServiceCard = ({ service }: { service: ServiceProvider }) => {
  const gallery = service.recentWorks.map((work) => ({
    id: work.id,
    uri: work.image,
    description: work.title,
  }));

  return (
    <View style={styles.card} accessibilityRole="summary">
      <Text style={styles.title}>{service.title}</Text>
      <Text style={styles.subtitle}>{service.name}</Text>
      <Text style={styles.description}>{service.summary}</Text>
      <Gallery photos={gallery} />
      <KeywordChips keywords={service.tags} />
      <View style={styles.metaRow}>
        <Text style={styles.meta}>
          {service.rate.currency} {service.rate.amount}/{service.rate.unit}
        </Text>
        <Text style={styles.meta}>{service.location}</Text>
        <Text style={styles.meta}>
          ⭐ {service.rating.toFixed(1)} ({service.reviews})
        </Text>
      </View>
    </View>
  );
};

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
    marginBottom: 4,
  },
  subtitle: {
    color: "#6b7280",
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
