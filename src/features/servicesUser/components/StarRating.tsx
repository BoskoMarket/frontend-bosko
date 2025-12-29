import React, { useCallback } from "react";
import { AccessibilityActionEvent, Pressable, StyleSheet, Text, View } from "react-native";

type StarRatingProps = {
  value: number;
  onChange?: (value: number) => void;
  max?: number;
  size?: number;
  editable?: boolean;
  label?: string;
};

export const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  max = 5,
  size = 24,
  editable = true,
  label = "Calificación",
}) => {
  const roundedValue = Math.round(value);

  const handleAccessibilityAction = useCallback(
    (event: AccessibilityActionEvent) => {
      if (!editable || !onChange) {
        return;
      }
      if (event.nativeEvent.actionName === "increment") {
        onChange(Math.min(max, Math.max(1, roundedValue + 1)));
      }
      if (event.nativeEvent.actionName === "decrement") {
        onChange(Math.max(1, roundedValue - 1));
      }
    },
    [editable, max, onChange, roundedValue]
  );

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole={editable && onChange ? "adjustable" : "image"}
      accessibilityLabel={label}
      accessibilityHint={
        editable && onChange
          ? "Desliza hacia arriba o abajo para ajustar la cantidad de estrellas"
          : undefined
      }
      accessibilityValue={{ min: 0, max, now: roundedValue }}
      onAccessibilityAction={
        editable && onChange ? handleAccessibilityAction : undefined
      }
      accessibilityActions={
        editable && onChange
          ? [
              { name: "increment", label: "Incrementar" },
              { name: "decrement", label: "Disminuir" },
            ]
          : undefined
      }
    >
      {Array.from({ length: max }).map((_, index) => {
        const starValue = index + 1;
        const filled = starValue <= roundedValue;
        const isInteractive = editable && Boolean(onChange);
        const content = (
          <Text
            style={[
              styles.star,
              { fontSize: size },
              filled ? styles.starFilled : styles.starEmpty,
            ]}
          >
            {filled ? "★" : "☆"}
          </Text>
        );

        if (!isInteractive) {
          return (
            <View
              key={starValue}
              style={styles.starWrapper}
              accessible={false}
            >
              {content}
            </View>
          );
        }

        return (
          <Pressable
            key={starValue}
            onPress={() => onChange?.(starValue)}
            accessibilityRole="button"
            accessibilityState={{ selected: filled }}
            accessibilityLabel={`${starValue} estrella${starValue > 1 ? "s" : ""}`}
            accessibilityHint={`Seleccionar ${starValue} estrella${starValue > 1 ? "s" : ""}`}
            style={styles.starWrapper}
          >
            {content}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  starWrapper: {
    padding: 2,
  },
  star: {
    color: "#F59E0B",
  },
  starFilled: {
    color: "#F59E0B",
  },
  starEmpty: {
    color: "#D1D5DB",
  },
});
