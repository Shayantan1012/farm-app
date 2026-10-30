import React, { useState } from "react";
import { Platform, Pressable, View } from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { LocalizedText as Text, useI18n } from "../i18n/I18n";
import { Button } from "./Button";
import { Icon } from "./Icon";
import {
  DateFieldProps,
  localDateTimeValue,
  localDateValue,
  pickerDate,
} from "./DateField.types";
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
  const [showing, setShowing] = useState<"date" | "time" | null>(null),
    [draft, setDraft] = useState(() => pickerDate(value, mode));
  const minDate = minimum ? pickerDate(minimum, mode) : undefined,
    maxDate = maximum ? pickerDate(maximum, mode) : undefined;

  const commit = (date: Date) => {
    onChange(mode === "date" ? localDateValue(date) : localDateTimeValue(date));
    setShowing(null);
  };
  const change = (event: DateTimePickerEvent, selected?: Date) => {
    if (event.type === "dismissed" || !selected) {
      setShowing(null);
      return;
    }
    setDraft(selected);
    if (Platform.OS === "ios") return;
    if (showing === "date" && mode === "datetime") {
      setShowing(null);
      setTimeout(() => setShowing("time"), 0);
    } else commit(selected);
  };
  const confirmIOS = () => {
    if (showing === "date" && mode === "datetime") setShowing("time");
    else commit(draft);
  };
  const display = value
    ? mode === "date"
      ? pickerDate(value, mode).toLocaleDateString()
      : pickerDate(value, mode).toLocaleString([], {
          dateStyle: "medium",
          timeStyle: "short",
        })
    : t(mode === "date" ? "Select date" : "Select date and time");

  return (
    <View style={{ gap: 7, marginBottom: 15 }}>
      <Text style={s.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t(label)}
        onPress={() => {
          setDraft(pickerDate(value, mode));
          setShowing("date");
        }}
        style={[s.input, s.between]}
      >
        <Text style={value ? s.body : s.muted}>{display}</Text>
        <Icon name="calendar-outline" />
      </Pressable>
      {!!showing && (
        <View style={s.panel}>
          <DateTimePicker
            value={draft}
            mode={showing}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            minimumDate={showing === "date" ? minDate : undefined}
            maximumDate={showing === "date" ? maxDate : undefined}
            onChange={change}
          />
          {Platform.OS === "ios" && (
            <Button
              label={
                showing === "date" && mode === "datetime"
                  ? "Next: choose time"
                  : "Confirm date"
              }
              onPress={confirmIOS}
            />
          )}
        </View>
      )}
      {optional && !!value && (
        <Button secondary label="Clear date" onPress={() => onChange("")} />
      )}
    </View>
  );
}
