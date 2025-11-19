import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Button, Alert } from "react-native";
import { Service } from "@/src/types";
import { t } from "@/src/shared/i18n";

interface Props {
  initialService?: Service;
  onSubmit: (payload: Omit<Service, "id" | "userId">) => Promise<void>;
}

export const ServiceForm = ({ initialService, onSubmit }: Props) => {
  const [form, setForm] = useState({
    name: initialService?.name ?? "",
    description: initialService?.description ?? "",
    price: initialService?.price?.toString() ?? "",
    area: initialService?.area ?? "",
    availability: initialService?.availability ?? "",
    keywords: initialService?.keywords.join(", ") ?? "",
    photos: initialService?.photos.map((photo) => photo.uri).join(", ") ?? "",
  });
  const [loading, setLoading] = useState(false);

  const onChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.description.trim()) {
      Alert.alert("Error", "Completá nombre y descripción");
      return;
    }
    setLoading(true);
    await onSubmit({
      name: form.name,
      description: form.description,
      price: form.price ? Number(form.price) : undefined,
      area: form.area,
      availability: form.availability,
      keywords: form.keywords
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean),
      photos: form.photos
        .split(",")
        .map((uri) => uri.trim())
        .filter(Boolean)
        .map((uri, index) => ({ id: `new-${index}`, uri })),
      rating: initialService?.rating ?? 5,
    });
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      {([
        { label: t("serviceName"), key: "name" },
        { label: t("serviceDescription"), key: "description" },
        { label: t("servicePrice"), key: "price" },
        { label: t("serviceArea"), key: "area" },
        { label: t("serviceAvailability"), key: "availability" },
        { label: t("serviceKeywords"), key: "keywords" },
        { label: t("servicePhotos"), key: "photos" },
      ] as const).map((item) => (
        <View key={item.key}>
          <Text style={styles.label}>{item.label}</Text>
          <TextInput
            style={styles.input}
            value={form[item.key]}
            onChangeText={(value) => onChange(item.key, value)}
            multiline={item.key === "description"}
            accessibilityLabel={item.label}
          />
        </View>
      ))}
      <Button title={loading ? "Guardando..." : t("save")} onPress={handleSubmit} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  label: {
    fontWeight: "600",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 10,
  },
});
