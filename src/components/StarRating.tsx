import React from "react";
import { Pressable, View } from "react-native";
import { LocalizedText as Text } from "../i18n/I18n";
import { harvest, muted } from "../theme/colors";
import { s } from "../styles/appStyles";
import { Icon } from "./Icon";

export function StarRating({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={s.label}>{label}</Text>
      <View style={s.ratingRow}>
        {[1, 2, 3, 4, 5].map((rating) => (
          <Pressable
            key={rating}
            accessibilityRole="button"
            accessibilityLabel={`${rating} ${rating === 1 ? "star" : "stars"}`}
            accessibilityState={{ selected: value === rating, disabled }}
            disabled={disabled}
            onPress={() => onChange(rating)}
            style={({ pressed }) => [
              s.ratingStar,
              rating <= value && s.ratingStarSelected,
              pressed && { opacity: 0.65 },
              disabled && { opacity: 0.5 },
            ]}
          >
            <Icon
              name={rating <= value ? "star" : "star-outline"}
              size={28}
              color={rating <= value ? harvest : muted}
            />
          </Pressable>
        ))}
      </View>
      <Text style={s.muted}>
        {value
          ? `${value} of 5 stars selected`
          : "Tap a star to rate this product"}
      </Text>
    </View>
  );
}
