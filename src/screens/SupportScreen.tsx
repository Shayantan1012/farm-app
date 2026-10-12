import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { api, ApiUser } from "../services/api";
import { Button } from "../components/Button";
import { Field } from "../components/Field";
import { Feedback } from "../components/Feedback";
import { s } from "../styles/appStyles";
export function SupportScreen({ user }: { user: ApiUser }) {
  const [tickets, setTickets] = useState<
      { _id: string; text: string; status: string; resolution?: string }[]
    >([]),
    [text, setText] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const load = async () => {
    try {
      setTickets(
        (await api.request<{ tickets: typeof tickets }>("/tickets")).tickets,
      );
    } catch (e) {
      setError((e as Error).message);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const submit = async (id?: string) => {
    setBusy(true);
    setError("");
    try {
      await api.request(
        id ? "/tickets/" + id + "/resolve" : "/tickets",
        id ? "PATCH" : "POST",
        id ? { resolution: text } : { text },
      );
      setText("");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={{ gap: 16 }}>
      <Text style={s.heading}>Help & support</Text>
      <Feedback error={error} onRetry={load} />
      <Field
        label="Question, issue or resolution"
        value={text}
        onChange={setText}
      />
      <Button
        label="Create support ticket"
        disabled={busy}
        onPress={() => submit()}
      />
      {tickets.map((t) => (
        <View key={t._id} style={s.panel}>
          <Text style={s.cardTitle}>{t.status}</Text>
          <Text style={s.body}>{t.text}</Text>
          {t.resolution && <Text style={s.body}>{t.resolution}</Text>}
          {user.role === "administrator" && t.status !== "Resolved" && (
            <Button
              label="Resolve with above text"
              disabled={busy}
              onPress={() => submit(t._id)}
            />
          )}
        </View>
      ))}
    </View>
  );
}
