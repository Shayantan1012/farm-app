import React from "react";
import { View, Pressable } from "react-native";
import { LocalizedText as Text } from "../i18n/I18n";
import { s } from "../styles/appStyles";
import { useI18n } from "../i18n/I18n";

export function Chips({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const { t } = useI18n();
  return (
    <View style={s.wrap}>
      {options.map((o) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t(o)}
          accessibilityState={{ selected: o === value }}
          key={o}
          onPress={() => onChange(o)}
          style={[s.chip, o === value && s.chipActive]}
        >
          <Text style={[s.chipText, o === value && { color: "#fff" }]}>
            {o}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
