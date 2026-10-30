import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { api } from "../../services/api";
import { AdministratorForm } from "../../components/admin/AdministratorForm";
import { Button } from "../../components/Button";
import { Feedback } from "../../components/Feedback";
import { s } from "../../styles/appStyles";
export function AdminSetupScreen({ onSignIn }: { onSignIn: () => void }) {
  const [available, setAvailable] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [created, setCreated] = useState(false);
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setAvailable(
        (await api.request<{ available: boolean }>("/auth/admin-setup"))
          .available,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  return (
    <View style={{ gap: 16 }}>
      <Feedback loading={loading} error={error} onRetry={load} />
      {!loading &&
        !error &&
        (available && !created ? (
          <AdministratorForm
            first
            onCreated={() => {
              setCreated(true);
              setAvailable(false);
            }}
          />
        ) : (
          <View style={s.panel}>
            <Text style={s.heading}>
              {created
                ? "Administrator created"
                : "Administrator setup is closed"}
            </Text>
            <Text style={s.body}>
              {created
                ? "Sign in using the email and password you just entered."
                : "An administrator already exists. Sign in, or ask an existing administrator to grant your account access."}
            </Text>
          </View>
        ))}
      <Button secondary label="Back to sign in" onPress={onSignIn} />
    </View>
  );
}
