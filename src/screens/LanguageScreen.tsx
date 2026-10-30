import React, { useState } from "react";
import { View, Text } from "react-native";
import { Language, languages, useI18n } from "../i18n/I18n";
import { Button } from "../components/Button";
import { s } from "../styles/appStyles";
import { Feedback } from "../components/Feedback";

export function LanguageScreen({
  onChange,
}: {
  onChange: (language: Language) => Promise<void>;
}) {
  const { language, t } = useI18n();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const choose = async (next: Language) => {
    if (busy || next === language) return;
    setBusy(true);
    setError("");
    try {
      await onChange(next);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={{ gap: 14 }}>
      <Text style={s.heading}>{t("Choose your language")}</Text>
      <Text style={s.body}>
        {t("You can change the app language at any time. Your choice is saved on this device and in your account after sign-in.")}
      </Text>
      <Feedback error={error} />
      {languages.map((option) => (
        <View key={option.code} style={s.panel}>
          <Text style={s.cardTitle}>{option.nativeName}</Text>
          <Text style={s.muted}>{option.englishName}</Text>
          <Button
            label={option.code === language ? "Selected" : "Use this language"}
            secondary={option.code !== language}
            disabled={busy || option.code === language}
            onPress={() => void choose(option.code)}
          />
        </View>
      ))}
      <Text style={s.muted}>
        {t("English is used as a fallback when a new message has not been translated yet.")}
      </Text>
    </View>
  );
}
