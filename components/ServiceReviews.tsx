import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useServices } from "@/context/ServicesContext";
import type { Review } from "@/types/services";

import { StarRating } from "./StarRating";

interface ServiceReviewsProps {
  serviceId: string;
  currentUserId?: string;
  currentUserName?: string;
}

export function ServiceReviews({
  serviceId,
  currentUserId,
  currentUserName,
}: ServiceReviewsProps) {
  const {
    reviewsByService,
    fetchServiceReviews,
    addReviewWithRating,
    getReviewStatus,
    isUserEligibleForReview,
  } = useServices();

  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [eligible, setEligible] = useState(false);
  const [eligibilityChecked, setEligibilityChecked] = useState(false);

  const reviews = reviewsByService[serviceId] ?? [];
  const status = getReviewStatus(serviceId);

  useEffect(() => {
    fetchServiceReviews(serviceId).catch(() => {
      // error handled by context state
    });
  }, [fetchServiceReviews, serviceId]);

  useEffect(() => {
    if (!currentUserId) {
      setEligible(false);
      setEligibilityChecked(true);
      return;
    }

    isUserEligibleForReview(serviceId, currentUserId)
      .then((canReview) => {
        setEligible(canReview);
        setEligibilityChecked(true);
      })
      .catch(() => {
        setEligible(false);
        setEligibilityChecked(true);
      });
  }, [currentUserId, isUserEligibleForReview, serviceId]);

  const sortedReviews = useMemo(() =>
    [...reviews].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
  [reviews]);

  const handleSubmit = async () => {
    if (!currentUserId) {
      setFormError("Tenés que iniciar sesión para dejar un comentario");
      return;
    }

    if (comment.trim().length < 6) {
      setFormError("El comentario debe tener al menos 6 caracteres");
      return;
    }

    setFormError(null);
    setSubmitting(true);
    try {
      await addReviewWithRating({
        serviceId,
        userId: currentUserId,
        userName: currentUserName,
        rating,
        comment: comment.trim(),
      });
      setComment("");
      setRating(5);
    } catch (error) {
      if ((error as Error & { code?: string }).code === "NOT_ELIGIBLE") {
        setFormError(
          "Solo los usuarios que contrataron el servicio pueden dejar una reseña"
        );
      } else {
        Alert.alert(
          "Error",
          (error as Error)?.message ??
            "No pudimos guardar tu reseña, intentá nuevamente"
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderReview = ({ item }: { item: Review }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewAuthor}>{item.userName ?? "Usuario"}</Text>
        <Text style={styles.reviewDate}>{formatDate(item.createdAt)}</Text>
      </View>
      <StarRating value={item.rating} readOnly size={18} />
      <Text style={styles.reviewComment}>{item.comment}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Opiniones del servicio</Text>
      {status === "loading" && reviews.length === 0 ? (
        <ActivityIndicator accessibilityLabel="Cargando reseñas" />
      ) : null}
      <FlatList
        data={sortedReviews}
        keyExtractor={(item) => item.id}
        renderItem={renderReview}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          status === "loading" ? null : (
            <Text style={styles.emptyMessage}>
              Aún no hay reseñas. ¡Sé el primero en comentar!
            </Text>
          )
        }
        scrollEnabled={false}
      />

      <View style={styles.form}>
        <Text style={styles.formHeading}>Dejá tu reseña</Text>
        <StarRating value={rating} onChange={setRating} disabled={!eligible} />
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Contanos tu experiencia"
          multiline
          style={[styles.input, !eligible && styles.disabledInput]}
          editable={eligible}
          accessibilityLabel="Comentario"
        />
        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
        {!eligibilityChecked ? (
          <Text style={styles.hint}>Validando si podés dejar una reseña…</Text>
        ) : null}
        {eligibilityChecked && !eligible ? (
          <Text style={styles.hint}>
            Solo podés dejar una reseña si contrataste este servicio.
          </Text>
        ) : null}
        <PressableButton
          onPress={handleSubmit}
          disabled={!eligible || submitting}
          label={submitting ? "Enviando…" : "Publicar reseña"}
        />
      </View>
    </View>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Fecha desconocida";
  }
  return date.toLocaleDateString("es-AR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface PressableButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

function PressableButton({ label, onPress, disabled }: PressableButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={label}
      onPress={() => {
        if (!disabled) {
          onPress();
        }
      }}
      style={({ pressed }) => [
        styles.button,
        disabled ? styles.buttonDisabled : undefined,
        pressed && !disabled ? styles.buttonPressed : undefined,
      ]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingVertical: 16,
  },
  heading: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  separator: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },
  emptyMessage: {
    color: "#6B7280",
    textAlign: "center",
    fontSize: 14,
  },
  reviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  reviewAuthor: {
    fontWeight: "600",
    color: "#111827",
    fontSize: 14,
  },
  reviewDate: {
    color: "#6B7280",
    fontSize: 12,
  },
  reviewComment: {
    color: "#374151",
    fontSize: 14,
    lineHeight: 20,
  },
  form: {
    backgroundColor: "#F9FAFB",
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  formHeading: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  input: {
    minHeight: 100,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    padding: 12,
    textAlignVertical: "top",
    fontSize: 14,
    color: "#111827",
  },
  disabledInput: {
    backgroundColor: "#E5E7EB",
    color: "#9CA3AF",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
  },
  hint: {
    color: "#6B7280",
    fontSize: 12,
  },
  button: {
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    backgroundColor: "#93C5FD",
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
