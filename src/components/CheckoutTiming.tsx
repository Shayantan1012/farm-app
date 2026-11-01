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
  onRefresh,
}: {
  method: string;
  hasDestination: boolean;
  quote: SlotQuote | null;
  loading: boolean;
  error: string;
  slot: string;
  onSlotChange: (value: string) => void;
  onRefresh: () => void;
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
      {loading && <Text style={s.muted}>Checking current availability…</Text>}
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
          {quote.minimumSlot && (
            <Text style={s.body}>
              {delivery ? "Estimated arrival: " : "Earliest pickup: "}
              {new Date(quote.minimumSlot).toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
                dateStyle: "medium",
                timeStyle: "short",
              })}{" "}
              IST
            </Text>
          )}
          {delivery && quote.available && quote.estimatedMinutes !== null && (
            <Text style={s.body}>
              Approximately {Math.floor(quote.estimatedMinutes / 60)} hour(s)
              {quote.estimatedMinutes % 60 ? ` ${quote.estimatedMinutes % 60} minutes` : ""} from now
            </Text>
          )}
          {delivery && (
            <Text style={s.body}>
              Farm-to-home distance: about {quote.distanceKm.toFixed(1)} km ·{" "}
              {quote.availablePartners} of {quote.requiredPartners} needed
              partner(s) currently available near the farm.
            </Text>
          )}
          {delivery && !quote.available && (
            <Text accessibilityRole="alert" style={s.body}>
              Home delivery is currently unavailable. Please try again when
              nearby partners are online, or choose farm pickup.
            </Text>
          )}
          {delivery && quote.available && (
            <Text style={s.muted}>
              This estimate includes farm preparation and travel from an
              available partner to the farm and then to you. It may change
              during fulfilment.
            </Text>
          )}
          {!delivery && (
            <Text style={s.muted}>
              Pickup includes at least three hours for the farmer to prepare
              your order.
            </Text>
          )}
          {!delivery && (
            <>
              <Text style={s.muted}>
                Choose a 30-minute pickup slot during {quote.serviceHours}.
              </Text>
              {quote.minimumSlot && (
                <Button
                  secondary
                  label="Use suggested time"
                  onPress={() =>
                    onSlotChange(localDateTimeValue(new Date(quote.minimumSlot!)))
                  }
                />
              )}
            </>
          )}
        </View>
      )}
      {delivery ? (
        <Button secondary label="Refresh delivery estimate" onPress={onRefresh} />
      ) : (
        <DateField
          label="Farm pickup date and time"
          value={slot}
          onChange={selectSlot}
          mode="datetime"
          minimum={localDateTimeValue(
            quote?.minimumSlot ? new Date(quote.minimumSlot) : new Date(),
          )}
          maximum={localDateTimeValue(new Date(Date.now() + 7 * 86400000))}
        />
      )}
    </View>
  );
}
