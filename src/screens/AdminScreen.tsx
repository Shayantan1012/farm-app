import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { api, ApiUser } from "../services/api";
import { Button } from "../components/Button";
import { Feedback } from "../components/Feedback";
import { s } from "../styles/appStyles";
export function AdminScreen({
  currentUser,
  role,
}: {
  currentUser: ApiUser;
  role?: string;
}) {
  const [pending, setPending] = useState<ApiUser | null>(null);
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
        "/admin/users?page=" + page + (role ? "&role=" + role : ""),
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
  }, [page, role]);
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
  const access = async () => {
    if (!pending) return;
    setBusy(true);
    setError("");
    try {
      await api.request(
        "/admin/users/" + pending.id + "/admin-access",
        "PATCH",
        { grant: pending.role !== "administrator" },
      );
      setPending(null);
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
      {pending && (
        <View style={s.panel}>
          <Text style={s.cardTitle}>
            {pending.role === "administrator" ? "Remove" : "Grant"}{" "}
            administrator access for {pending.email}?
          </Text>
          <Text style={s.body}>
            Administrators can view all business records and manage other
            accounts. Granting access changes this account to the administrator
            role. Removing access restores its previous role. The person must
            sign in again.
          </Text>
          <Button
            label="Confirm access change"
            disabled={busy}
            onPress={access}
          />
          <Button
            secondary
            label="Cancel access change"
            disabled={busy}
            onPress={() => setPending(null)}
          />
        </View>
      )}
      {!loading && !users.length && (
        <Text style={s.body}>No accounts found.</Text>
      )}
      {users.map((u) => (
        <View style={s.panel} key={u.id}>
          <Text style={s.cardTitle}>{u.farmName || u.name}</Text>
          <Text style={s.body}>
            {u.email} · {u.role} ·{" "}
            {u.verified ? "Email verified" : "Email unverified"}
          </Text>
          <Text style={s.body}>
            {u.name} ? {u.phone || "No phone number"}
          </Text>
          <Text style={s.body}>
            {[u.address, u.city, u.state, u.postalCode]
              .filter(Boolean)
              .join(", ") || "No address provided"}
          </Text>
          <Text style={s.muted}>
            Account {u.id} ? {u.active ? "Active" : "Suspended"}
            {u.deletionRequestedAt ? " ? Deletion requested" : ""}
          </Text>
          {u.id !== currentUser.id && (
            <Button
              secondary
              disabled={busy || !u.active || !u.verified}
              label={
                u.role === "administrator"
                  ? "Remove administrator access"
                  : "Grant administrator access"
              }
              onPress={() => setPending(u)}
            />
          )}
          <Text style={s.badge}>
            {u.approved ? "Approved" : "Awaiting approval"}
          </Text>
          {["producer", "delivery"].includes(u.role) && (
            <Button
              label={u.approved ? "Revoke approval" : "Approve account"}
              disabled={busy || !u.verified}
              onPress={() => change(u, { approved: !u.approved })}
            />
          )}
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
