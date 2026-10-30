import React, { useState } from "react";
import { View } from "react-native";
import { LocalizedText as Text } from "../../i18n/I18n";
import { ApiUser } from "../../services/api";
import { Chips } from "../../components/Chips";
import { AdministratorForm } from "../../components/admin/AdministratorForm";
import { AdminScreen } from "../AdminScreen";
import { OrdersScreen } from "../OrdersScreen";
import { SupportScreen } from "../SupportScreen";
import { AdminOverview } from "./AdminOverview";
import { AdminRecords } from "./AdminRecords";
import { s } from "../../styles/appStyles";
export function AdminWorkspace({ user }: { user: ApiUser }) {
  const [tab, setTab] = useState("Overview"),
    [notice, setNotice] = useState("");
  return (
    <View style={{ gap: 16 }}>
      <Text style={s.heading}>Administration</Text>
      <Chips
        options={[
          "Overview",
          "Users",
          "Farms",
          "Administrators",
          "Create administrator",
          "Products",
          "Orders",
          "Deliveries",
          "Support",
          "Reviews",
          "Activity",
        ]}
        value={tab}
        onChange={(v) => {
          setTab(v);
          setNotice("");
        }}
      />
      {!!notice && <Text style={s.badge}>{notice}</Text>}
      <View key={tab}>
        {tab === "Overview" && <AdminOverview />}
        {["Users", "Farms", "Administrators"].includes(tab) && (
          <AdminScreen
            currentUser={user}
            role={
              tab === "Farms"
                ? "producer"
                : tab === "Administrators"
                  ? "administrator"
                  : undefined
            }
          />
        )}
        {tab === "Create administrator" && (
          <AdministratorForm
            onCreated={() => {
              setTab("Administrators");
              setNotice(
                "Administrator created. They can now sign in using their credentials.",
              );
            }}
          />
        )}
        {tab === "Products" && <AdminRecords kind="products" />}
        {tab === "Reviews" && <AdminRecords kind="reviews" />}
        {tab === "Activity" && <AdminRecords kind="audit" />}
        {["Orders", "Deliveries"].includes(tab) && (
          <OrdersScreen user={user} deliveriesOnly={tab === "Deliveries"} />
        )}
        {tab === "Support" && <SupportScreen user={user} />}
      </View>
    </View>
  );
}
