import { OrderTracking } from "./OrderTracking";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { LocalizedText as Text } from "../i18n/I18n";
import { api, ApiUser, ApiOrder } from "../services/api";
import { Button } from "../components/Button";
import { Field } from "../components/Field";
import { Feedback } from "../components/Feedback";
import { s } from "../styles/appStyles";
import { DeliveryDashboard } from "./DeliveryDashboard";
export function OrdersScreen({
  user,
  deliveriesOnly = false,
}: {
  user: ApiUser;
  deliveriesOnly?: boolean;
}) {
  if (user.role === "delivery") return <DeliveryDashboard user={user} />;
  return <OrderList user={user} deliveriesOnly={deliveriesOnly} />;
}
function OrderList({
  user,
  deliveriesOnly = false,
}: {
  user: ApiUser;
  deliveriesOnly?: boolean;
}) {
  const [tracked, setTracked] = useState<ApiOrder | null>(null);
  const [orders, setOrders] = useState<ApiOrder[]>([]),
    [jobs, setJobs] = useState<{ _id: string; farm: string; slot: string }[]>(
      [],
    ),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [selected, setSelected] = useState(""),
    [action, setAction] = useState(""),
    [value, setValue] = useState(""),
    [messages, setMessages] = useState<{ text: string }[]>([]),
    [page, setPage] = useState(1),
    [total, setTotal] = useState(0);
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const r = await api.request<{ orders: ApiOrder[]; total: number }>(
        "/orders?page=" + page + (deliveriesOnly ? "&method=delivery" : ""),
      );
      setOrders(r.orders);
      setTotal(r.total);
      if (user.role === "delivery")
        setJobs(
          (
            await api.request<{ deliveries: typeof jobs }>(
              "/deliveries/available",
            )
          ).deliveries,
        );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, [page]);
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      setSelected("");
      setValue("");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const open = async (o: ApiOrder, a: string) => {
    setSelected(o.id);
    setAction(a);
    setValue("");
    setMessages([]);
    if (a === "chat")
      try {
        setMessages(
          (
            await api.request<{ messages: { text: string }[] }>(
              "/orders/" + o.id + "/messages",
            )
          ).messages,
        );
      } catch (e) {
        setError((e as Error).message);
      }
  };
  if (tracked)
    return (
      <OrderTracking
        key={tracked.id}
        order={tracked}
        user={user}
        onClose={() => {
          setTracked(null);
          void load();
        }}
      />
    );
  return (
    <View style={{ gap: 16 }}>
      <Text style={s.heading}>
        {user.role === "delivery" || deliveriesOnly ? "Deliveries" : "Orders"}
      </Text>
      <Button secondary label="Refresh orders" onPress={load} />
      <Feedback loading={loading} error={error} onRetry={load} />
      {user.role === "delivery" &&
        jobs.map((j) => (
          <View key={j._id} style={s.panel}>
            <Text style={s.cardTitle}>{j.farm}</Text>
            <Text style={s.body}>{new Date(j.slot).toLocaleString()}</Text>
            <Button
              label="Accept delivery"
              disabled={busy}
              onPress={() =>
                run(() =>
                  api.request("/deliveries/" + j._id + "/claim", "POST"),
                )
              }
            />
          </View>
        ))}
      {!loading && !orders.length && <Text style={s.body}>No orders yet.</Text>}
      {orders.map((o) => (
        <View key={o.id} style={s.panel}>
          <View style={s.between}>
            <Text style={s.cardTitle}>{o.farm}</Text>
            <Text style={s.badge}>{o.status}</Text>
          </View>
          <Text style={s.muted}>Order {o.id}</Text>
          {user.role === "administrator" && (
            <Text style={s.muted}>
              Consumer {o.consumer} ? Farmer {o.producer} ? Delivery partner{" "}
              {o.driver || "Unassigned"}
            </Text>
          )}
          {o.method === "delivery" &&
            o.driver &&
            !["Delivered", "Cancelled"].includes(o.status) && (
            <Text style={s.badge}>
              Delivery partner assigned
              {o.assignmentDistanceKm !== undefined
                ? ` · ${o.assignmentDistanceKm.toFixed(1)} km from pickup when assigned`
                : ""}
            </Text>
          )}
          {!["Delivered", "Cancelled"].includes(o.status) && (
            <Button
              secondary
              label="Track on map"
              onPress={() => setTracked(o)}
            />
          )}
          {o.items.map((l) => (
            <Text key={l.product} style={s.body}>
              {l.name} × {l.quantity} kg · ₹{(l.pricePaise * l.quantity) / 100}
            </Text>
          ))}
          <Text style={s.body}>
            {o.method} · {new Date(o.slot).toLocaleString()}
          </Text>
          <Text style={s.body}>{o.address}</Text>
          {!!o.recipientName && (
            <Text style={s.body}>Recipient: {o.recipientName} · {o.recipientPhone}</Text>
          )}
          {!!o.deliveryInstructions && (
            <Text style={s.body}>Instructions: {o.deliveryInstructions}</Text>
          )}
          <Text style={s.price}>₹{(o.totalPaise / 100).toFixed(2)}</Text>
          <Text style={s.muted}>
            Produce ₹{o.subtotalPaise / 100} · Delivery ₹{o.deliveryPaise / 100}{" "}
            · Discount ₹{o.discountPaise / 100} · Payment {o.paymentStatus}
          </Text>
          {!!o.handoverCode && (
            <Text style={s.badge}>
              Handover code: {o.handoverCode} — share only when receiving your
              order.
            </Text>
          )}
          <View style={s.wrap}>
            {user.role === "producer" &&
              ["Pending", "Accepted", "Preparing"].includes(o.status) && (
                <Button
                  label={
                    o.status === "Pending" ? "Accept order" : "Next status"
                  }
                  disabled={busy}
                  onPress={() =>
                    run(() =>
                      api.setStatus(
                        o.id,
                        (
                          {
                            Pending: "Accepted",
                            Accepted: "Preparing",
                            Preparing: "Ready for Pickup",
                          } as const
                        )[o.status as "Pending" | "Accepted" | "Preparing"],
                      ),
                    )
                  }
                />
              )}
            {((user.role === "producer" &&
              o.method === "pickup" &&
              o.status === "Ready for Pickup") ||
              (user.role === "delivery" &&
                o.status === "Out for Delivery")) && (
              <Button
                label="Confirm handover"
                onPress={() => void open(o, "complete")}
              />
            )}
            {((user.role === "consumer" &&
              ["Pending", "Accepted"].includes(o.status)) ||
              (["producer", "administrator"].includes(user.role) &&
                [
                  "Pending",
                  "Accepted",
                  "Preparing",
                  "Ready for Pickup",
                  "Driver Assigned",
                ].includes(o.status))) && (
              <Button
                secondary
                label="Cancel order"
                onPress={() => void open(o, "cancel")}
              />
            )}
            <Button
              secondary
              label="Order chat"
              onPress={() => void open(o, "chat")}
            />
            {user.role === "consumer" && o.status === "Delivered" && (
              <Button
                secondary
                label="Review products"
                onPress={() => void open(o, "review")}
              />
            )}
          </View>
          {selected === o.id && (
            <View style={{ gap: 12 }}>
              {messages.map((m, i) => (
                <Text key={i} style={s.body}>
                  {m.text}
                </Text>
              ))}
              <Field
                label={
                  action === "complete"
                    ? "Handover code"
                    : action === "cancel"
                      ? "Cancellation reason"
                      : action === "review"
                        ? "Review"
                        : "Message"
                }
                value={value}
                onChange={setValue}
              />
              {action === "review" ? (
                o.items.map((l) => (
                  <ReviewForm
                    key={l.product}
                    orderId={o.id}
                    productId={l.product}
                    name={l.name}
                    text={value}
                    run={run}
                    busy={busy}
                  />
                ))
              ) : (
                <Button
                  label="Submit"
                  disabled={busy}
                  onPress={() =>
                    run(() =>
                      action === "complete"
                        ? api.complete(o.id, value)
                        : action === "cancel"
                          ? api.cancel(o.id, value)
                          : api.request(
                              "/orders/" + o.id + "/messages",
                              "POST",
                              { text: value },
                            ),
                    )
                  }
                />
              )}
              <Button label="Close" secondary onPress={() => setSelected("")} />
            </View>
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
function ReviewForm({
  orderId,
  productId,
  name,
  text,
  run,
  busy,
}: {
  orderId: string;
  productId: string;
  name: string;
  text: string;
  run: (fn: () => Promise<unknown>) => void;
  busy: boolean;
}) {
  const [rating, setRating] = useState("");
  return (
    <View>
      <Field
        label={"Rating 1–5 for " + name}
        numeric
        value={rating}
        onChange={setRating}
      />
      <Button
        label={"Save review for " + name}
        disabled={busy}
        onPress={() =>
          run(() =>
            api.request("/reviews", "POST", {
              orderId,
              productId,
              rating: Number(rating),
              text,
            }),
          )
        }
      />
    </View>
  );
}
