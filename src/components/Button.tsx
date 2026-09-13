import React from "react";
import { Pressable, Text } from "react-native";
import { green } from "../theme/colors";
import { s } from "../styles/appStyles";

export function Button({
  label,
  onPress,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[s.button, secondary && s.secondary]}
    >
      <Text style={[s.buttonText, secondary && { color: green }]}>{label}</Text>
    </Pressable>
  );
}
