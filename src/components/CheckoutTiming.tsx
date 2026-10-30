import React from "react";
import { View } from "react-native";
import { LocalizedText as Text } from "../i18n/I18n";
import { SlotQuote } from "../services/api";
import { s } from "../styles/appStyles";
import { Button } from "./Button";
import { DateField } from "./DateField";
import { localDateTimeValue } from "./DateField.types";

export function CheckoutTiming({
  method,
  hasDestination,
  quote,
  loading,
  error,
  slot,
  onSlotChange,
}: {
  method: string;
  hasDestination: boolean;
  quote: SlotQuote | null;
  loading: boolean;
  error: string;
  slot: string;
  onSlotChange: (value: string) => void;
}) {
  const delivery = method === "Home delivery";
  const selectSlot = (value: string) => {
    if (!value) return onSlotChange("");
    const time = Date.parse(value);
    onSlotChange(
      Number.isNaN(time)
        ? value
        : localDateTimeValue(new Date(Math.ceil(time / 1800000) * 1800000)),
    );
  };
  return (
    <View style={{ gap: 10 }}>
      {delivery && !hasDestination && (
        <Text style={s.muted}>
          Choose a destination pin to calculate delivery distance and partner
          availability.
        </Text>
      )}
      {loading && <Text style={s.muted}>Calculating available times…</Text>}
      {!!error && (
        <Text accessibilityRole="alert" style={s.body}>
          {error}
        </Text>
      )}
      {quote && (
        <View style={s.summary}>
          <Text style={s.cardTitle}>
            {delivery ? "Home delivery timing" : "Farm pickup timing"}
          </Text>
          <Text style={s.body}>
            Earliest suggested time:{" "}
            {new Date(quote.minimumSlot).toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
              dateStyle: "medium",
              timeStyle: "short",
            })}{" "}
            IST
          </Text>
          {delivery && (
            <Text style={s.body}>
              Farm-to-home distance: about {quote.distanceKm.toFixed(1)} km ·{" "}
              {quote.availablePartners} partner(s) currently available near the
              farm.
            </Text>
          )}
          {delivery && quote.availablePartners === 0 && (
            <Text style={s.muted}>
              No nearby partner is online right now, so the estimate includes
              extra time. A partner is assigned when the farm marks the order
              ready.
            </Text>
          )}
          {!delivery && (
            <Text style={s.muted}>
              Pickup includes at least three hours for the farmer to prepare
              your order.
            </Text>
          )}
          <Text style={s.muted}>
            Choose a 30-minute slot during {quote.serviceHours}. Timing is an
            estimate; the farmer and partner confirm fulfilment after ordering.
          </Text>
          <Button
            secondary
            label="Use suggested time"
            onPress={() =>
              onSlotChange(localDateTimeValue(new Date(quote.minimumSlot)))
            }
          />
        </View>
      )}
      <DateField
        label="Delivery / pickup date and time"
        value={slot}
        onChange={selectSlot}
        mode="datetime"
        minimum={localDateTimeValue(
          quote ? new Date(quote.minimumSlot) : new Date(),
        )}
        maximum={localDateTimeValue(new Date(Date.now() + 7 * 86400000))}
      />
    </View>
  );
}
