import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Button } from "./Button";
import { s } from "../styles/appStyles";
export function Feedback({
  loading,
  error,
  empty,
  onRetry,
}: {
  loading?: boolean;
  error?: string;
  empty?: string;
  onRetry?: () => void;
}) {
  if (loading)
    return (
      <View style={s.empty}>
        <ActivityIndicator />
        <Text style={s.muted}>Loading from the farm server…</Text>
      </View>
    );
  if (error)
    return (
      <View accessibilityRole="alert" style={s.panel}>
        <Text style={{ color: "#A1362D" }}>{error}</Text>
        {onRetry && <Button label="Retry" onPress={onRetry} />}
      </View>
    );
  if (empty)
    return (
      <View style={s.empty}>
        <Text style={s.cardTitle}>{empty}</Text>
      </View>
    );
  return null;
}
