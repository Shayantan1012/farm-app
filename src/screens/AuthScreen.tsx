import React, { useState } from "react";
import { View } from "react-native";
import { LocalizedText as Text } from "../i18n/I18n";
import { api, ApiUser, ApiRole } from "../services/api";
import { Button } from "../components/Button";
import { Field } from "../components/Field";
import { Chips } from "../components/Chips";
import { Feedback } from "../components/Feedback";
import { s } from "../styles/appStyles";
import { Language } from "../i18n/I18n";
export function AuthScreen({
  onAuthenticated,
  onAdminSetup,
  language,
}: {
  onAuthenticated: (u: ApiUser) => void;
  onAdminSetup?: () => void;
  language: Language;
}) {
  const [mode, setMode] = useState("Sign in"),
    [email, setEmail] = useState(""),
    [phone, setPhone] = useState(""),
    [password, setPassword] = useState(""),
    [confirmPassword, setConfirmPassword] = useState(""),
    [address, setAddress] = useState(""),
    [city, setCity] = useState(""),
    [state, setState] = useState(""),
    [postalCode, setPostalCode] = useState(""),
    [name, setName] = useState(""),
    [farmName, setFarmName] = useState(""),
    [role, setRole] = useState("Farmer");
  const [challenge, setChallenge] = useState(""),
    [code, setCode] = useState(""),
    [devCode, setDevCode] = useState(""),
    [purpose, setPurpose] = useState("verify"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const submit = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (challenge) {
        if (purpose === "reset") {
          await api.request("/auth/reset-password", "POST", {
            challengeId: challenge,
            code,
            password,
          });
          setChallenge("");
          setMode("Sign in");
          setMessage("Password changed. Sign in with your new password.");
        } else onAuthenticated((await api.verify(challenge, code)).user);
      } else if (mode === "Sign in")
        onAuthenticated((await api.login(email.trim(), password)).user);
      else if (mode === "Register") {
        if (!confirmPassword || password !== confirmPassword)
          throw new Error(
            "Passwords do not match. Re-enter your password in Confirm password.",
          );
        if (
          postalCode.trim() &&
          !/^[A-Za-z0-9][A-Za-z0-9 -]{1,11}$/.test(postalCode.trim())
        )
          throw new Error(
            "Enter a valid postal code (2?12 letters or digits).",
          );
        const contact = phone.trim().replace(/[\s()-]/g, "");
        if (contact && !/^\+?[0-9]{7,15}$/.test(contact))
          throw new Error(
            "Enter a valid phone number with 7–15 digits, optionally starting with + and a country code.",
          );
        const apiRole: Exclude<ApiRole, "administrator"> =
          role === "Farmer"
            ? "producer"
            : role === "Consumer"
              ? "consumer"
              : "delivery";
        const r = await api.register({
          name,
          email: email.trim(),
          phone: contact,
          language,
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
          password,
          role: apiRole,
          ...(apiRole === "producer" ? { farmName } : {}),
        });
        setChallenge(r.challengeId);
        setPurpose("verify");
        setDevCode(r.developmentCode || "");
      } else {
        const p = mode === "Recover account" ? "reset" : "verify";
        const r = await api.request<{
          challengeId: string;
          developmentCode?: string;
        }>("/auth/request-code", "POST", { email: email.trim(), purpose: p });
        setChallenge(r.challengeId);
        setPurpose(p);
        setDevCode(r.developmentCode || "");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <View
      style={[s.panel, { maxWidth: 620, width: "100%", alignSelf: "center" }]}
    >
      <Text style={s.heading}>Welcome to Harvest</Text>
      <Text style={s.body}>
        Sign in to your account or register your farm to sell your produce.
      </Text>
      {!busy && (
        <Chips
          options={["Sign in", "Register", "Verify email", "Recover account"]}
          value={mode}
          onChange={(m) => {
            setMode(m);
            setChallenge("");
            setCode("");
            setDevCode("");
            setError("");
          }}
        />
      )}
      <Feedback error={error} />
      {!!message && <Text style={s.body}>{message}</Text>}
      {challenge ? (
        <>
          <Text style={s.body}>
            Enter the verification code sent to your email.
          </Text>
          {!!devCode && (
            <Text style={s.badge}>Development-only code: {devCode}</Text>
          )}
          <Field
            label="Verification code"
            value={code}
            onChange={setCode}
            numeric
          />
          {purpose === "reset" && (
            <Field
              label="New password (at least 12 characters)"
              value={password}
              onChange={setPassword}
              secure
            />
          )}
        </>
      ) : (
        <>
          {mode === "Register" && (
            <>
              <Field label="Your full name" value={name} onChange={setName} />
              <Chips
                options={["Farmer", "Consumer", "Delivery partner"]}
                value={role}
                onChange={setRole}
              />
              {role === "Farmer" && (
                <Field
                  label="Farm name"
                  value={farmName}
                  onChange={setFarmName}
                />
              )}
            </>
          )}
          <Field label="Email address" value={email} onChange={setEmail} />
          {mode === "Register" && (
            <>
              <Field
                label="Phone number (optional)"
                value={phone}
                onChange={setPhone}
                phone
              />
              <Text style={s.label}>Address details (optional)</Text>
              <Field
                label="Street / village address"
                value={address}
                onChange={setAddress}
              />
              <Field label="City / village" value={city} onChange={setCity} />
              <Field label="State" value={state} onChange={setState} />
              <Field
                label="Postal / PIN code"
                value={postalCode}
                onChange={setPostalCode}
              />
            </>
          )}
          {mode === "Register" && <Text style={s.label}>Account security</Text>}
          {["Register", "Sign in"].includes(mode) && (
            <Field
              label="Password (at least 12 characters)"
              value={password}
              onChange={setPassword}
              secure
            />
          )}
          {mode === "Register" && (
            <Field
              label="Confirm password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              secure
            />
          )}
        </>
      )}
      <Button
        label={
          busy
            ? "Please wait…"
            : challenge
              ? "Verify code"
              : mode === "Sign in"
                ? "Sign in"
                : mode === "Register"
                  ? "Create account"
                  : "Send code"
        }
        disabled={busy}
        onPress={submit}
      />
      {onAdminSetup && (
        <Button
          secondary
          label="First administrator setup"
          disabled={busy}
          onPress={onAdminSetup}
        />
      )}
      {mode === "Register" && role === "Farmer" && (
        <Text style={s.muted}>
          After email verification, an administrator must approve your farmer
          account before you can publish products.
        </Text>
      )}
    </View>
  );
}
