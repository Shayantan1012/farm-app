import React from "react";
import { View } from "react-native";
import { LocalizedText as Text } from "../i18n/I18n";
import { ApiProduct } from "../services/api";
import { ProductPhoto } from "./ProductPhoto";
import { Button } from "./Button";
import { s } from "../styles/appStyles";
export function ProductCard({
  product,
  onView,
  onAdd,
  onSave,
  saved,
}: {
  product: ApiProduct;
  onView: () => void;
  onAdd?: () => void;
  onSave?: () => void;
  saved?: boolean;
}) {
  return (
    <View
      style={[s.productCard, { flexGrow: 1, flexBasis: 260, maxWidth: 480 }]}
    >
      <ProductPhoto image={product.image} />
      <View style={{ padding: 18, gap: 10 }}>
        <Text style={s.badge}>{product.method}</Text>
        <Text style={s.cardTitle}>{product.name}</Text>
        <Text style={s.muted}>
          {product.farm} · {product.location}
        </Text>
        <Text style={s.price}>
          ₹{product.price.toLocaleString("en-IN")} / kg
        </Text>
        <Text style={s.muted}>
          {product.stock} kg available · Minimum {product.minOrder} kg
        </Text>
        <View style={s.wrap}>
          <Button label="View details" secondary onPress={onView} />
          {onAdd && <Button label={"Add " + product.name} onPress={onAdd} />}
        </View>
        {onSave && (
          <Button
            secondary
            label={saved ? "Remove saved product" : "Save product"}
            onPress={onSave}
          />
        )}
      </View>
    </View>
  );
}
