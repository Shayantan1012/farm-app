import React from "react";
import { View, Text } from "react-native";
import { Button } from "../Button";
export function Pagination({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (page: number) => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        gap: 12,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <Button
        secondary
        label="Previous page"
        disabled={page <= 1}
        onPress={() => onChange(page - 1)}
      />
      <Text>
        Page {page} · {total} records
      </Text>
      <Button
        secondary
        label="Next page"
        disabled={page * 20 >= total}
        onPress={() => onChange(page + 1)}
      />
    </View>
  );
}
