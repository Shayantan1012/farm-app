import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { api } from "../../services/api";
import { Button } from "../../components/Button";
import { Feedback } from "../../components/Feedback";
import { s } from "../../styles/appStyles";
export function AdminOverview() {
  const [data, setData] = useState<Record<string, number> | null>(null),
    [error, setError] = useState("");
  const load = async () => {
    setError("");
    try {
      setData(await api.request("/admin/dashboard"));
    } catch (e) {
      setError((e as Error).message);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const metrics = {
    users: "Accounts",
    farmers: "Farmers",
    administrators: "Administrators",
    pendingApprovals: "Awaiting approval",
    activeListings: "Active products",
    orders: "Orders",
    completedOrders: "Delivered orders",
    activeDeliveries: "Active deliveries",
    openTickets: "Open support tickets",
  };
  return (
    <View style={{ gap: 12 }}>
      <Button secondary label="Refresh dashboard" onPress={load} />
      <Feedback error={error} loading={!data && !error} />
      {data && (
        <>
          <View style={s.wrap}>
            {Object.entries(metrics).map(([key, label]) => (
              <View key={key} style={[s.panel, { minWidth: 150, flexGrow: 1 }]}>
                <Text style={s.muted}>{label}</Text>
                <Text style={s.heading}>{data[key]}</Text>
              </View>
            ))}
          </View>
          <Text style={s.body}>
            Recorded cash collected: ₹{(data.collectedPaise / 100).toFixed(2)}
          </Text>
          <Text style={s.muted}>
            These are confirmed cash collections, not bank settlement records.
          </Text>
        </>
      )}
    </View>
  );
}
