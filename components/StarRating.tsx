import { memo, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface StarRatingProps {
  value: number;
  onChange?: (nextValue: number) => void;
  max?: number;
  size?: number;
  readOnly?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
}

const DEFAULT_MAX = 5;

function StarRatingComponent({
  value,
  onChange,
  max = DEFAULT_MAX,
  size = 24,
  readOnly = false,
  disabled = false,
  accessibilityLabel,
}: StarRatingProps) {
  const clampedValue = Math.max(0, Math.min(max, Math.round(value)));

  const stars = useMemo(
    () =>
      Array.from({ length: max }, (_, index) => {
        const starValue = index + 1;
        const filled = starValue <= clampedValue;
        return { starValue, filled };
      }),
    [max, clampedValue]
  );

  return (
    <View
      style={styles.container}
      accessibilityRole={readOnly ? undefined : "adjustable"}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={
        readOnly
          ? undefined
          : "Desliza o toca una estrella para ajustar la calificación"
      }
    >
      {stars.map(({ starValue, filled }) => (
        <Pressable
          key={starValue}
          style={[styles.starButton, { opacity: disabled ? 0.5 : 1 }]}
          onPress={() => !readOnly && !disabled && onChange?.(starValue)}
          disabled={readOnly || disabled}
          accessibilityRole="button"
          accessibilityState={{ selected: filled }}
          accessibilityLabel={`Calificar con ${starValue} estrella${
            starValue === 1 ? "" : "s"
          }`}
        >
          <Text style={[styles.star, { fontSize: size }]}>{filled ? "★" : "☆"}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export const StarRating = memo(StarRatingComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  starButton: {
    padding: 2,
  },
  star: {
    color: "#F59E0B",
    textShadowColor: "rgba(0,0,0,0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});
