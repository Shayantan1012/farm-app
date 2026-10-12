import React, { useEffect, useRef, useState } from "react";
import { View, Text, Linking } from "react-native";
import { WebView } from "react-native-webview";
import { MAP_URL, MapProps, validPoint } from "./types";
export function LocationMap({ markers, onSelect }: MapProps) {
  const ref = useRef<WebView>(null);
  const [ready, setReady] = useState(false),
    [error, setError] = useState("");
  const data = JSON.stringify({
    type: "pins",
    markers,
    selectable: !!onSelect,
  });
  useEffect(() => {
    if (ready)
      ref.current?.injectJavaScript(`window.harvestMap(${data});true;`);
  }, [ready, data]);
  return (
    <View style={{ height: 340, borderRadius: 12, overflow: "hidden" }}>
      <WebView
        ref={ref}
        source={{ uri: MAP_URL }}
        style={{ flex: 1 }}
        onLoadStart={() => setReady(false)}
        onError={() =>
          setError("Cannot load map. Check the farm server connection.")
        }
        onShouldStartLoadWithRequest={(r) => {
          if (r.url === MAP_URL || r.url === "about:blank") return true;
          if (r.url.startsWith("https://www.openstreetmap.org/"))
            void Linking.openURL(r.url).catch(() =>
              setError("Could not open the map attribution link."),
            );
          return false;
        }}
        onMessage={(event) => {
          try {
            const value = JSON.parse(event.nativeEvent.data);
            if (value.type === "ready") {
              setReady(true);
              setError("");
            }
            if (value.type === "select" && validPoint(value))
              onSelect?.({
                latitude: value.latitude,
                longitude: value.longitude,
              });
          } catch {}
        }}
      />
      {!!error && <Text accessibilityRole="alert">{error}</Text>}
    </View>
  );
}
