import React from "react";
import { Pressable, View } from "react-native";
import { LocalizedText as Text } from "../i18n/I18n";
import { green, harvest } from "../theme/colors";
import { s } from "../styles/appStyles";
import { useI18n } from "../i18n/I18n";

export function Button({
  label,
  onPress,
  secondary = false,
  disabled = false,
  badge = 0,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  badge?: number;
}) {
  const { t } = useI18n();
  const visibleBadge = Math.max(0, Math.floor(badge));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        visibleBadge > 0
          ? `${t(label)}, ${visibleBadge} ${visibleBadge === 1 ? "item" : "items"}`
          : t(label)
      }
      onPress={onPress}
      disabled={disabled}
      accessibilityState={{ disabled }}
      style={[
        s.button,
        { position: "relative" },
        secondary && s.secondary,
        disabled && { opacity: 0.5 },
      ]}
    >
      <Text style={[s.buttonText, secondary && { color: green }]}>{label}</Text>
      {visibleBadge > 0 && (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{
            position: "absolute",
            top: -10,
            right: -10,
            minWidth: 24,
            height: 24,
            paddingHorizontal: 5,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: "#FFFFFF",
            backgroundColor: harvest,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "800" }}>
            {visibleBadge > 99 ? "99+" : visibleBadge}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
