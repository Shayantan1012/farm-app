import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { green } from "../theme/colors";

export type IconName = React.ComponentProps<typeof Ionicons>["name"];
export function Icon({
  name,
  size = 21,
  color = green,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}
