import React from "react";
import { View, Text, TextInput } from "react-native";
import { s } from "../styles/appStyles";

export function Field({
  label,
  value,
  onChange,
  numeric = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  numeric?: boolean;
}) {
  return (
    <View style={{ gap: 7, marginBottom: 15 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        style={s.input}
        value={value}
        onChangeText={onChange}
        keyboardType={numeric ? "numeric" : "default"}
      />
    </View>
  );
}
