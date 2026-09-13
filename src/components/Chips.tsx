import React from "react";
import { View, Text, Pressable } from "react-native";
import { s } from "../styles/appStyles";

export function Chips({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={s.wrap}>
      {options.map((o) => (
        <Pressable
          accessibilityRole="button"
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
