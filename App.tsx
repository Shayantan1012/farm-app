import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  Image,
  useWindowDimensions,
} from "react-native";
import { LocalizedText as Text } from "./src/i18n/I18n";
import { StatusBar } from "expo-status-bar";
import { api, ApiUser, ApiProduct } from "./src/services/api";
import { Icon, IconName } from "./src/components/Icon";
import { Button } from "./src/components/Button";
import { MarketplaceScreen } from "./src/screens/MarketplaceScreen";
import { FarmerProductsScreen } from "./src/screens/FarmerProductsScreen";
import { AuthScreen } from "./src/screens/AuthScreen";
import { CartScreen, CartLine, cartItemCount } from "./src/screens/CartScreen";
import { OrdersScreen } from "./src/screens/OrdersScreen";
import { AccountScreen } from "./src/screens/AccountScreen";
import { AdminWorkspace } from "./src/screens/admin/AdminWorkspace";
import { AdminSetupScreen } from "./src/screens/admin/AdminSetupScreen";
import { SupportScreen } from "./src/screens/SupportScreen";
import { NotificationsScreen } from "./src/screens/NotificationsScreen";
import { s } from "./src/styles/appStyles";
import { green, muted } from "./src/theme/colors";
import { I18nProvider, Language, languages, useI18n } from "./src/i18n/I18n";
import { LanguageScreen } from "./src/screens/LanguageScreen";

function AppContent() {
  const { language, setLanguage } = useI18n();
  const wide = useWindowDimensions().width >= 1000;
  const [user, setUser] = useState<ApiUser | null>(null),
    [page, setPage] = useState("Explore"),
    [revision, setRevision] = useState(0),
    [notice, setNotice] = useState(""),
    [basketCount, setBasketCount] = useState(0);
  useEffect(() => api.onUnauthorized(() => {
    setUser(null);
    setBasketCount(0);
    setNotice("Your session ended. Please sign in again.");
    setPage("Sign in");
    setRevision((value) => value + 1);
  }), []);
  const refreshUser = async () => {
    setUser((await api.me()).user);
  };
  const authenticated = (u: ApiUser) => {
    void setLanguage(u.language).catch(() => {});
    setUser(u);
    setNotice("");
    if (u.role === "consumer") {
      void api
        .request<{ items: CartLine[] }>("/users/me/cart")
        .then(({ items }) => setBasketCount(cartItemCount(items)))
        .catch(() => setBasketCount(0));
    } else {
      setBasketCount(0);
    }
    setPage(
      u.role === "producer"
        ? "My products"
        : u.role === "administrator"
          ? "Admin"
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
      setBasketCount(0);
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
    const updated = await api.request<{ items: CartLine[] }>(
      "/users/me/cart",
      "PUT",
      { items },
    );
    setBasketCount(cartItemCount(updated.items));
    setNotice(p.name + " added to your basket.");
  };
  const nav: { label: string; icon: IconName }[] = [
    { label: "Explore", icon: "leaf-outline" },
    ...(user?.role === "producer"
      ? [{ label: "My products", icon: "grid-outline" as IconName }]
      : []),
    ...(user?.role === "administrator"
      ? [{ label: "Admin", icon: "people-outline" as IconName }]
      : []),
    ...(user
      ? [
          { label: "Orders", icon: "bag-handle-outline" as IconName },
          { label: "Account", icon: "person-outline" as IconName },
        ]
      : [{ label: "Sign in", icon: "person-outline" as IconName }]),
  ];
  const navigate = (p: string) => {
    setPage(!user && !["Explore", "Sign in", "Language", "Admin setup"].includes(p) ? "Sign in" : p);
    setNotice("");
  };
  const changeLanguage = async (next: Language) => {
    await setLanguage(next);
    if (user) {
      await api.request("/users/me", "PATCH", { language: next });
      setUser({ ...user, language: next });
    }
  };
  return (
    <View style={s.app}>
      <StatusBar style="dark" />
      {wide && (
        <View style={s.sidebar}>
          <View style={s.brand}>
            <View style={s.logo}>
              <Image
                source={require("./assets/harvest-logo.png")}
                style={s.logoImage}
                resizeMode="contain"
              />
            </View>
            <View>
              <Text style={s.brandText}>harvest.</Text>
              <Text style={s.brandSubtext}>LOCAL FARM MARKET</Text>
            </View>
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
          <View style={s.headerBrand}>
            <View style={s.headerLogo}>
              <Image
                source={require("./assets/harvest-logo.png")}
                style={s.headerLogoImage}
                resizeMode="contain"
              />
            </View>
            <View>
              <Text style={[s.brandText, { fontSize: wide ? 20 : 23 }]}>
                {wide ? user?.farmName || "Harvest marketplace" : "harvest."}
              </Text>
              {wide && (
                <Text style={s.headerCaption}>
                  Fresh produce, closer to home
                </Text>
              )}
            </View>
          </View>
          <View style={{ flex: 1 }} />
          {user ? (
            <View style={s.row}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Notifications"
                onPress={() => navigate("Notifications")}
                style={({ pressed }) => [
                  s.notificationButton,
                  pressed && { opacity: 0.65 },
                ]}
              >
                <Icon name="notifications-outline" color={green} />
              </Pressable>
              {user.role === "consumer" && (
                <Button
                  label="Basket"
                  badge={basketCount}
                  onPress={() => navigate("Basket")}
                />
              )}
            </View>
          ) : (
            <View style={s.row}>
              <Button
                secondary
                label={
                  languages.find(({ code }) => code === language)?.nativeName ||
                  "Language"
                }
                onPress={() => navigate("Language")}
              />
              <Button
                label="Sign in / Register"
                onPress={() => navigate("Sign in")}
              />
            </View>
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
              style={[s.panel, { backgroundColor: "#E4F3DC" }]}
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
              <AuthScreen
                language={language}
                onAuthenticated={authenticated}
                onAdminSetup={() => navigate("Admin setup")}
              />
            )}
            {page === "Language" && (
              <LanguageScreen onChange={changeLanguage} />
            )}
            {page === "Admin setup" && !user && (
              <AdminSetupScreen onSignIn={() => navigate("Sign in")} />
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
                defaultName={user.name}
                defaultPhone={user.phone}
                onCountChange={setBasketCount}
                onOrdered={() => {
                  setBasketCount(0);
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
                  label="Language"
                  onPress={() => navigate("Language")}
                />
                <View style={{ height: 12 }} />
                <Button
                  secondary
                  label="Help & support"
                  onPress={() => navigate("Support")}
                />
              </>
            )}
            {page === "Admin" && user?.role === "administrator" && (
              <AdminWorkspace user={user} />
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

export default function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}
