import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { api, ApiUser, ApiProduct } from "./src/services/api";
import { Icon, IconName } from "./src/components/Icon";
import { Button } from "./src/components/Button";
import { MarketplaceScreen } from "./src/screens/MarketplaceScreen";
import { FarmerProductsScreen } from "./src/screens/FarmerProductsScreen";
import { AuthScreen } from "./src/screens/AuthScreen";
import { CartScreen, CartLine } from "./src/screens/CartScreen";
import { OrdersScreen } from "./src/screens/OrdersScreen";
import { AccountScreen } from "./src/screens/AccountScreen";
import { AdminScreen } from "./src/screens/AdminScreen";
import { SupportScreen } from "./src/screens/SupportScreen";
import { NotificationsScreen } from "./src/screens/NotificationsScreen";
import { s } from "./src/styles/appStyles";
import { green, muted } from "./src/theme/colors";

export default function App() {
  const wide = useWindowDimensions().width >= 1000;
  const [user, setUser] = useState<ApiUser | null>(null),
    [page, setPage] = useState("Explore"),
    [revision, setRevision] = useState(0),
    [notice, setNotice] = useState("");
  const refreshUser = async () => {
    setUser((await api.me()).user);
  };
  const authenticated = (u: ApiUser) => {
    setUser(u);
    setNotice("");
    setPage(
      u.role === "producer"
        ? "My products"
        : u.role === "administrator"
          ? "Users"
          : "Explore",
    );
  };
  const logout = async () => {
    try {
      await api.logout();
    } catch {
    } finally {
      setUser(null);
      setNotice("");
      setPage("Explore");
      setRevision((r) => r + 1);
    }
  };
  const add = async (p: ApiProduct) => {
    if (!user) {
      setPage("Sign in");
      return;
    }
    const r = await api.request<{ items: CartLine[] }>("/users/me/cart");
    const items = r.items
      .filter((l) => l.product)
      .map((l) => ({ productId: l.product!.id, quantity: l.quantity }));
    const existing = items.find((l) => l.productId === p.id);
    if (existing) existing.quantity += 1;
    else items.push({ productId: p.id, quantity: p.minOrder });
    await api.request("/users/me/cart", "PUT", { items });
    setNotice(p.name + " added to your basket.");
  };
  const nav: { label: string; icon: IconName }[] = [
    { label: "Explore", icon: "leaf-outline" },
    ...(user?.role === "producer"
      ? [{ label: "My products", icon: "grid-outline" as IconName }]
      : []),
    ...(user?.role === "administrator"
      ? [{ label: "Users", icon: "people-outline" as IconName }]
      : []),
    ...(user
      ? [
          { label: "Orders", icon: "bag-handle-outline" as IconName },
          { label: "Account", icon: "person-outline" as IconName },
        ]
      : [{ label: "Sign in", icon: "person-outline" as IconName }]),
  ];
  const navigate = (p: string) => {
    setPage(p);
    setNotice("");
  };
  return (
    <View style={s.app}>
      <StatusBar style="dark" />
      {wide && (
        <View style={s.sidebar}>
          <View style={s.brand}>
            <View style={s.logo}>
              <Icon name="leaf" color="#fff" />
            </View>
            <Text style={s.brandText}>harvest.</Text>
          </View>
          <Text style={s.sidebarCaption}>FRESH FROM YOUR COMMUNITY</Text>
          <View style={{ height: 32 }} />
          {nav.map((n) => (
            <Pressable
              accessibilityRole="button"
              key={n.label}
              onPress={() => navigate(n.label)}
              style={[s.navItem, page === n.label && s.navActive]}
            >
              <Icon name={n.icon} />
              <Text style={s.navText}>{n.label}</Text>
            </Pressable>
          ))}
          <View style={{ flex: 1 }} />
          {user && (
            <>
              <Button
                secondary
                label="Saved products"
                onPress={() => navigate("Saved")}
              />
              <View style={{ height: 8 }} />
              <Button
                secondary
                label="Help & support"
                onPress={() => navigate("Support")}
              />
            </>
          )}
          <View style={s.profile}>
            <Text style={s.label}>
              {user ? user.name : "Welcome to Harvest"}
            </Text>
          </View>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <View style={[s.topbar, { paddingHorizontal: wide ? 34 : 16 }]}>
          <Text style={[s.brandText, { fontSize: wide ? 22 : 25 }]}>
            {wide ? user?.farmName || "Your farm marketplace" : "harvest."}
          </Text>
          <View style={{ flex: 1 }} />
          {user ? (
            <View style={s.row}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Notifications"
                onPress={() => navigate("Notifications")}
              >
                <Icon name="notifications-outline" />
              </Pressable>
              {user.role === "consumer" && (
                <Button label="Basket" onPress={() => navigate("Basket")} />
              )}
            </View>
          ) : (
            <Button
              label="Sign in / Register"
              onPress={() => navigate("Sign in")}
            />
          )}
        </View>
        <ScrollView
          contentContainerStyle={[s.content, { padding: wide ? 32 : 18 }]}
          keyboardShouldPersistTaps="handled"
        >
          {!!notice && (
            <Pressable
              accessibilityRole="button"
              onPress={() => setNotice("")}
              style={[s.panel, { backgroundColor: "#EDF4E6" }]}
            >
              <Text style={s.label}>{notice}</Text>
            </Pressable>
          )}
          <View key={(user?.id || "guest") + ":" + page}>
            {(page === "Explore" || page === "Saved") && (
              <MarketplaceScreen
                key={revision + page}
                user={user}
                savedOnly={page === "Saved"}
                onAdd={add}
                onSignIn={() => navigate("Sign in")}
                onUserChanged={refreshUser}
              />
            )}
            {page === "Sign in" && (
              <AuthScreen onAuthenticated={authenticated} />
            )}
            {page === "My products" && user?.role === "producer" && (
              <FarmerProductsScreen
                user={user}
                onRefreshAccount={refreshUser}
                onChanged={() => setRevision((r) => r + 1)}
              />
            )}
            {page === "Basket" && user?.role === "consumer" && (
              <CartScreen
                defaultAddress={user.address}
                onOrdered={() => {
                  setRevision((r) => r + 1);
                  navigate("Orders");
                }}
              />
            )}
            {page === "Orders" && user && <OrdersScreen user={user} />}
            {page === "Account" && user && (
              <>
                <AccountScreen
                  user={user}
                  onUserChanged={refreshUser}
                  onLogout={() => void logout()}
                />
                <Button
                  secondary
                  label="Saved products"
                  onPress={() => navigate("Saved")}
                />
                <View style={{ height: 12 }} />
                <Button
                  secondary
                  label="Help & support"
                  onPress={() => navigate("Support")}
                />
              </>
            )}
            {page === "Users" && user?.role === "administrator" && (
              <AdminScreen />
            )}
            {page === "Support" && user && <SupportScreen user={user} />}
            {page === "Notifications" && user && <NotificationsScreen />}
          </View>
        </ScrollView>
        {!wide && (
          <View style={s.mobileNav}>
            {nav.map((n) => (
              <Pressable
                accessibilityRole="button"
                key={n.label}
                onPress={() => navigate(n.label)}
                style={s.mobileNavItem}
              >
                <Icon name={n.icon} color={page === n.label ? green : muted} />
                <Text
                  style={{
                    fontSize: 11,
                    color: page === n.label ? green : muted,
                  }}
                >
                  {n.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
