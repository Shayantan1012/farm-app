import React from "react";
import { Linking, View } from "react-native";
import { LocalizedText as Text } from "../i18n/I18n";
import { ApiOrder, ApiUser } from "../services/api";
import { useOrderTracking } from "../hooks/useOrderTracking";
import { LocationMap } from "../components/maps/LocationMap";
import { Marker, Point } from "../components/maps/types";
import { Button } from "../components/Button";
import { Feedback } from "../components/Feedback";
import { s } from "../styles/appStyles";
export function OrderTracking({
  order,
  user,
  onClose,
}: {
  order: ApiOrder;
  user: ApiUser;
  onClose: () => void;
}) {
  const { data, error, sharing, busy, start, stop } = useOrderTracking(
    order.id,
  );
  const markers: Marker[] = [];
  if (data?.pickup) markers.push({ ...data.pickup, label: "Pickup" });
  if (data?.destination)
    markers.push({ ...data.destination, label: "Destination" });
  if (data?.driver) markers.push({ ...data.driver, label: "Delivery partner" });
  const navigate = (p: Point) =>
    Linking.openURL(
      "https://www.google.com/maps/dir/?api=1&destination=" +
        p.latitude +
        "," +
        p.longitude,
    );
  return (
    <View style={{ gap: 12 }}>
      <Text style={s.heading}>Order tracking</Text>
      <Text style={s.muted}>Order {order.id}</Text>
      <Feedback loading={!data && !error} error={error} />
      {data && (
        <>
          <Text style={s.badge}>{data.status}</Text>
          <LocationMap markers={markers} />
          <Text style={s.body}>
            Pickup: {data.pickupAddress}
            {!data.pickup ? " — map pin missing on this older order" : ""}
          </Text>
          {data.method === "delivery" && (
            <Text style={s.body}>
              Destination: {data.destinationAddress}
              {!data.destination
                ? " — map pin missing on this older order"
                : ""}
            </Text>
          )}
          {markers.map((p) => (
            <Text key={p.label} style={s.muted}>
              {p.label}: {p.latitude.toFixed(6)}, {p.longitude.toFixed(6)}
            </Text>
          ))}
          <Text style={s.body}>
            {data.method === "pickup"
              ? "Farm pickup: no delivery partner tracking."
              : data.fresh
                ? "Recent delivery partner location"
                : data.sharing
                  ? "Waiting for a fresh GPS update. Any partner pin shown is the last known position."
                  : "Delivery partner location sharing is off."}
          </Text>
          {!!data.recordedAt && (
            <Text style={s.muted}>
              Last GPS sample: {new Date(data.recordedAt).toLocaleString()}
              {data.accuracy !== null
                ? " · Accuracy ±" + Math.round(data.accuracy) + " m"
                : ""}
            </Text>
          )}
          <View style={s.wrap}>
            {data.pickup && (
              <Button
                secondary
                label="Navigate to pickup"
                onPress={() => {
                  void navigate(data.pickup!);
                }}
              />
            )}
            {data.destination && (
              <Button
                secondary
                label="Navigate to destination"
                onPress={() => {
                  void navigate(data.destination!);
                }}
              />
            )}
          </View>
          {user.role === "delivery" &&
            order.driver === user.id &&
            data.status === "Out for Delivery" && (
              <>
                <Text style={s.muted}>
                  Share your phone location with this order’s customer and
                  farmer. Keep this screen open. Sharing stops when you leave
                  the screen or put the app in the background. On web, location
                  needs HTTPS or localhost.
                </Text>
                <Button
                  label={
                    sharing
                      ? "Stop sharing location"
                      : busy
                        ? "Starting GPS…"
                        : "Start sharing location"
                  }
                  disabled={busy}
                  onPress={sharing ? stop : start}
                />
              </>
            )}
          <Text style={s.muted}>
            Refreshes every 10 seconds. Maps require internet. Navigation opens
            your maps service; no route or arrival time is estimated here.
          </Text>
        </>
      )}
      <Button secondary label="Close tracking" onPress={onClose} />
    </View>
  );
}
