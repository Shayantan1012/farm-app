import { LocationPicker } from "../components/maps/LocationPicker";
import { Point } from "../components/maps/types";
import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { LocalizedText as Text } from "../i18n/I18n";
import { api, ApiProduct, CheckoutInput } from "../services/api";
import { Button } from "../components/Button";
import { Field } from "../components/Field";
import { DateField } from "../components/DateField";
import { localDateTimeValue } from "../components/DateField.types";
import { Chips } from "../components/Chips";
import { Feedback } from "../components/Feedback";
import { ProductPhoto } from "../components/ProductPhoto";
import { s } from "../styles/appStyles";
export type CartLine = { product: ApiProduct | null; quantity: number };
export function CartScreen({
  defaultAddress,
  onOrdered,
}: {
  defaultAddress: string;
  onOrdered: () => void;
}) {
  const [items, setItems] = useState<CartLine[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [address, setAddress] = useState(defaultAddress),
    [method, setMethod] = useState("Home delivery"),
    [slot, setSlot] = useState(""),
    [coupon, setCoupon] = useState("");
  const [destinationLocation, setDestinationLocation] = useState<
    Point | undefined
  >();
  const attempt = useRef<{ body: string; key: string } | null>(null),
    saving = useRef(false);
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setItems(
        (await api.request<{ items: CartLine[] }>("/users/me/cart")).items,
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
  const change = async (index: number, delta: number) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const changed = items
        .map((l, i) => ({
          ...l,
          quantity: l.quantity + (index === i ? delta : 0),
        }))
        .filter((l) => l.product && l.quantity > 0);
      const r = await api.request<{ items: CartLine[] }>(
        "/users/me/cart",
        "PUT",
        {
          items: changed.map((l) => ({
            productId: l.product!.id,
            quantity: l.quantity,
          })),
        },
      );
      setItems(r.items);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const checkout = async () => {
    if (saving.current) return;
    setError("");
    const selectedTime = Date.parse(slot);
    if (
      !slot ||
      Number.isNaN(selectedTime) ||
      selectedTime <= Date.now() ||
      selectedTime > Date.now() + 7 * 86400000
    ) {
      setError("Choose a future delivery or pickup time within the next seven days.");
      return;
    }
    if (items.some((l) => !l.product)) {
      setError("Remove unavailable products before checkout.");
      return;
    }
    if (method === "Home delivery" && !destinationLocation) {
      setError("Select the delivery destination map pin.");
      return;
    }
    const input: CheckoutInput = {
      items: items.map((l) => ({
        productId: l.product!.id,
        quantity: l.quantity,
      })),
      method: method === "Farm pickup" ? "pickup" : "delivery",
      ...(method !== "Farm pickup" ? { address, destinationLocation } : {}),
      slot: new Date(slot).toISOString(),
      coupon: coupon.trim().toUpperCase() as CheckoutInput["coupon"],
    };
    const body = JSON.stringify(input);
    if (attempt.current?.body !== body)
      attempt.current = {
        body,
        key:
          "checkout-" + Date.now() + "-" + Math.random().toString(36).slice(2),
      };
    saving.current = true;
    setBusy(true);
    try {
      await api.checkout(input, attempt.current.key);
      setItems([]);
      await api.request("/users/me/cart", "PUT", { items: [] });
      onOrdered();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      saving.current = false;
    }
  };
  const subtotal = items.reduce(
      (n, l) => n + (l.product?.price || 0) * l.quantity,
      0,
    ),
    fee = method === "Farm pickup" || subtotal >= 499 ? 0 : 35,
    discount =
      coupon.trim().toUpperCase() === "FRESH10"
        ? Math.round(subtotal * 10) / 100
        : 0;
  return (
    <View style={{ gap: 16 }}>
      <Text style={s.heading}>Your basket</Text>
      <Feedback loading={loading} error={error} onRetry={load} />
      {!loading && !items.length && (
        <Text style={s.body}>Your basket is empty.</Text>
      )}
      {items.map((l, i) => (
        <View key={l.product?.id || i} style={s.panel}>
          <ProductPhoto image={l.product?.image} style={{ height: 100 }} />
          <Text style={s.cardTitle}>
            {l.product?.name || "Unavailable product"}
          </Text>
          <Text style={s.body}>
            {l.quantity} kg · ₹{(l.product?.price || 0) * l.quantity}
          </Text>
          <View style={s.wrap}>
            <Button
              label="Decrease"
              secondary
              disabled={busy}
              onPress={() => change(i, -1)}
            />
            <Button
              label="Increase"
              secondary
              disabled={busy}
              onPress={() => change(i, 1)}
            />
            <Button
              label="Remove item"
              secondary
              disabled={busy}
              onPress={() => change(i, -l.quantity)}
            />
          </View>
        </View>
      ))}
      {!!items.length && (
        <View style={s.panel}>
          <Chips
            options={["Home delivery", "Farm pickup"]}
            value={method}
            onChange={setMethod}
          />
          {method === "Home delivery" && (
            <Field
              label="Delivery address"
              value={address}
              onChange={setAddress}
            />
          )}
          {method === "Home delivery" && (
            <LocationPicker
              label="Delivery destination"
              value={destinationLocation}
              onChange={setDestinationLocation}
                onAddressChange={setAddress}
            />
          )}
          <DateField
            label="Delivery / pickup date and time"
            value={slot}
            onChange={setSlot}
            mode="datetime"
            minimum={localDateTimeValue(new Date())}
            maximum={localDateTimeValue(
              new Date(Date.now() + 7 * 86400000),
            )}
          />
          <Field
            label="Coupon (optional)"
            value={coupon}
            onChange={setCoupon}
          />
          <Text style={s.body}>
            Payment: cash{" "}
            {method === "Farm pickup" ? "at pickup" : "on delivery"}
          </Text>
          <Text style={s.body}>
            Produce ₹{subtotal.toFixed(2)} · Delivery ₹{fee} · Discount ₹
            {discount.toFixed(2)}
          </Text>
          <Text style={s.price}>
            Estimated total ₹{(subtotal + fee - discount).toFixed(2)}
          </Text>
          <Text style={s.muted}>
            The server confirms current prices and stock. Each farm pickup
            location receives a separate order.
          </Text>
          <Button
            label={busy ? "Placing order…" : "Place order"}
            disabled={busy || loading}
            onPress={checkout}
          />
        </View>
      )}
    </View>
  );
}
