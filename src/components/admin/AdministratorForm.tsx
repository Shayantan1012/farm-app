import React, { useState } from "react";
import { Text, View } from "react-native";
import { api } from "../../services/api";
import { Field } from "../Field";
import { Button } from "../Button";
import { Feedback } from "../Feedback";
import { s } from "../../styles/appStyles";
export function AdministratorForm({
  first = false,
  onCreated,
}: {
  first?: boolean;
  onCreated: () => void;
}) {
  const [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const save = async () => {
    setError("");
    if (password.length < 12 || password !== confirm) {
      setError("Use at least 12 characters and make both passwords match.");
      return;
    }
    setBusy(true);
    try {
      await api.request(
        first ? "/auth/admin-setup" : "/admin/administrators",
        "POST",
        { name, email: email.trim(), password },
      );
      setPassword("");
      setConfirm("");
      onCreated();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={s.panel}>
      <Text style={s.heading}>
        {first ? "Create first administrator" : "Create administrator"}
      </Text>
      <Text style={s.body}>
        {first
          ? "Set up the person who will manage Harvest. This setup closes permanently after the first administrator is created."
          : "This account receives full administrator access. Use an email that is not already registered."}
      </Text>
      <Feedback error={error} />
      <Field label="Administrator name" value={name} onChange={setName} />
      <Field label="Administrator email" value={email} onChange={setEmail} />
      <Field
        label="Administrator password (at least 12 characters)"
        value={password}
        onChange={setPassword}
        secure
      />
      <Field
        label="Confirm administrator password"
        value={confirm}
        onChange={setConfirm}
        secure
      />
      <Button
        label={busy ? "Creating administrator…" : "Create administrator"}
        disabled={busy}
        onPress={save}
      />
    </View>
  );
}
