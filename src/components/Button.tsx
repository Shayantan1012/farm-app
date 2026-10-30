import React from "react";
import { Pressable } from "react-native";
import { LocalizedText as Text } from "../i18n/I18n";
import { green } from "../theme/colors";
import { s } from "../styles/appStyles";
import { useI18n } from "../i18n/I18n";

export function Button({
  label,
  onPress,
  secondary = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t(label)}
      onPress={onPress}
      disabled={disabled}
      accessibilityState={{ disabled }}
      style={[s.button, secondary && s.secondary, disabled && { opacity: 0.5 }]}
    >
      <Text style={[s.buttonText, secondary && { color: green }]}>{label}</Text>
    </Pressable>
  );
}
