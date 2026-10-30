import React from "react";
import { View } from "react-native";
import { LocalizedText as Text, useI18n } from "../i18n/I18n";
import { Button } from "./Button";
import { DateFieldProps } from "./DateField.types";
import { s } from "../styles/appStyles";

export function DateField({
  label,
  value,
  onChange,
  mode = "date",
  minimum,
  maximum,
  optional = false,
}: DateFieldProps) {
  const { t } = useI18n();
  return (
    <View style={{ gap: 7, marginBottom: 15 }}>
      <Text style={s.label}>{label}</Text>
      <input
        aria-label={t(label)}
        type={mode === "date" ? "date" : "datetime-local"}
        value={value}
        min={minimum}
        max={maximum}
        onChange={(event) => onChange(event.currentTarget.value)}
        style={{
          width: "100%",
          boxSizing: "border-box",
          border: "1px solid #dbe3d5",
          borderRadius: 10,
          padding: "14px 15px",
          minHeight: 50,
          fontSize: 16,
          color: "#203b2c",
          background: "#fff",
        }}
      />
      {optional && !!value && (
        <Button secondary label="Clear date" onPress={() => onChange("")} />
      )}
    </View>
  );
}
