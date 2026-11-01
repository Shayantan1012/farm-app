import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { LocalizedText as Text } from "../i18n/I18n";
import { ApiOrder, ApiUser, Point, api } from "../services/api";
import { Button } from "../components/Button";
import { Feedback } from "../components/Feedback";
import { Field } from "../components/Field";
import { Icon } from "../components/Icon";
import { LocationMap } from "../components/maps/LocationMap";
import { OrderTracking } from "./OrderTracking";
import { s } from "../styles/appStyles";

type Dashboard = {
  current: ApiOrder | null;
  recent: ApiOrder[];
  waiting: number;
  available: boolean;
  location: Point | null;
  locationUpdatedAt: string | null;
};

export function DeliveryDashboard({ user }: { user: ApiUser }) {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [tracked, setTracked] = useState<ApiOrder | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setData(await api.request<Dashboard>("/deliveries/dashboard"));
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);

  const run = async (action: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await action();
      setCode("");
      await load();
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const goOnline = () =>
    run(async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted")
        throw new Error(
          "Allow location access so the system can assign the nearest delivery.",
        );
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      await api.request("/deliveries/me/location", "PUT", {
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
        available: true,
      });
    });

  if (tracked)
    return (
      <OrderTracking
        order={tracked}
        user={user}
        onClose={() => {
          setTracked(null);
          void load();
        }}
      />
    );

  const current = data?.current;
  const markers = current
    ? [
        ...(current.pickupLocation
          ? [{ ...current.pickupLocation, label: "Farm pickup" }]
          : []),
        ...(current.destinationLocation
          ? [{ ...current.destinationLocation, label: "Customer destination" }]
          : []),
      ]
    : [];

  return (
    <View style={{ gap: 16 }}>
      <View style={s.deliveryHeader}>
        <View>
          <Text style={s.eyebrow}>DELIVERY PARTNER WORKSPACE</Text>
          <Text style={s.heading}>Your delivery dashboard</Text>
          <Text style={s.muted}>
            Nearby jobs are assigned automatically using your latest GPS
            location.
          </Text>
        </View>
        <View style={[s.deliveryStatus, data?.available && s.deliveryOnline]}>
          <View
            style={[
              s.deliveryStatusDot,
              data?.available && { backgroundColor: "#2F6B45" },
            ]}
          />
          <Text style={s.label}>
            {current
              ? "On a delivery"
              : data?.available
                ? "Available"
                : "Offline"}
          </Text>
        </View>
      </View>

      <Feedback loading={loading} error={error} onRetry={load} />

      {!loading && data && (
        <View style={s.deliverySummaryGrid}>
          <View style={s.deliverySummaryCard}>
            <Icon name="navigate-circle-outline" size={28} />
            <Text style={s.stat}>{current ? "1" : "0"}</Text>
            <Text style={s.muted}>Current delivery</Text>
          </View>
          <View style={s.deliverySummaryCard}>
            <Icon name="time-outline" size={28} />
            <Text style={s.stat}>{data.waiting}</Text>
            <Text style={s.muted}>Waiting nearby</Text>
          </View>
          <View style={s.deliverySummaryCard}>
            <Icon name="checkmark-done-outline" size={28} />
            <Text style={s.stat}>{data.recent.length}</Text>
            <Text style={s.muted}>Recent completed</Text>
          </View>
        </View>
      )}

      {!loading && data && !current && (
        <View style={s.deliveryAvailabilityCard}>
          <View style={s.deliveryAvailabilityIcon}>
            <Icon
              name={data.available ? "radio" : "location-outline"}
              size={32}
            />
          </View>
          <View style={{ flex: 1, minWidth: 220 }}>
            <Text style={s.cardTitle}>
              {data.available
                ? "You are ready for assignments"
                : "Go online to receive work"}
            </Text>
            <Text style={s.body}>
              The server compares your current location with each farm pickup
              and reserves the nearest suitable partner.
            </Text>
            {!!data.locationUpdatedAt && (
              <Text style={s.muted}>
                Location updated{" "}
                {new Date(data.locationUpdatedAt).toLocaleString()}
              </Text>
            )}
          </View>
          <Button
            label={
              data.available
                ? "Refresh current location"
                : "Go online with current location"
            }
            disabled={busy}
            onPress={goOnline}
          />
          {data.available && (
            <Button
              secondary
              label="Go offline"
              disabled={busy}
              onPress={() =>
                run(() =>
                  api.request("/deliveries/me/availability", "PATCH", {
                    available: false,
                  }),
                )
              }
            />
          )}
        </View>
      )}

      {!loading && current && (
        <View style={s.currentDeliveryCard}>
          <View style={s.between}>
            <View>
              <Text style={s.eyebrow}>CURRENT DELIVERY</Text>
              <Text style={s.heading}>{current.farm}</Text>
            </View>
            <Text style={s.badge}>{current.status}</Text>
          </View>
          {!!markers.length && <LocationMap markers={markers} />}
          <View style={s.deliveryRoute}>
            <View style={s.deliveryRoutePoint}>
              <Icon name="storefront-outline" size={24} />
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Pickup from farm</Text>
                <Text style={s.body}>
                  {current.pickupAddress || current.farm}
                </Text>
              </View>
            </View>
            <View style={s.deliveryRouteLine} />
            <View style={s.deliveryRoutePoint}>
              <Icon name="location-outline" size={24} />
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Deliver to customer</Text>
                <Text style={s.body}>{current.address}</Text>
              </View>
            </View>
          </View>
          <View style={s.deliveryFacts}>
            <Text style={s.body}>
              Estimated delivery {new Date(current.slot).toLocaleString()}
            </Text>
            {current.assignmentDistanceKm !== undefined && (
              <Text style={s.body}>
                Assigned from {current.assignmentDistanceKm.toFixed(1)} km away
              </Text>
            )}
            <Text style={s.price}>
              ₹{(current.totalPaise / 100).toFixed(2)}
            </Text>
          </View>
          {!!current.recipientName && (
            <Text style={s.body}>
              Recipient: {current.recipientName} · {current.recipientPhone}
            </Text>
          )}
          {!!current.deliveryInstructions && (
            <Text style={s.body}>
              Instructions: {current.deliveryInstructions}
            </Text>
          )}
          <View style={s.wrap}>
            {current.status === "Driver Assigned" && (
              <Button
                label="Start delivery"
                disabled={busy}
                onPress={() =>
                  run(() =>
                    api.request(`/deliveries/${current.id}/start`, "POST"),
                  )
                }
              />
            )}
            <Button
              secondary
              label="Open route and tracking"
              onPress={() => setTracked(current)}
            />
          </View>
          {current.status === "Out for Delivery" && (
            <View style={s.deliveryHandover}>
              <Text style={s.cardTitle}>Complete customer handover</Text>
              <Text style={s.muted}>
                Ask the customer for the six-digit code only after delivery.
              </Text>
              <Field
                label="Handover code"
                value={code}
                onChange={setCode}
                numeric
              />
              <Button
                label="Confirm delivery"
                disabled={busy || !/^\d{6}$/.test(code)}
                onPress={() => run(() => api.complete(current.id, code))}
              />
            </View>
          )}
        </View>
      )}

      {!loading && data && !current && data.available && (
        <View style={s.empty}>
          <Icon name="bicycle-outline" size={42} />
          <Text style={s.cardTitle}>Waiting for the nearest assignment</Text>
          <Text style={s.muted}>
            Keep the app available. Refresh your location if you move to a new
            area.
          </Text>
        </View>
      )}

      {!!data?.recent.length && (
        <View style={s.panel}>
          <Text style={s.cardTitle}>Recent delivery history</Text>
          {data.recent.map((order) => (
            <View key={order.id} style={s.deliveryHistoryRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>{order.farm}</Text>
                <Text style={s.muted}>
                  {new Date(order.slot).toLocaleString()}
                </Text>
              </View>
              <Text style={s.badge}>{order.status}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
