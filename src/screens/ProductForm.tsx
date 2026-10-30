import { LocationPicker } from "../components/maps/LocationPicker";
import { Point } from "../components/maps/types";
import React, { useRef, useState } from "react";
import { View, Text } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { api, ApiProduct, ProductInput } from "../services/api";
import { Field } from "../components/Field";
import { Button } from "../components/Button";
import { Chips } from "../components/Chips";
import { Feedback } from "../components/Feedback";
import { ProductPhoto } from "../components/ProductPhoto";
import { s } from "../styles/appStyles";
export function ProductForm({
  product,
  onSaved,
  onCancel,
}: {
  product?: ApiProduct;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(product?.name || ""),
    [price, setPrice] = useState(product ? String(product.price) : ""),
    [stock, setStock] = useState(product ? String(product.stock) : ""),
    [location, setLocation] = useState(product?.location || "");
  const [category, setCategory] = useState(product?.category || "Vegetables"),
    [method, setMethod] = useState(product?.method || "Organic"),
    [harvest, setHarvest] = useState(product?.harvest || ""),
    [expiry, setExpiry] = useState(product?.expiry || ""),
    [minimum, setMinimum] = useState(String(product?.minOrder || 1));
  const [delivery, setDelivery] = useState(
    product?.deliveryOptions.length === 1
      ? product.deliveryOptions[0] === "pickup"
        ? "Pickup only"
        : "Delivery only"
      : "Delivery & pickup",
  );
  const [image, setImage] = useState(product?.image || ""),
    [photo, setPhoto] = useState(""),
    [preview, setPreview] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [pickupLocation, setPickupLocation] = useState<Point | undefined>(
    product?.pickupLocation,
  );
  const saving = useRef(false);
  const choose = async () => {
    setError("");
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        base64: true,
        quality: 0.75,
        allowsEditing: true,
      });
      if (!result.canceled) {
        const asset = result.assets[0];
        if (!asset.base64)
          throw new Error(
            "Could not read this photo. Choose a JPEG or PNG image.",
          );
        if (asset.base64.length > 7_000_000)
          throw new Error("Choose a photo smaller than 5 MB.");
        setPhoto(asset.base64);
        setPreview(asset.uri);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const save = async () => {
    if (saving.current) return;
    setError("");
    const validDate = (v: string) =>
      /^\d{4}-\d{2}-\d{2}$/.test(v) &&
      !Number.isNaN(Date.parse(v)) &&
      new Date(v).toISOString().slice(0, 10) === v;
    if (
      name.trim().length < 2 ||
      location.trim().length < 2 ||
      !price.trim() ||
      !Number.isFinite(Number(price)) ||
      Number(price) <= 0 ||
      !/^\d+$/.test(stock) ||
      !/^\d+$/.test(minimum) ||
      Number(minimum) < 1 ||
      !validDate(harvest) ||
      (expiry && (!validDate(expiry) || expiry < harvest))
    ) {
      setError(
        "Enter the product name, location, a positive price, whole-number stock and minimum quantity, and valid dates (YYYY-MM-DD).",
      );
      return;
    }
    if (!pickupLocation) {
      setError("Select the farm pickup map pin.");
      return;
    }
    saving.current = true;
    setBusy(true);
    try {
      let savedImage = image;
      if (photo) {
        savedImage = (await api.uploadImage(photo)).image;
        setImage(savedImage);
        setPhoto("");
      }
      const input: ProductInput = {
        name: name.trim(),
        price: Number(price),
        stock: Number(stock),
        minOrder: Number(minimum),
        location: location.trim(),
        pickupLocation,
        category,
        method,
        harvest,
        expiry,
        image: savedImage,
        active: product?.active ?? true,
        deliveryOptions:
          delivery === "Pickup only"
            ? ["pickup"]
            : delivery === "Delivery only"
              ? ["delivery"]
              : ["delivery", "pickup"],
      };
      await api.saveProduct(input, product?.id);
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      saving.current = false;
    }
  };
  return (
    <View style={s.panel}>
      <Text style={s.heading}>
        {product ? "Edit product" : "Add your product"}
      </Text>
      <Feedback error={error} />
      <Field label="Product name" value={name} onChange={setName} />
      <Field
        label="Price per kg (₹)"
        value={price}
        onChange={setPrice}
        numeric
      />
      <Field
        label="Available stock (kg)"
        value={stock}
        onChange={setStock}
        numeric
      />
      <Field
        label="Minimum order (kg)"
        value={minimum}
        onChange={setMinimum}
        numeric
      />
      <Field label="Farm location" value={location} onChange={setLocation} />
      <LocationPicker
        label="Farm pickup"
        value={pickupLocation}
        onChange={setPickupLocation}
        onAddressChange={setLocation}
      />
      <Text style={s.label}>Category</Text>
      <Chips
        options={["Vegetables", "Leafy greens", "Roots & tubers"]}
        value={category}
        onChange={setCategory}
      />
      <Text style={s.label}>Farming method</Text>
      <Chips
        options={["Organic", "Naturally grown", "Conventionally grown"]}
        value={method}
        onChange={setMethod}
      />
      <Field
        label="Harvest date (YYYY-MM-DD)"
        value={harvest}
        onChange={setHarvest}
      />
      <Field
        label="Expiry date (optional, YYYY-MM-DD)"
        value={expiry}
        onChange={setExpiry}
      />
      <Chips
        options={["Delivery & pickup", "Pickup only", "Delivery only"]}
        value={delivery}
        onChange={setDelivery}
      />
      <ProductPhoto image={preview || image} style={{ borderRadius: 12 }} />
      <Button
        secondary
        label="Choose product photo"
        disabled={busy}
        onPress={choose}
      />
      {image || preview ? (
        <Button
          secondary
          label="Remove photo"
          disabled={busy}
          onPress={() => {
            setImage("");
            setPhoto("");
            setPreview("");
          }}
        />
      ) : null}
      <Text style={s.muted}>
        Your photo will be stored with the farm server. No stock image is added
        if you leave this blank.
      </Text>
      <Button
        label={busy ? "Saving product…" : "Save product"}
        disabled={busy}
        onPress={save}
      />
      <Button secondary label="Cancel" disabled={busy} onPress={onCancel} />
    </View>
  );
}
