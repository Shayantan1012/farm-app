import React from "react";
import { View, TextInput } from "react-native";
import { LocalizedText as Text } from "../i18n/I18n";
import { s } from "../styles/appStyles";
import { useI18n } from "../i18n/I18n";

export function Field({
  label,
  value,
  onChange,
  numeric = false,
  secure = false,
  phone = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  numeric?: boolean;
  secure?: boolean;
  phone?: boolean;
}) {
  const { t } = useI18n();
  return (
    <View style={{ gap: 7, marginBottom: 15 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={t(label)}
        style={s.input}
        value={value}
        onChangeText={onChange}
        keyboardType={phone ? "phone-pad" : numeric ? "numeric" : "default"}
        autoComplete={phone ? "tel" : undefined}
        secureTextEntry={secure}
        autoCapitalize={
          secure || label.toLowerCase().includes("email") ? "none" : "sentences"
        }
      />
    </View>
  );
}
