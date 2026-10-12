import React, { useState, useEffect } from "react";
import { View, Text, Image, StyleProp, ViewStyle } from "react-native";
import { Icon } from "./Icon";
import { imageUrl } from "../services/api";
import { s } from "../styles/appStyles";
export function ProductPhoto({
  image,
  style,
}: {
  image?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [image]);
  return (
    <View
      style={[
        {
          height: 175,
          backgroundColor: "#EDF2E7",
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      {image && !failed ? (
        <Image
          accessibilityLabel="Farmer's product photo"
          source={{ uri: imageUrl(image) }}
          onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        <>
          <Icon name="leaf-outline" size={35} />
          <Text style={s.muted}>
            {failed ? "Photo unavailable" : "No photo added"}
          </Text>
        </>
      )}
    </View>
  );
}
