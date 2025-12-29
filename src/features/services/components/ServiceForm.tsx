import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Button, Alert } from "react-native";
import { ServiceProvider, ServiceProviderInput } from "@/src/types";
import { t } from "@/src/shared/i18n";

interface Props {
  initialService?: ServiceProvider;
  onSubmit: (payload: ServiceProviderInput) => Promise<void>;
}

type FormState = {
  name: string;
  title: string;
  summary: string;
  categoryId: string;
  location: string;
  rateAmount: string;
  rateCurrency: string;
  rateUnit: string;
  tags: string;
  avatar: string;
  photo: string;
  heroImage: string;
  bio: string;
  rating: string;
  reviews: string;
  recentWorks: string;
};

const createInitialState = (service?: ServiceProvider): FormState => ({
  name: service?.name ?? "",
  title: service?.title ?? "",
  summary: service?.summary ?? "",
  categoryId: service?.categoryId ?? "",
  location: service?.location ?? "",
  rateAmount: service ? String(service.rate.amount) : "",
  rateCurrency: service?.rate.currency ?? "USD",
  rateUnit: service?.rate.unit ?? "hora",
  tags: service?.tags.join(", ") ?? "",
  avatar: service?.avatar ?? "",
  photo: service?.photo ?? "",
  heroImage: service?.heroImage ?? "",
  bio: service?.bio ?? "",
  rating: service ? String(service.rating) : "",
  reviews: service ? String(service.reviews) : "",
  recentWorks: service?.recentWorks
    ? service.recentWorks
        .map((work: { image: string }) => work.image)
        .join(", ")
    : "",
});

export const ServiceForm = ({ initialService, onSubmit }: Props) => {
  const [form, setForm] = useState<FormState>(() =>
    createInitialState(initialService)
  );
  const [loading, setLoading] = useState(false);

  const onChange = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const buildPayload = (): ServiceProviderInput => {
    const fallbackImage = "https://placehold.co/600x300";
    const heroImage =
      form.heroImage ||
      initialService?.heroImage ||
      form.photo ||
      fallbackImage;
    const photo = form.photo || initialService?.photo || heroImage;
    const avatar =
      form.avatar || initialService?.avatar || "https://placehold.co/96x96";

    const tags = form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const recentWorksImages = form.recentWorks
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    const recentWorks =
      recentWorksImages.length > 0
        ? recentWorksImages.map((image, index) => ({
            id:
              initialService?.recentWorks?.[index]?.id ??
              `custom-work-${index}`,
            title:
              initialService?.recentWorks?.[index]?.title ??
              `${form.title} #${index + 1}`,
            image,
            timeAgo:
              initialService?.recentWorks?.[index]?.timeAgo ?? "Reciente",
          }))
        : initialService?.recentWorks ?? [
            {
              id: "custom-work-0",
              title: form.title || form.name,
              image: heroImage,
              timeAgo: "Reciente",
            },
          ];

    return {
      id: initialService?.id,
      categoryId: form.categoryId || "custom",
      name: form.name || initialService?.name || "Mi servicio",
      title: form.title,
      summary: form.summary,
      rating: Number(form.rating) || initialService?.rating || 5,
      reviews: Number(form.reviews) || initialService?.reviews || 0,
      location: form.location,
      rate: {
        amount: Number(form.rateAmount) || initialService?.rate?.amount || 0,
        currency: form.rateCurrency || initialService?.rate?.currency || "USD",
        unit: form.rateUnit || initialService?.rate?.unit || "hora",
      },
      avatar,
      photo,
      heroImage,
      bio: form.bio,
      tags,
      recentWorks,
    };
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.summary.trim()) {
      Alert.alert("Error", t("missingServiceFields"));
      return;
    }
    setLoading(true);
    await onSubmit(buildPayload());
    setLoading(false);
  };

  const fields: Array<{
    key: keyof FormState;
    label: string;
    multiline?: boolean;
    keyboardType?: "default" | "numeric";
  }> = [
    { key: "name", label: t("providerName") },
    { key: "title", label: t("serviceTitle") },
    { key: "summary", label: t("serviceSummary"), multiline: true },
    { key: "categoryId", label: t("serviceCategory") },
    { key: "location", label: t("serviceLocation") },
    {
      key: "rateAmount",
      label: t("serviceRateAmount"),
      keyboardType: "numeric",
    },
    { key: "rateCurrency", label: t("serviceRateCurrency") },
    { key: "rateUnit", label: t("serviceRateUnit") },
    { key: "tags", label: t("serviceTags") },
    { key: "avatar", label: t("serviceAvatar") },
    { key: "photo", label: t("servicePhoto") },
    { key: "heroImage", label: t("serviceHeroImage") },
    { key: "bio", label: t("serviceBio"), multiline: true },
    { key: "rating", label: t("serviceRating"), keyboardType: "numeric" },
    { key: "reviews", label: t("serviceReviews"), keyboardType: "numeric" },
    { key: "recentWorks", label: t("serviceRecentWorks"), multiline: true },
  ];

  return (
    <View style={styles.container}>
      {fields.map((field) => (
        <View key={field.key}>
          <Text style={styles.label}>{field.label}</Text>
          <TextInput
            style={[styles.input, field.multiline && styles.multiline]}
            value={form[field.key]}
            multiline={field.multiline}
            onChangeText={(value) => onChange(field.key, value)}
            accessibilityLabel={field.label}
            keyboardType={field.keyboardType ?? "default"}
          />
        </View>
      ))}
      <Button
        title={loading ? t("saving") : t("save")}
        onPress={handleSubmit}
      />
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
  multiline: {
    minHeight: 60,
    textAlignVertical: "top",
  },
});
