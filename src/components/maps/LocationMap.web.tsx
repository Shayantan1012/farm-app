import React, { useEffect, useRef, useState } from "react";
import { MAP_URL, MapProps, validPoint } from "./types";
export function LocationMap({ markers, onSelect }: MapProps) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const data = JSON.stringify({
    type: "pins",
    markers,
    selectable: !!onSelect,
  });
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (
        event.source !== ref.current?.contentWindow ||
        event.origin !== new URL(MAP_URL).origin
      )
        return;
      if (event.data?.type === "ready") setReady(true);
      if (event.data?.type === "select" && validPoint(event.data))
        onSelect?.({
          latitude: event.data.latitude,
          longitude: event.data.longitude,
        });
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [onSelect]);
  useEffect(() => {
    if (ready)
      ref.current?.contentWindow?.postMessage(
        JSON.parse(data),
        new URL(MAP_URL).origin,
      );
  }, [ready, data]);
  return (
    <iframe
      ref={ref}
      title="Order location map"
      src={MAP_URL}
      onLoad={() => setReady(true)}
      style={{ width: "100%", height: 340, border: 0, borderRadius: 12 }}
    />
  );
}
