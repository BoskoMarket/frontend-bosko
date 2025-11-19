import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useServices } from "@/context/ServicesContext";
import { useAuth } from "@/context/AuthContext";
import type { Review } from "@/types/services";
import { TOKENS } from "@/theme/tokens";
import { StarRating } from "./StarRating";

interface ServiceReviewsProps {
  serviceId: string;
}

const dateFormatter = new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" });

const formatDate = (date: string) => {
  try {
    return dateFormatter.format(new Date(date));
  } catch {
    return new Date(date).toLocaleDateString();
  }
};

const ServiceReviews: React.FC<ServiceReviewsProps> = ({ serviceId }) => {
  const {
    fetchServiceReviews,
    getReviewsForService,
    reviewsStatus,
    addReviewWithRating,
    canReviewService,
    ensureCanReviewService,
  } = useServices();
  const { authState } = useAuth();
  const userId = authState.user?.id ?? "";
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const reviews = getReviewsForService(serviceId);
  const status = reviewsStatus[serviceId];
  const isLoading = Boolean(status?.loading && !status?.loaded && reviews.length === 0);

  useEffect(() => {
    fetchServiceReviews(serviceId).catch((err) => console.error(err));
  }, [fetchServiceReviews, serviceId]);

  useEffect(() => {
    if (!userId) {
      return;
    }
    ensureCanReviewService(serviceId, userId).catch((err) => console.error(err));
  }, [ensureCanReviewService, serviceId, userId]);

  const eligibility = userId ? canReviewService(serviceId, userId) : false;

  const canSubmit = useMemo(() => {
    if (!userId) {
      return false;
    }
    return eligibility !== false;
  }, [eligibility, userId]);

  const handleSubmit = async () => {
    if (!userId) {
      Alert.alert("Inicia sesión", "Necesitas iniciar sesión para opinar.");
      return;
    }
    if (rating === 0) {
      setErrorMessage("Seleccioná una calificación entre 1 y 5 estrellas.");
      return;
    }
    if (!comment.trim()) {
      setErrorMessage("Contanos un poco más sobre tu experiencia.");
      return;
    }
    setErrorMessage(null);
    setSubmitting(true);
    try {
      await addReviewWithRating({
        serviceId,
        userId,
        rating,
        comment: comment.trim(),
      });
      setComment("");
      setRating(0);
      inputRef.current?.clear();
      AccessibilityInfo.announceForAccessibility(
        "Gracias por tu reseña. Se publicó correctamente."
      );
    } catch (error: any) {
      const message =
        error?.message ?? "No pudimos enviar tu reseña. Intentá nuevamente.";
      setErrorMessage(message);
      Alert.alert("No pudimos guardar tu reseña", message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderReview = ({ item }: { item: Review }) => (
    <View key={item.id} style={styles.reviewCard}>
      {item.userAvatar ? (
        <Image source={{ uri: item.userAvatar }} style={styles.reviewAvatar} />
      ) : (
        <View style={styles.reviewInitials}>
          <Text style={styles.reviewInitialsText}>
            {item.userName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.reviewContent}>
        <View style={styles.reviewHeader}>
          <Text style={styles.reviewAuthor}>{item.userName}</Text>
          <Text style={styles.reviewDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <StarRating value={item.rating} editable={false} size={18} />
        <Text style={styles.reviewComment}>{item.comment}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Reseñas del servicio</Text>
      {isLoading ? (
        <View style={styles.loader}> 
          <ActivityIndicator />
        </View>
      ) : null}
      {reviews.length === 0 && !isLoading ? (
        <Text style={styles.emptyMessage}>
          Aún no hay reseñas. ¡Sé la primera persona en comentar!
        </Text>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          renderItem={renderReview}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      <View style={styles.form}>
        <Text style={styles.formTitle}>Dejá tu opinión</Text>
        <Text style={styles.formSubtitle}>
          Tu comentario ayuda a otras personas a elegir con confianza.
        </Text>
        <StarRating
          value={rating}
          onChange={setRating}
          label="Calificar con estrellas"
        />
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={4}
          placeholder="Contá cómo fue tu experiencia"
          accessibilityLabel="Escribir comentario"
          accessibilityHint="Describe cómo fue el servicio que contrataste"
          editable={canSubmit && !submitting}
          returnKeyType="send"
          onSubmitEditing={handleSubmit}
          blurOnSubmit
        />
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        {!userId ? (
          <Text style={styles.helperText}>
            Iniciá sesión para poder dejar un comentario y una calificación.
          </Text>
        ) : eligibility === false ? (
          <Text style={styles.helperText}>
            Solo quienes contrataron este servicio pueden dejar una reseña.
          </Text>
        ) : null}
        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit || submitting}
          style={[styles.submitButton, (!canSubmit || submitting) && styles.submitButtonDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Enviar reseña"
          accessibilityHint="Publicar tu comentario y calificación"
        >
          <Text style={styles.submitButtonText}>
            {submitting ? "Enviando..." : "Publicar reseña"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default ServiceReviews;

const styles = StyleSheet.create({
  container: {
    gap: 24,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: TOKENS.color.text,
  },
  loader: {
    paddingVertical: 20,
  },
  emptyMessage: {
    fontSize: 14,
    color: TOKENS.color.sub,
  },
  reviewCard: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  reviewInitials: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  reviewInitialsText: {
    fontSize: 16,
    fontWeight: "600",
    color: TOKENS.color.text,
  },
  reviewContent: {
    flex: 1,
    gap: 6,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  reviewAuthor: {
    fontSize: 14,
    fontWeight: "600",
    color: TOKENS.color.text,
  },
  reviewDate: {
    fontSize: 12,
    color: TOKENS.color.sub,
  },
  reviewComment: {
    fontSize: 14,
    color: TOKENS.color.sub,
    lineHeight: 20,
  },
  separator: {
    height: 16,
  },
  form: {
    gap: 12,
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: TOKENS.radius.lg,
    ...TOKENS.shadow.soft,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: TOKENS.color.text,
  },
  formSubtitle: {
    fontSize: 14,
    color: TOKENS.color.sub,
  },
  input: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: TOKENS.radius.md,
    padding: 12,
    textAlignVertical: "top",
    fontSize: 14,
    color: TOKENS.color.text,
  },
  errorText: {
    fontSize: 12,
    color: "#DC2626",
  },
  helperText: {
    fontSize: 12,
    color: TOKENS.color.sub,
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: TOKENS.color.primary,
    borderRadius: TOKENS.radius.md,
    paddingVertical: 12,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
});
