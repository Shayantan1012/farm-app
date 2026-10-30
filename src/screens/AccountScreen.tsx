import React, { useState } from "react";
import { View, Text, Switch } from "react-native";
import { api, ApiUser } from "../services/api";
import { Button } from "../components/Button";
import { Field } from "../components/Field";
import { Feedback } from "../components/Feedback";
import { s } from "../styles/appStyles";
export function AccountScreen({
  user,
  onUserChanged,
  onLogout,
}: {
  user: ApiUser;
  onUserChanged: () => Promise<void>;
  onLogout: () => void;
}) {
  const [name, setName] = useState(user.name),
    [address, setAddress] = useState(user.address),
    [phone, setPhone] = useState(user.phone),
    [city, setCity] = useState(user.city || ""),
    [state, setState] = useState(user.state || ""),
    [postalCode, setPostalCode] = useState(user.postalCode || ""),
    [farmName, setFarmName] = useState(user.farmName),
    [notifications, setNotifications] = useState(user.notifications),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const save = async () => {
    setBusy(true);
    setError("");
    try {
      await api.request("/users/me", "PATCH", {
        name,
        address, phone, city, state, postalCode,
        notifications,
        ...(user.role === "producer" ? { farmName } : {}),
      });
      await onUserChanged();
      setMessage("Profile saved.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={s.panel}>
      <Text style={s.heading}>Your account</Text>
      <Text style={s.body}>
        {user.email} · {user.role === "producer" ? "Farmer" : user.role}
      </Text>
      <Text style={s.badge}>
        {user.approved ? "Approved" : "Awaiting approval"}
      </Text>
      <Feedback error={error} />
      {!!message && <Text style={s.body}>{message}</Text>}
      <Field label="Full name" value={name} onChange={setName} />
      {user.role === "producer" && (
        <Field label="Farm name" value={farmName} onChange={setFarmName} />
      )}
      <Field label="Phone number" value={phone} onChange={setPhone} phone />
      <Field label="Address" value={address} onChange={setAddress} />
      <Field label="City / village" value={city} onChange={setCity} />
      <Field label="State" value={state} onChange={setState} />
      <Field label="Postal / PIN code" value={postalCode} onChange={setPostalCode} />
      <View style={s.between}>
        <Text style={s.label}>Notifications</Text>
        <Switch value={notifications} onValueChange={setNotifications} />
      </View>
      <Button label="Save profile" disabled={busy} onPress={save} />
      <Button
        label="Refresh account"
        secondary
        onPress={() => void onUserChanged().catch((e) => setError(e.message))}
      />
      <Button label="Sign out" secondary onPress={onLogout} />
    </View>
  );
}
