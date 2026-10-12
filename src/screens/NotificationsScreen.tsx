import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { api } from "../services/api";
import { Button } from "../components/Button";
import { Feedback } from "../components/Feedback";
import { s } from "../styles/appStyles";
export function NotificationsScreen() {
  const [items, setItems] = useState<
      { _id: string; text: string; read: boolean }[]
    >([]),
    [error, setError] = useState("");
  const load = async () => {
    setError("");
    try {
      setItems(
        (
          await api.request<{ notifications: typeof items }>(
            "/users/me/notifications",
          )
        ).notifications,
      );
    } catch (e) {
      setError((e as Error).message);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  return (
    <View style={{ gap: 16 }}>
      <Text style={s.heading}>Notifications</Text>
      <Feedback error={error} onRetry={load} />
      {!items.length && !error && (
        <Text style={s.body}>No notifications to display.</Text>
      )}
      {items.map((n) => (
        <View key={n._id} style={s.panel}>
          <Text style={s.body}>{n.text}</Text>
          {!n.read && (
            <Button
              label="Mark as read"
              secondary
              onPress={() => {
                void api
                  .request(
                    "/users/me/notifications/" + n._id + "/read",
                    "PATCH",
                  )
                  .then(load)
                  .catch((e) => setError(e.message));
              }}
            />
          )}
        </View>
      ))}
    </View>
  );
}
