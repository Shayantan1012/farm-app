import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { LocalizedText as Text } from "../../i18n/I18n";
import { api, ApiError } from "../../services/api";
import { Button } from "../../components/Button";
import { Feedback } from "../../components/Feedback";
import { Field } from "../../components/Field";
import { s } from "../../styles/appStyles";

type Scope = "orders" | "products" | "accounts" | "all" | "sessions" | "audit";
type Preview = {
  counts: Record<string, number>;
  blocked: { products: boolean; accounts: boolean };
};
const actions: { scope: Scope; title: string; detail: string }[] = [
  {
    scope: "orders",
    title: "Delete all orders",
    detail: "Deletes orders, receipts, checkout records, chats, reviews, and order-linked notifications and support tickets. Stock reserved by active orders is returned to products.",
  },
  {
    scope: "products",
    title: "Delete all products",
    detail: "Deletes listings and uploaded photos, empties baskets, and clears saved products. Delete orders first so order history is not broken.",
  },
  {
    scope: "accounts",
    title: "Delete non-admin accounts",
    detail: "Deletes customer, farmer, and delivery partner accounts and their sessions, notifications, and support tickets. Delete orders and products first.",
  },
  {
    scope: "all",
    title: "Reset marketplace data",
    detail: "Deletes all orders, products, photos, and non-admin accounts together. Administrator accounts and the audit log are kept.",
  },
  {
    scope: "sessions",
    title: "Clear all login sessions",
    detail: "Signs everyone out, including you, and stops active delivery location sharing. Accounts and orders remain. You will return to Sign in.",
  },
  {
    scope: "audit",
    title: "Clear audit history",
    detail: "Permanently removes all administrator activity records. The audit list will be empty after this action.",
  },
];
const countLabels: Record<string, string> = {
  orders: "Orders",
  activeOrders: "Active orders",
  products: "Products",
  productImages: "Uploaded photos",
  accounts: "Non-admin accounts",
  administrators: "Administrators kept",
  checkouts: "Checkout records",
  carts: "Baskets",
  messages: "Order messages",
  reviews: "Reviews",
  notifications: "Notifications",
  tickets: "Support tickets",
  sessions: "Login sessions",
  audit: "Audit events",
};
const cleanupError = (reason: unknown) =>
  reason instanceof ApiError && reason.status === 404
    ? "The connected backend does not have the Cleanup API. Restart farm-backend, then refresh this page."
    : (reason as Error).message;

export function AdminCleanup() {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [selected, setSelected] = useState<Scope | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setPreview(await api.request<Preview>("/admin/cleanup"));
    } catch (reason) {
      setError(cleanupError(reason));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void load(); }, []);
  const choose = (scope: Scope) => {
    setSelected(scope);
    setConfirmation("");
    setPassword("");
    setError("");
    setNotice("");
  };
  const clean = async () => {
    if (!selected || busy) return;
    setBusy(true);
    setError("");
    try {
      await api.request("/admin/cleanup", "POST", {
        scope: selected,
        confirmation,
        password,
      });
      if (selected === "sessions") {
        api.clearSession();
        return;
      }
      setNotice("Cleanup completed. Counts below show the remaining records.");
      setSelected(null);
      setConfirmation("");
      setPassword("");
      await load();
    } catch (reason) {
      setError(cleanupError(reason));
    } finally {
      setBusy(false);
    }
  };
  const blocked = selected === "products"
    ? preview?.blocked.products
    : selected === "accounts" && preview?.blocked.accounts;
  const phrase = selected ? `DELETE ${selected.toUpperCase()}` : "";
  return (
    <View style={{ gap: 16 }}>
      <Text style={s.heading}>Database cleanup</Text>
      <Text style={s.body}>
        Review the record counts before deleting. Cleanup is permanent. A
        database backup is needed if you may want these records later.
      </Text>
      <Button secondary label="Refresh cleanup counts" onPress={load} />
      <Feedback loading={loading} error={error} onRetry={load} />
      {!!notice && <Text style={s.badge}>{notice}</Text>}
      {preview && (
        <View style={s.panel}>
          <Text style={s.cardTitle}>Current records</Text>
          {Object.entries(countLabels).map(([key, label]) => (
            <Text key={key} style={s.body}>{label}: {preview.counts[key] || 0}</Text>
          ))}
        </View>
      )}
      {preview && actions.map((action) => (
        <View key={action.scope} style={s.panel}>
          <Text style={s.cardTitle}>{action.title}</Text>
          <Text style={s.body}>{action.detail}</Text>
          <Button
            secondary
            label={action.title}
            disabled={busy || loading}
            onPress={() => choose(action.scope)}
          />
        </View>
      ))}
      {selected && (
        <View style={s.panel}>
          <Text style={s.cardTitle}>Confirm {actions.find((a) => a.scope === selected)?.title}</Text>
          {blocked && (
            <Text accessibilityRole="alert" style={s.body}>
              Delete {selected === "products" ? "orders" : "orders and products"} first,
              or use Reset marketplace data.
            </Text>
          )}
          <Text style={s.body}>Type {phrase} and enter your administrator password.</Text>
          <Field label="Confirmation phrase" value={confirmation} onChange={setConfirmation} />
          <Field label="Administrator password" value={password} onChange={setPassword} secure />
          <Button
            label="Confirm permanent deletion"
            disabled={busy || !!blocked || confirmation !== phrase || !password}
            onPress={clean}
          />
          <Button secondary label="Cancel cleanup" disabled={busy} onPress={() => setSelected(null)} />
        </View>
      )}
    </View>
  );
}
