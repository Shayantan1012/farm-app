import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { LocalizedText as Text } from "../../i18n/I18n";
import { api, ApiProduct } from "../../services/api";
import { Button } from "../../components/Button";
import { Feedback } from "../../components/Feedback";
import { ProductPhoto } from "../../components/ProductPhoto";
import { Pagination } from "../../components/admin/Pagination";
import { s } from "../../styles/appStyles";
type Product = ApiProduct & { deleted: boolean };
type Review = {
  _id: string;
  product: string;
  consumer: string;
  order: string;
  rating: number;
  text: string;
  reply?: string;
};
type Event = {
  _id: string;
  actor: string;
  action: string;
  target: string;
  createdAt: string;
};
export function AdminRecords({
  kind,
}: {
  kind: "products" | "reviews" | "audit";
}) {
  const [products, setProducts] = useState<Product[]>([]),
    [reviews, setReviews] = useState<Review[]>([]),
    [events, setEvents] = useState<Event[]>([]);
  const [page, setPage] = useState(1),
    [total, setTotal] = useState(0),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false);
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const r = await api.request<{
        products?: Product[];
        reviews?: Review[];
        events?: Event[];
        total: number;
      }>("/admin/" + kind + "?page=" + page);
      setProducts(r.products || []);
      setReviews(r.reviews || []);
      setEvents(r.events || []);
      setTotal(r.total);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, [page, kind]);
  const toggle = async (p: Product) => {
    setBusy(true);
    try {
      await api.pauseProduct(p.id, !p.active);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={{ gap: 12 }}>
      <Button label="Refresh records" secondary onPress={load} />
      <Feedback loading={loading} error={error} onRetry={load} />
      {!loading && !total && <Text style={s.body}>No records yet.</Text>}
      {products.map((p) => (
        <View key={p.id} style={s.panel}>
          <ProductPhoto image={p.image} style={{ height: 140 }} />
          <Text style={s.cardTitle}>
            {p.name} · {p.farm}
          </Text>
          <Text style={s.body}>
            ₹{p.price}/kg · Stock {p.stock} kg · Minimum {p.minOrder} kg
          </Text>
          <Text style={s.body}>
            {p.category} · {p.method} · {p.location}
          </Text>
          <Text style={s.muted}>
            Product {p.id} · Farmer {p.producer}
          </Text>
          <Text style={s.muted}>
            Harvest {p.harvest} · Expiry {p.expiry || "Not provided"}
          </Text>
          <Text style={s.badge}>
            {p.deleted ? "Deleted" : p.active ? "Active" : "Paused"}
          </Text>
          {!p.deleted && (
            <Button
              secondary
              disabled={busy}
              label={p.active ? "Pause listing" : "Reactivate listing"}
              onPress={() => toggle(p)}
            />
          )}
        </View>
      ))}
      {reviews.map((r) => (
        <View key={r._id} style={s.panel}>
          <Text style={s.cardTitle}>{r.rating}/5</Text>
          <Text style={s.body}>{r.text}</Text>
          <Text style={s.muted}>
            Consumer {r.consumer} · Product {r.product} · Order {r.order}
          </Text>
          {r.reply && <Text style={s.body}>Farmer reply: {r.reply}</Text>}
        </View>
      ))}
      {events.map((e) => (
        <View key={e._id} style={s.panel}>
          <Text style={s.cardTitle}>{e.action}</Text>
          <Text style={s.body}>{new Date(e.createdAt).toLocaleString()}</Text>
          <Text style={s.muted}>
            Actor {e.actor} · Target {e.target}
          </Text>
        </View>
      ))}
      <Pagination page={page} total={total} onChange={setPage} />
    </View>
  );
}
