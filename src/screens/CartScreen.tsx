import { LocationPicker } from "../components/maps/LocationPicker";
import { Point } from "../components/maps/types";
import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { LocalizedText as Text } from "../i18n/I18n";
import { api, ApiProduct, CheckoutInput, SlotQuote } from "../services/api";
import { Button } from "../components/Button";
import { Field } from "../components/Field";
import { CheckoutTiming } from "../components/CheckoutTiming";
import { Chips } from "../components/Chips";
import { Feedback } from "../components/Feedback";
import { ProductPhoto } from "../components/ProductPhoto";
import { s } from "../styles/appStyles";
export type CartLine = { product: ApiProduct | null; quantity: number };
export const cartItemCount = (items: CartLine[]) =>
  items.reduce(
    (total, item) => total + Math.max(0, Number(item.quantity) || 0),
    0,
  );
export function CartScreen({
  defaultAddress,
  defaultName,
  defaultPhone,
  onOrdered,
  onCountChange,
}: {
  defaultAddress: string;
  defaultName: string;
  defaultPhone: string;
  onOrdered: () => void;
  onCountChange: (count: number) => void;
}) {
  const [items, setItems] = useState<CartLine[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [address, setAddress] = useState(defaultAddress),
    [recipientName, setRecipientName] = useState(defaultName),
    [recipientPhone, setRecipientPhone] = useState(defaultPhone || ""),
    [deliveryInstructions, setDeliveryInstructions] = useState(""),
    [method, setMethod] = useState("Home delivery"),
    [slot, setSlot] = useState(""),
    [coupon, setCoupon] = useState(""),
    [quote, setQuote] = useState<SlotQuote | null>(null),
    [quoteRefresh, setQuoteRefresh] = useState(0),
    [quoteLoading, setQuoteLoading] = useState(false),
    [quoteError, setQuoteError] = useState("");
  const [destinationLocation, setDestinationLocation] = useState<
    Point | undefined
  >();
  const attempt = useRef<{ body: string; key: string } | null>(null),
    saving = useRef(false);
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await api.request<{ items: CartLine[] }>("/users/me/cart");
      setItems(result.items);
      onCountChange(cartItemCount(result.items));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const quoteItems = items
    .filter((line) => line.product)
    .map((line) => ({ productId: line.product!.id, quantity: line.quantity }));
  const quoteKey = JSON.stringify({
    items: quoteItems,
    method: method === "Farm pickup" ? "pickup" : "delivery",
    destinationLocation:
      method === "Home delivery" ? destinationLocation : undefined,
  });
  useEffect(() => {
    setQuote(null);
    setQuoteError("");
    setSlot("");
    if (
      !quoteItems.length ||
      quoteItems.length !== items.length ||
      (method === "Home delivery" && !destinationLocation)
    ) {
      setQuoteLoading(false);
      return;
    }
    let current = true;
    setQuoteLoading(true);
    const timer = setTimeout(() => {
      void api
        .request<SlotQuote>("/orders/slot-quote", "POST", JSON.parse(quoteKey))
        .then((result) => {
          if (current) setQuote(result);
        })
        .catch((reason) => {
          if (current) setQuoteError((reason as Error).message);
        })
        .finally(() => {
          if (current) setQuoteLoading(false);
        });
    }, 250);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [quoteKey, quoteRefresh]);
  useEffect(() => {
    if (method !== "Home delivery" || !items.length) return;
    const timer = setInterval(() => setQuoteRefresh((count) => count + 1), 30000);
    return () => clearInterval(timer);
  }, [method, items.length]);
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
      onCountChange(cartItemCount(r.items));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const checkout = async () => {
    if (saving.current) return;
    setError("");
    const pickup = method === "Farm pickup";
    const selectedTime = pickup ? Date.parse(slot) : NaN;
    if (
      pickup &&
      (!slot ||
        Number.isNaN(selectedTime) ||
        selectedTime <= Date.now() ||
        selectedTime > Date.now() + 7 * 86400000)
    ) {
      setError("Choose a future farm pickup time within the next seven days.");
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
    if (method === "Home delivery" && address.startsWith("Pin coordinates:")) {
      setError("Add your street or building details to the delivery address before placing the order.");
      return;
    }
    if (!quote || quoteLoading || !quote.available || !quote.minimumSlot) {
      setError(
        pickup
          ? "Wait for a pickup time estimate."
          : "Home delivery is unavailable until enough nearby partners are online.",
      );
      return;
    }
    if (pickup && selectedTime < Date.parse(quote.minimumSlot)) {
      setError("Select a time on or after the suggested earliest pickup slot.");
      return;
    }
    if (pickup) {
      const indiaTime = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(new Date(selectedTime));
      const [hour, minute] = indiaTime.split(":").map(Number);
      if (
        hour < 9 ||
        hour > 19 ||
        (hour === 19 && minute !== 0) ||
        minute % 30 !== 0
      ) {
        setError("Choose a 30-minute slot between 09:00 and 19:00 IST.");
        return;
      }
    }
    if (
      recipientName.trim().length < 2 ||
      !/^\+?[0-9]{7,15}$/.test(recipientPhone.trim().replace(/[\s()-]/g, ""))
    ) {
      setError(
        "Enter the recipient's name and a valid phone number (7–15 digits).",
      );
      return;
    }
    const input: CheckoutInput = {
      items: items.map((l) => ({
        productId: l.product!.id,
        quantity: l.quantity,
      })),
      method: method === "Farm pickup" ? "pickup" : "delivery",
      ...(method !== "Farm pickup" ? { address, destinationLocation } : {}),
      recipientName: recipientName.trim(),
      recipientPhone: recipientPhone.trim().replace(/[\s()-]/g, ""),
      deliveryInstructions: deliveryInstructions.trim(),
      ...(pickup ? { slot: new Date(slot).toISOString() } : {}),
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
      onCountChange(0);
      onOrdered();
    } catch (e) {
      setError((e as Error).message);
      if (!pickup) setQuoteRefresh((count) => count + 1);
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
              onAddressChange={(detected, expectedPrevious) =>
                setAddress((current) =>
                  !expectedPrevious || current === expectedPrevious
                    ? detected
                    : current,
                )
              }
            />
          )}
          <Field
            label="Recipient name"
            value={recipientName}
            onChange={setRecipientName}
          />
          <Field
            label="Recipient phone number"
            value={recipientPhone}
            onChange={setRecipientPhone}
            phone
          />
          <Field
            label={
              method === "Home delivery"
                ? "Delivery instructions (optional)"
                : "Pickup instructions (optional)"
            }
            value={deliveryInstructions}
            onChange={setDeliveryInstructions}
          />
          <CheckoutTiming
            method={method}
            hasDestination={!!destinationLocation}
            quote={quote}
            loading={quoteLoading}
            error={quoteError}
            slot={slot}
            onSlotChange={setSlot}
            onRefresh={() => setQuoteRefresh((count) => count + 1)}
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
            disabled={busy || loading || quoteLoading || !quote?.available}
            onPress={checkout}
          />
        </View>
      )}
    </View>
  );
}
