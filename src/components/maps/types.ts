import { API_URL } from "../../services/api";
export type Point = { latitude: number; longitude: number };
export type Marker = Point & { label: string };
export type MapProps = { markers: Marker[]; onSelect?: (point: Point) => void };
export const MAP_URL = API_URL.replace(/\/api\/?$/, "") + "/map/";
export function validPoint(p: unknown): p is Point {
  const v = p as Point;
  return (
    !!v &&
    Number.isFinite(v.latitude) &&
    Number.isFinite(v.longitude) &&
    Math.abs(v.latitude) <= 90 &&
    Math.abs(v.longitude) <= 180
  );
}
