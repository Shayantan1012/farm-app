import { Pagination } from "../components/admin/Pagination";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { LocalizedText as Text } from "../i18n/I18n";
import { api, ApiUser } from "../services/api";
import { Button } from "../components/Button";
import { Field } from "../components/Field";
import { Feedback } from "../components/Feedback";
import { s } from "../styles/appStyles";
export function SupportScreen({ user }: { user: ApiUser }) {
  const [tickets, setTickets] = useState<
      {
        _id: string;
        text: string;
        status: string;
        resolution?: string;
        user: string;
        order?: string;
        category: string;
        createdAt: string;
      }[]
    >([]),
    [text, setText] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1),
    [total, setTotal] = useState(0);
  const load = async () => {
    try {
      const result = await api.request<{
        tickets: typeof tickets;
        total: number;
      }>("/tickets?page=" + page);
      setTickets(result.tickets);
      setTotal(result.total);
    } catch (e) {
      setError((e as Error).message);
    }
  };
  useEffect(() => {
    void load();
  }, [page]);
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
      <Button secondary label="Refresh tickets" onPress={load} />
      {tickets.map((t) => (
        <View key={t._id} style={s.panel}>
          <Text style={s.cardTitle}>{t.status}</Text>
          <Text style={s.body}>{t.text}</Text>
          {user.role === "administrator" && (
            <Text style={s.muted}>
              Ticket {t._id} ? User {t.user} ? {t.category} ?{" "}
              {new Date(t.createdAt).toLocaleString()}
              {t.order ? " ? Order " + t.order : ""}
            </Text>
          )}
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
      <Pagination page={page} total={total} onChange={setPage} />
    </View>
  );
}
