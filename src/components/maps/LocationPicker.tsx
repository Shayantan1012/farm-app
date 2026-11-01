import React, { useEffect, useRef, useState } from "react";
import { Platform, View } from "react-native";
import { LocalizedText as Text } from "../../i18n/I18n";
import * as Location from "expo-location";
import { LocationMap } from "./LocationMap";
import { Point, validPoint } from "./types";
import { Button } from "../Button";
import { Field } from "../Field";
import { s } from "../../styles/appStyles";
import { api } from "../../services/api";

export function LocationPicker({
  label,
  value,
  onChange,
  onAddressChange,
  autoDetect = true,
}: {
  label: string;
  value?: Point;
  onChange: (point: Point | undefined) => void;
  onAddressChange?: (address: string, expectedPrevious?: string) => void;
  autoDetect?: boolean;
}) {
  const [latitude, setLatitude] = useState(value ? String(value.latitude) : "");
  const [longitude, setLongitude] = useState(
    value ? String(value.longitude) : "",
  );
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [address, setAddress] = useState(""),
    [showManual, setShowManual] = useState(false),
    [source, setSource] = useState<"gps" | "map" | "manual" | "">("");
  const autoStarted = useRef(false),
    addressRequest = useRef(0);

  const formatAddress = (place: Location.LocationGeocodedAddress) =>
    place.formattedAddress ||
    [
      [place.streetNumber, place.street].filter(Boolean).join(" "),
      place.name,
      place.district,
      place.city,
      place.subregion,
      place.region,
      place.postalCode,
      place.country,
    ]
      .filter((part, index, all) => part && all.indexOf(part) === index)
      .join(", ");

  const resolveAddress = async (point: Point, fallback: string, request: number) => {
    try {
      let resolved = "";
      if (Platform.OS !== "web") {
        try {
          const place = (await Location.reverseGeocodeAsync(point))[0];
          resolved = place ? formatAddress(place) : "";
        } catch {
          // The backend lookup also covers devices without a native result.
        }
      }
      if (!resolved) {
        const result = await api.request<{ address: string }>(
          `/location/reverse?latitude=${point.latitude}&longitude=${point.longitude}`,
        );
        resolved = result.address;
      }
      if (request === addressRequest.current && resolved) {
        setAddress(resolved);
        onAddressChange?.(resolved, fallback);
      }
    } catch {
      if (request === addressRequest.current)
        setError("Address lookup unavailable. Add the street and building details above.");
    }
  };

  const select = (
    point: Point,
    selectedBy: "gps" | "map" | "manual",
  ) => {
    const request = ++addressRequest.current;
    const fallback = `Pin coordinates: ${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}`;
    setLatitude(String(point.latitude));
    setLongitude(String(point.longitude));
    onChange(point);
    setSource(selectedBy);
    setError("");
    setAddress(fallback);
    onAddressChange?.(fallback);
    if (selectedBy !== "manual") void resolveAddress(point, fallback, request);
  };

  const edit = (lat: string, lon: string) => {
    setLatitude(lat);
    setLongitude(lon);
    const point = { latitude: Number(lat), longitude: Number(lon) };
    if (lat.trim() && lon.trim() && validPoint(point)) select(point, "manual");
    else onChange(undefined);
  };

  const locate = async () => {
    setBusy(true);
    setError("");
    try {
      if (
        (await Location.requestForegroundPermissionsAsync()).status !==
        "granted"
      )
        throw new Error(
          "Location permission denied. Allow location access in device settings, tap the map, or enter coordinates manually.",
        );
      if (!(await Location.hasServicesEnabledAsync())) {
        if (Platform.OS === "android") await Location.enableNetworkProviderAsync();
        else throw new Error("Turn on Location Services and try again.");
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      select(
        {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
        "gps",
      );
      if (position.mocked)
        setError(
          "This is a simulated device location. Set the emulator GPS position to test another place.",
        );
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (autoDetect && !value && !autoStarted.current) {
      autoStarted.current = true;
      void locate();
    }
  }, [autoDetect, value]);

  return (
    <View style={{ gap: 10 }}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.muted}>
        We detect your device location and fill the address when a readable
        result is available. Check the street and building details before ordering.
      </Text>
      <Button
        secondary
        label={busy ? "Detecting your location…" : "Detect my current location"}
        disabled={busy}
        onPress={locate}
      />
      <LocationMap
        markers={value ? [{ ...value, label: "Selected location" }] : []}
        onSelect={(point) => select(point, "map")}
      />
      {!!address && (
        <View style={s.panel}>
          <Text style={s.label}>
            {address.startsWith("Pin coordinates:") ? "Selected map pin" : "Detected address"}
          </Text>
          <Text style={s.body}>{address}</Text>
          {address.startsWith("Pin coordinates:") && (
            <Text style={s.muted}>
              Add a street or building address above before checkout.
            </Text>
          )}
          {!address.startsWith("Pin coordinates:") && Platform.OS === "web" && (
            <Text style={s.muted}>Address data © OpenStreetMap contributors</Text>
          )}
        </View>
      )}
      <Button
        secondary
        label={
          showManual ? "Hide manual coordinates" : "Enter coordinates manually"
        }
        onPress={() => setShowManual((shown) => !shown)}
      />
      {showManual && (
        <>
          <Field
            label={label + " latitude"}
            value={latitude}
            onChange={(next) => edit(next, longitude)}
          />
          <Field
            label={label + " longitude"}
            value={longitude}
            onChange={(next) => edit(latitude, next)}
          />
        </>
      )}
      <Text style={s.muted}>
        {value
          ? `${source === "gps" ? "Current GPS location" : source === "map" ? "Map location" : source === "manual" ? "Manual location" : "Saved location"} selected · ${value.latitude.toFixed(6)}, ${value.longitude.toFixed(6)}`
          : "Waiting for a valid location"}
      </Text>
      {!!error && <Text accessibilityRole="alert">{error}</Text>}
    </View>
  );
}
