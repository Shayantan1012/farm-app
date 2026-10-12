import React, { useState } from "react";
import { Text, View } from "react-native";
import * as Location from "expo-location";
import { LocationMap } from "./LocationMap";
import { Point, validPoint } from "./types";
import { Button } from "../Button";
import { Field } from "../Field";
import { s } from "../../styles/appStyles";
export function LocationPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: Point;
  onChange: (p: Point | undefined) => void;
}) {
  const [latitude, setLatitude] = useState(value ? String(value.latitude) : "");
  const [longitude, setLongitude] = useState(
    value ? String(value.longitude) : "",
  );
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const select = (p: Point) => {
    setLatitude(String(p.latitude));
    setLongitude(String(p.longitude));
    onChange(p);
    setError("");
  };
  const edit = (lat: string, lon: string) => {
    setLatitude(lat);
    setLongitude(lon);
    const p = { latitude: Number(lat), longitude: Number(lon) };
    onChange(lat.trim() && lon.trim() && validPoint(p) ? p : undefined);
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
          "Location permission denied. Tap the map or enter coordinates instead.",
        );
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      select({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={{ gap: 10 }}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.muted}>
        Tap the map, use your current location, or enter latitude and longitude.
        Check the pin before saving.
      </Text>
      <LocationMap
        markers={value ? [{ ...value, label: "Selected location" }] : []}
        onSelect={select}
      />
      <Button
        secondary
        label={busy ? "Finding location…" : "Use current location"}
        disabled={busy}
        onPress={locate}
      />
      <Field
        label={label + " latitude"}
        value={latitude}
        onChange={(v) => edit(v, longitude)}
      />
      <Field
        label={label + " longitude"}
        value={longitude}
        onChange={(v) => edit(latitude, v)}
      />
      <Text style={s.muted}>
        {value ? "Map pin selected" : "Select a valid map pin to continue"}
      </Text>
      {!!error && <Text accessibilityRole="alert">{error}</Text>}
    </View>
  );
}
