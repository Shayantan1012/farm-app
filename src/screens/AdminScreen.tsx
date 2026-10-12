import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { api, ApiUser } from "../services/api";
import { Button } from "../components/Button";
import { Feedback } from "../components/Feedback";
import { s } from "../styles/appStyles";
export function AdminScreen() {
  const [users, setUsers] = useState<ApiUser[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [page, setPage] = useState(1),
    [total, setTotal] = useState(0);
  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const r = await api.request<{ users: ApiUser[]; total: number }>(
        "/admin/users?page=" + page,
      );
      setUsers(r.users);
      setTotal(r.total);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, [page]);
  const change = async (u: ApiUser, body: object) => {
    setBusy(true);
    setError("");
    try {
      await api.request("/admin/users/" + u.id, "PATCH", body);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={{ gap: 16 }}>
      <Text style={s.heading}>Farmer & user management</Text>
      <Button secondary label="Refresh users" onPress={load} />
      <Feedback loading={loading} error={error} onRetry={load} />
      {users.map((u) => (
        <View style={s.panel} key={u.id}>
          <Text style={s.cardTitle}>{u.farmName || u.name}</Text>
          <Text style={s.body}>
            {u.email} · {u.role} ·{" "}
            {u.verified ? "Email verified" : "Email unverified"}
          </Text>
          <Text style={s.badge}>
            {u.approved ? "Approved" : "Awaiting approval"}
          </Text>
          {["producer", "delivery"].includes(u.role) && (
            <Button
              label={u.approved ? "Revoke approval" : "Approve account"}
              disabled={busy || !u.verified}
              onPress={() => change(u, { approved: !u.approved })}
            />
          )}{" "}
          {u.role !== "administrator" && (
            <Button
              secondary
              label={u.active ? "Suspend account" : "Reactivate account"}
              disabled={busy}
              onPress={() => change(u, { active: !u.active })}
            />
          )}
        </View>
      ))}
      <View style={s.wrap}>
        {page > 1 && (
          <Button label="Previous" onPress={() => setPage((p) => p - 1)} />
        )}
        <Text style={s.muted}>Page {page}</Text>
        {page * 20 < total && (
          <Button label="Next" onPress={() => setPage((p) => p + 1)} />
        )}
      </View>
    </View>
  );
}
