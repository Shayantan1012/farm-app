import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import * as Location from "expo-location";
import { api } from "../services/api";
import { Point } from "../components/maps/types";
export type Tracking = {
  orderId: string;
  status: string;
  method: string;
  pickupAddress: string;
  destinationAddress: string;
  pickup: Point | null;
  destination: Point | null;
  driver: Point | null;
  recordedAt: string | null;
  accuracy: number | null;
  sharing: boolean;
  fresh: boolean;
};
export function useOrderTracking(orderId: string) {
  const [data, setData] = useState<Tracking | null>(null),
    [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [sharing, setSharing] = useState(false),
    [busy, setBusy] = useState(false);
  const control = useRef({
    mounted: true,
    generation: 0,
    session: "",
    watcher: null as Location.LocationSubscription | null,
    publishing: false,
    lastSent: 0,
    starting: false,
  });
  const path = "/orders/" + orderId + "/tracking";
  const stop = async () => {
    const c = control.current;
    c.generation++;
    c.watcher?.remove();
    c.watcher = null;
    const session = c.session;
    c.session = "";
    if (c.mounted) {
      setSharing(false);
      setBusy(false);
    }
    if (session)
      try {
        await api.request(path + "/stop", "POST", { session });
      } catch {
        if (c.mounted)
          setError(
            "GPS stopped on this device. The server is unreachable; the last update will be marked stale within one minute.",
          );
      }
  };
  useEffect(() => {
    const c = control.current;
    c.mounted = true;
    let fetching = false;
    const load = async () => {
      if (
        fetching ||
        (AppState.currentState && AppState.currentState !== "active")
      )
        return;
      fetching = true;
      try {
        const result = await api.request<Tracking>(path);
        if (c.mounted) {
          setLoadError("");
          setData(result);
          if (result.status !== "Out for Delivery" && c.session) void stop();
        }
      } catch (e) {
        if (c.mounted) {
          setLoadError((e as Error).message);
          setData((old) => (old ? { ...old, fresh: false } : null));
        }
      } finally {
        fetching = false;
      }
    };
    void load();
    const timer = setInterval(load, 10000);
    const listener = AppState.addEventListener("change", (state) => {
      if (state !== "active") void stop();
      else void load();
    });
    return () => {
      c.mounted = false;
      clearInterval(timer);
      listener.remove();
      void stop();
    };
  }, [orderId]);
  const start = async () => {
    const c = control.current;
    if (c.starting || c.session) return;
    c.starting = true;
    setBusy(true);
    setError("");
    const generation = ++c.generation;
    let session = "";
    try {
      if (
        (await Location.requestForegroundPermissionsAsync()).status !==
        "granted"
      )
        throw new Error(
          "Allow location access to share your delivery position.",
        );
      if (!c.mounted || generation !== c.generation) return;
      session = (
        await api.request<{ session: string }>(path + "/start", "POST")
      ).session;
      if (!c.mounted || generation !== c.generation) {
        await api.request(path + "/stop", "POST", { session });
        return;
      }
      c.session = session;
      c.lastSent = 0;
      const watcher = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 5,
        },
        (position) => {
          if (
            !c.mounted ||
            c.session !== session ||
            generation !== c.generation ||
            c.publishing ||
            Date.now() - c.lastSent < 5000
          )
            return;
          c.publishing = true;
          c.lastSent = Date.now();
          void api
            .request(path + "/location", "PUT", {
              session,
              point: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              },
              accuracy: position.coords.accuracy,
              recordedAt: new Date(position.timestamp).toISOString(),
            })
            .then(() => {
              if (c.mounted && c.session === session) setError("");
            })
            .catch(async (e) => {
              if (c.session === session) {
                await stop();
                if (c.mounted)
                  setError("Location sharing stopped: " + (e as Error).message);
              }
            })
            .finally(() => {
              c.publishing = false;
            });
        },
        (reason) => {
          void stop();
          if (c.mounted) setError("GPS unavailable: " + reason);
        },
      );
      if (!c.mounted || generation !== c.generation) watcher.remove();
      else {
        c.watcher = watcher;
        setSharing(true);
      }
    } catch (e) {
      await stop();
      if (c.mounted) setError((e as Error).message);
    } finally {
      c.starting = false;
      if (c.mounted) setBusy(false);
    }
  };
  return { data, error: error || loadError, sharing, busy, start, stop };
}
