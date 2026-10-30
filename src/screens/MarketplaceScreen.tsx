import React, { useEffect, useState } from "react";
import { View, Modal, ScrollView } from "react-native";
import { LocalizedText as Text } from "../i18n/I18n";
import { api, ApiProduct, ApiUser } from "../services/api";
import { ProductCard } from "../components/ProductCard";
import { ProductPhoto } from "../components/ProductPhoto";
import { Field } from "../components/Field";
import { Chips } from "../components/Chips";
import { Button } from "../components/Button";
import { Feedback } from "../components/Feedback";
import { s } from "../styles/appStyles";
export function MarketplaceScreen({
  user,
  savedOnly = false,
  onAdd,
  onSignIn,
  onUserChanged,
}: {
  user: ApiUser | null;
  savedOnly?: boolean;
  onAdd: (p: ApiProduct) => Promise<void>;
  onSignIn: () => void;
  onUserChanged: () => Promise<void>;
}) {
  const [items, setItems] = useState<ApiProduct[]>([]),
    [query, setQuery] = useState(""),
    [search, setSearch] = useState(""),
    [category, setCategory] = useState("All produce"),
    [sort, setSort] = useState("Newest"),
    [method, setMethod] = useState("All methods"),
    [page, setPage] = useState(1),
    [total, setTotal] = useState(0),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [actionError, setActionError] = useState(""),
    [selected, setSelected] = useState<ApiProduct | null>(null),
    [reviews, setReviews] = useState<{ text: string; rating: number }[]>([]),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(query);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let current = true;
    setLoading(true);
    setError("");
    const q = new URLSearchParams({
      page: String(page),
      limit: "20",
      q: search,
      sort:
        sort === "Lowest price"
          ? "priceAsc"
          : sort === "Highest price"
            ? "priceDesc"
            : sort === "Freshest"
              ? "freshest"
              : "newest",
    });
    if (category !== "All produce") q.set("category", category);
    if (method !== "All methods") q.set("method", method);
    const request = savedOnly
      ? api.request<{ products: ApiProduct[]; total?: number }>(
          "/users/me/favorites?page=" + page + "&limit=20",
        )
      : api.products(q.toString());
    request
      .then((r) => {
        if (current) {
          setItems(r.products);
          setTotal(r.total ?? r.products.length);
        }
      })
      .catch((e) => {
        if (current) setError(e.message);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [
    search,
    category,
    sort,
    method,
    page,
    savedOnly,
    user?.favorites.join(","),
    refresh,
  ]);
  const retry = () => setRefresh((v) => v + 1);
  const act = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setActionError("");
    try {
      await fn();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const save = (p: ApiProduct) => {
    if (!user) return onSignIn();
    void act(async () => {
      await api.request(
        "/users/me/favorites/" + p.id,
        user.favorites.includes(p.id) ? "DELETE" : "PUT",
      );
      await onUserChanged();
    });
  };
  const details = async (p: ApiProduct) => {
    setSelected(p);
    setReviews([]);
    try {
      const r = await api.request<{
        reviews: { text: string; rating: number }[];
      }>("/products/" + p.id + "/reviews");
      setReviews(r.reviews);
    } catch {
      /* Product details remain usable when reviews are unavailable. */
    }
  };
  return (
    <View style={{ gap: 18 }}>
      {!savedOnly && (
        <View style={[s.hero, { minHeight: 220 }]}>
          <View style={s.heroContent}>
            <Text style={s.heroEyebrow}>DIRECT FROM THE GROWER</Text>
            <Text style={[s.heroTitle, { fontSize: 34 }]}>
              From their farm.{"\n"}To your table.
            </Text>
            <Text style={s.heroSub}>
              Discover produce listed by farmers in your community.
            </Text>
          </View>
        </View>
      )}
      <Text style={s.heading}>
        {savedOnly ? "Saved products" : "Fresh from our farmers"}
      </Text>
      {!savedOnly && (
        <>
          <Field
            label="Search products, farms or locations"
            value={query}
            onChange={setQuery}
          />
          <Chips
            options={[
              "All produce",
              "Vegetables",
              "Leafy greens",
              "Roots & tubers",
            ]}
            value={category}
            onChange={(v) => {
              setCategory(v);
              setPage(1);
            }}
          />
          <Chips
            options={[
              "All methods",
              "Organic",
              "Naturally grown",
              "Conventionally grown",
            ]}
            value={method}
            onChange={(v) => {
              setMethod(v);
              setPage(1);
            }}
          />
          <Chips
            options={["Newest", "Lowest price", "Highest price", "Freshest"]}
            value={sort}
            onChange={(v) => {
              setSort(v);
              setPage(1);
            }}
          />
        </>
      )}
      <Button secondary label="Refresh marketplace" onPress={retry} />
      <Feedback
        loading={loading}
        error={error}
        onRetry={retry}
        empty={
          !items.length
            ? savedOnly
              ? "No saved products yet."
              : user?.role === "producer"
                ? "No available products. A listing is hidden when it is paused, out of stock, expired, or its farmer is not approved. Check My products for its status."
                : "No products listed yet. Farmers can sign in to add their harvest."
            : undefined
        }
      />
      <Feedback error={actionError} />
      {busy && <Text style={s.muted}>Updating…</Text>}
      {!loading && !error && (
        <View style={s.productGrid}>
          {items.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onView={() => void details(p)}
              saved={user?.favorites.includes(p.id)}
              onSave={() => save(p)}
              onAdd={
                !user || user.role === "consumer"
                  ? () => {
                      if (!user) return onSignIn();
                      void act(() => onAdd(p));
                    }
                  : undefined
              }
            />
          ))}
        </View>
      )}
      <View style={s.wrap}>
        {page > 1 && (
          <Button
            label="Previous page"
            secondary
            onPress={() => setPage((p) => p - 1)}
          />
        )}
        <Text style={s.muted}>
          {total} products · Page {page}
        </Text>
        {page * 20 < total && (
          <Button
            label="Next page"
            secondary
            onPress={() => setPage((p) => p + 1)}
          />
        )}
      </View>
      <Modal
        visible={!!selected}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <View style={s.scrim}>
          <View style={[s.modal, { maxWidth: 550 }]}>
            <ScrollView>
              {selected && (
                <View style={{ gap: 14 }}>
                  <ProductPhoto image={selected.image} />
                  <Text style={s.heading}>{selected.name}</Text>
                  <Text style={s.body}>
                    {selected.farm} · {selected.location}
                  </Text>
                  <Text style={s.price}>₹{selected.price} / kg</Text>
                  <Text style={s.body}>
                    {selected.stock} kg · Minimum {selected.minOrder} kg
                  </Text>
                  <Text style={s.body}>
                    {selected.method} · Harvested {selected.harvest}
                  </Text>
                  <Text style={s.body}>
                    Available for {selected.deliveryOptions.join(" & ")}
                  </Text>
                  {!!selected.expiry && (
                    <Text style={s.muted}>
                      Available until {selected.expiry}
                    </Text>
                  )}
                  <Text style={s.cardTitle}>Customer reviews</Text>
                  {reviews.length ? (
                    reviews.map((r, i) => (
                      <Text key={i} style={s.body}>
                        {r.rating} / 5 · {r.text}
                      </Text>
                    ))
                  ) : (
                    <Text style={s.muted}>No reviews to display.</Text>
                  )}
                  <Button
                    secondary
                    label="Close details"
                    onPress={() => setSelected(null)}
                  />
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
