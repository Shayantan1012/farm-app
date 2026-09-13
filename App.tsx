import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  Modal,
  useWindowDimensions,
  Switch,
  StyleSheet,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { products as seed, Product, Order, stages } from "./src/data";
import { s } from "./src/styles/appStyles";
import { green, ink, muted } from "./src/theme/colors";
import { Icon , IconName } from "./src/components/Icon";
import { Button } from "./src/components/Button";
import { Field } from "./src/components/Field";
import { Chips } from "./src/components/Chips";
const money = (n: number) => "₹" + n.toLocaleString("en-IN");
const uid = () =>
  Date.now().toString(36).toUpperCase() +
  Math.random().toString(36).slice(2, 5).toUpperCase();
type Ticket = { id: string; text: string; status: string };
export default function App() {
  const { width } = useWindowDimensions(),
    wide = width >= 1000;
  const [role, setRole] = useState("Consumer"),
    [page, setPage] = useState("Explore"),
    [items, setItems] = useState<Product[]>(seed),
    [cart, setCart] = useState<Record<string, number>>({}),
    [favorites, setFavorites] = useState<string[]>([]),
    [orders, setOrders] = useState<Order[]>([]);
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("All produce"),
    [method, setMethod] = useState("All methods"),
    [sort, setSort] = useState("Recommended"),
    [maxPrice, setMaxPrice] = useState(""),
    [nearby, setNearby] = useState(false);
  const [modal, setModal] = useState(""),
    [selected, setSelected] = useState<Product | null>(null),
    [notice, setNotice] = useState(""),
    [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("Alex Morgan"),
    [address, setAddress] = useState("24 Lake Road, Kolkata 700029"),
    [location, setLocation] = useState("Kolkata, 700029"),
    [notifications, setNotifications] = useState(true),
    [read, setRead] = useState(false);
  const [delivery, setDelivery] = useState("Home delivery"),
    [slot, setSlot] = useState("Tomorrow, 7–9 AM"),
    [payment, setPayment] = useState("Cash on delivery"),
    [coupon, setCoupon] = useState(""),
    [discount, setDiscount] = useState(false);
  const [email, setEmail] = useState(""),
    [authMode, setAuthMode] = useState("Sign in"),
    [otp, setOtp] = useState(""),
    [authStep, setAuthStep] = useState(false),
    [signedIn, setSignedIn] = useState(false);
  const [draft, setDraft] = useState({
      name: "",
      price: "",
      stock: "",
      category: "Vegetables",
      method: "Organic",
      image: "",
      harvest: "2026-09-12",
    }),
    [editing, setEditing] = useState<string | null>(null);
  const [ticketText, setTicketText] = useState(""),
    [tickets, setTickets] = useState<Ticket[]>([]),
    [reason, setReason] = useState(""),
    [activeOrder, setActiveOrder] = useState<Order | null>(null),
    [message, setMessage] = useState(""),
    [messages, setMessages] = useState<Record<string, string[]>>({}),
    [rating, setRating] = useState("5"),
    [reviews, setReviews] = useState<Record<string, string>>({}),
    [approved, setApproved] = useState(false),
    [audit, setAudit] = useState<string[]>([]);
  useEffect(() => {
    AsyncStorage.getItem("harvest-demo-v1")
      .then((raw) => {
        if (raw) {
          const d = JSON.parse(raw);
          setItems(d.items || seed);
          setCart(d.cart || {});
          setFavorites(d.favorites || []);
          setOrders(d.orders || []);
          setTickets(d.tickets || []);
          setName(d.name || "Alex Morgan");
          setAddress(d.address || "24 Lake Road, Kolkata 700029");
        }
      })
      .catch(() =>
        setNotice(
          "Local storage is unavailable. Changes last for this session.",
        ),
      )
      .finally(() => setLoaded(true));
  }, []);
  useEffect(() => {
    if (loaded)
      AsyncStorage.setItem(
        "harvest-demo-v1",
        JSON.stringify({
          items,
          cart,
          favorites,
          orders,
          tickets,
          name,
          address,
        }),
      ).catch(() => setNotice("Could not save changes on this device."));
  }, [loaded, items, cart, favorites, orders, tickets, name, address]);
  useEffect(() => {
    if (notice) {
      const t = setTimeout(() => setNotice(""), 4000);
      return () => clearTimeout(t);
    }
  }, [notice]);
  const toast = (v: string) => setNotice(v),
    navigate = (p: string) => {
      setPage(p);
      setQuery("");
    };
  const toggleFavorite = (id: string) =>
    setFavorites((f) =>
      f.includes(id) ? f.filter((x) => x !== id) : [...f, id],
    );
  const add = (p: Product, delta = 1) => {
    const n = (cart[p.id] || 0) + delta;
    if (n > p.stock) return toast("Only " + p.stock + " kg available.");
    if (!p.active && delta > 0) return toast("This listing is paused.");
    setCart((c) => {
      const next = { ...c };
      if (n <= 0) delete next[p.id];
      else next[p.id] = n;
      return next;
    });
  };
  const cartItems = items.filter((p) => cart[p.id] > 0),
    count = Object.values(cart).reduce((a, b) => a + b, 0),
    subtotal = cartItems.reduce((a, p) => a + p.price * cart[p.id], 0),
    fee = delivery === "Farm pickup" || subtotal >= 499 ? 0 : 35,
    savings = discount ? Math.round(subtotal * 0.1) : 0,
    total = subtotal + fee - savings;
  const filtered = items
    .filter(
      (p) =>
        p.active &&
        p.stock > 0 &&
        (page !== "Saved" || favorites.includes(p.id)) &&
        (category === "All produce" || p.category === category) &&
        (method === "All methods" || p.method === method) &&
        (!maxPrice || p.price <= Number(maxPrice)) &&
        (!nearby || p.distance <= 3) &&
        (p.name + " " + p.farm + " Kolkata")
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "Price: low to high"
        ? a.price - b.price
        : sort === "Nearest first"
          ? a.distance - b.distance
          : sort === "Top rated"
            ? b.rating - a.rating
            : sort === "Freshest first"
              ? b.harvest.localeCompare(a.harvest)
              : 0,
    );
  const placeOrder = () => {
    if (!cartItems.length) return;
    if (delivery === "Home delivery" && address.trim().length < 10)
      return toast("Enter a complete delivery address.");
    if (cartItems.some((p) => !p.active || cart[p.id] > p.stock))
      return toast("Stock changed. Please update your basket.");
    const farms = [...new Set(cartItems.map((p) => p.farm))];
    let allocatedDiscount = 0;
    const created: Order[] = farms.map((farm, i) => {
      const lines = cartItems
        .filter((p) => p.farm === farm)
        .map((p) => ({ product: { ...p }, qty: cart[p.id] }));
      const part = lines.reduce((a, l) => a + l.product.price * l.qty, 0);
      const farmDiscount =
        i === farms.length - 1
          ? savings - allocatedDiscount
          : Math.floor((savings * part) / subtotal);
      allocatedDiscount += farmDiscount;
      return {
        id: "HV-" + uid() + "-" + (i + 1),
        farm,
        items: lines,
        total: part + (i === 0 ? fee : 0) - farmDiscount,
        status: "Pending",
        method: delivery,
        address,
        slot,
        payment:
          payment === "Cash on delivery" ? "Payment due" : "Simulated paid",
      };
    });
    setOrders((o) => [...created, ...o]);
    setItems((ps) =>
      ps.map((p) => ({ ...p, stock: p.stock - (cart[p.id] || 0) })),
    );
    setCart({});
    setModal("");
    navigate("Orders");
    toast("Demo order placed. Each farm has its own order.");
  };
  const updateOrder = (o: Order, status: string) => {
    setOrders((os) => os.map((x) => (x.id === o.id ? { ...x, status } : x)));
    toast("Order " + status.toLowerCase() + ".");
  };
  const cancelOrder = () => {
    if (!activeOrder || !reason.trim())
      return toast("Please add a cancellation reason.");
    const current = orders.find((o) => o.id === activeOrder.id);
    if (!current || ["Cancelled", "Delivered"].includes(current.status)) return;
    setItems((ps) =>
      ps.map((p) => ({
        ...p,
        stock:
          p.stock +
          (current.items.find((l) => l.product.id === p.id)?.qty || 0),
      })),
    );
    setOrders((os) =>
      os.map((o) =>
        o.id === current.id ? { ...o, status: "Cancelled", reason } : o,
      ),
    );
    setModal("");
    toast("Cancelled. Stock restored; refunds are simulated.");
  };
  const startListing = (p?: Product) => {
    setEditing(p?.id || null);
    setDraft(
      p
        ? {
            name: p.name,
            price: String(p.price),
            stock: String(p.stock),
            category: p.category,
            method: p.method,
            image: p.image,
            harvest: p.harvest,
          }
        : {
            name: "",
            price: "",
            stock: "",
            category: "Vegetables",
            method: "Organic",
            image: "",
            harvest: "2026-09-12",
          },
    );
    setModal("listing");
  };
  const saveListing = () => {
    if (
      !draft.name.trim() ||
      !Number.isFinite(Number(draft.price)) ||
      Number(draft.price) <= 0 ||
      !/^\d+$/.test(draft.stock) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(draft.harvest) ||
      Number.isNaN(Date.parse(draft.harvest))
    )
      return toast(
        "Add a name, positive price, whole-number stock and valid harvest date.",
      );
    const p: Product = {
      id: editing || uid(),
      name: draft.name,
      farm: items.find((x) => x.id === editing)?.farm || "Green Valley Farm",
      category: draft.category,
      method: draft.method,
      price: Number(draft.price),
      stock: Number(draft.stock),
      image: draft.image || seed[0].image,
      distance: 2.4,
      rating: 5,
      active: true,
      harvest: draft.harvest,
    };
    setItems((ps) =>
      editing ? ps.map((x) => (x.id === editing ? p : x)) : [p, ...ps],
    );
    setModal("");
    toast("Listing saved.");
  };
  const pickImage = async () => {
    try {
      const r = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.7,
      });
      if (!r.canceled) setDraft((d) => ({ ...d, image: r.assets[0].uri }));
    } catch {
      toast("Image selection is unavailable on this device.");
    }
  };
  const nav: { label: string; icon: IconName }[] =
    role === "Consumer"
      ? [
          { label: "Explore", icon: "grid-outline" },
          { label: "Saved", icon: "heart-outline" },
          { label: "Orders", icon: "bag-handle-outline" },
          { label: "Account", icon: "person-outline" },
        ]
      : role === "Producer"
        ? [
            { label: "Dashboard", icon: "grid-outline" },
            { label: "Listings", icon: "leaf-outline" },
            { label: "Orders", icon: "bag-handle-outline" },
            { label: "Account", icon: "person-outline" },
          ]
        : role === "Delivery partner"
          ? [
              { label: "Deliveries", icon: "bicycle-outline" },
              { label: "Account", icon: "person-outline" },
            ]
          : [
              { label: "Overview", icon: "grid-outline" },
              { label: "Verification", icon: "shield-checkmark-outline" },
              { label: "Listings", icon: "leaf-outline" },
              { label: "Support", icon: "chatbubbles-outline" },
              { label: "Account", icon: "person-outline" },
            ];
  const empty = (title: string, sub: string) => (
    <View style={s.empty}>
      <Icon name="leaf-outline" size={40} />
      <Text style={s.cardTitle}>{title}</Text>
      <Text style={s.muted}>{sub}</Text>
    </View>
  );
  const orderCard = (o: Order) => (
    <View key={o.id} style={s.panel}>
      <View style={s.between}>
        <Text style={s.cardTitle}>{o.farm}</Text>
        <Text style={s.badge}>{o.status}</Text>
      </View>
      <Text style={s.muted}>
        {o.id} · {o.slot}
      </Text>
      {o.items.map((l) => (
        <Text key={l.product.id} style={s.body}>
          {l.product.name} × {l.qty} kg
        </Text>
      ))}
      <Text style={s.body}>
        {o.method} · {o.address}
      </Text>
      <Text style={s.cardTitle}>
        {money(o.total)} <Text style={s.muted}>· {o.payment}</Text>
      </Text>
      <View style={s.wrap}>
        {role === "Consumer" && (
          <>
            <Button
              secondary
              label="Track & receipt"
              onPress={() => {
                setActiveOrder(o);
                setModal("tracking");
              }}
            />
            {["Pending", "Accepted"].includes(o.status) && (
              <Button
                secondary
                label="Cancel order"
                onPress={() => {
                  setActiveOrder(o);
                  setReason("");
                  setModal("cancel");
                }}
              />
            )}
            <Button
              secondary
              label="Reorder"
              onPress={() => {
                const next = { ...cart };
                let skipped = false;
                o.items.forEach((l) => {
                  const p = items.find((p) => p.id === l.product.id);
                  if (p?.active && p.stock >= l.qty + (next[p.id] || 0))
                    next[p.id] = (next[p.id] || 0) + l.qty;
                  else skipped = true;
                });
                setCart(next);
                toast(
                  skipped
                    ? "Available items added; unavailable quantities skipped."
                    : "Items added to your basket.",
                );
              }}
            />
            {o.status === "Delivered" && (
              <Button
                secondary
                label={reviews[o.id] ? "Edit review" : "Write review"}
                onPress={() => {
                  setActiveOrder(o);
                  setMessage("");
                  setModal("review");
                }}
              />
            )}
          </>
        )}
        <Button
          secondary
          label="Order chat"
          onPress={() => {
            setActiveOrder(o);
            setMessage("");
            setModal("chat");
          }}
        />
        {role === "Producer" &&
          !["Cancelled", "Delivered"].includes(o.status) && (
            <>
              <Button
                label={
                  o.status === "Pending"
                    ? "Accept order"
                    : o.status === "Ready for Pickup" &&
                        o.method === "Farm pickup"
                      ? "Confirm pickup"
                      : "Next status"
                }
                onPress={() => {
                  if (
                    o.status === "Ready for Pickup" &&
                    o.method === "Farm pickup"
                  ) {
                    setActiveOrder(o);
                    setOtp("");
                    setModal("handover");
                  } else
                    updateOrder(
                      o,
                      stages[Math.min(stages.indexOf(o.status) + 1, 5)],
                    );
                }}
              />
              <Button
                secondary
                label="Reject / cancel"
                onPress={() => {
                  setActiveOrder(o);
                  setReason("");
                  setModal("cancel");
                }}
              />
            </>
          )}
      </View>
    </View>
  );
  return (
    <View style={s.app}>
      <StatusBar style="dark" />
      {wide && (
        <View style={s.sidebar}>
          <View style={s.brand}>
            <View style={s.logo}>
              <Icon name="leaf" color="#fff" size={25} />
            </View>
            <Text style={s.brandText}>
              harvest<Text style={{ color: "#91A47F" }}>.</Text>
            </Text>
          </View>
          <Text style={s.sidebarCaption}>FRESH FROM YOUR COMMUNITY</Text>
          <View style={{ gap: 9, marginTop: 35 }}>
            {nav.map((n) => (
              <Pressable
                accessibilityRole="button"
                key={n.label}
                onPress={() => navigate(n.label)}
                style={[s.navItem, page === n.label && s.navActive]}
              >
                <Icon name={n.icon} color={page === n.label ? green : muted} />
                <Text
                  style={[
                    s.navText,
                    page === n.label && { color: green, fontWeight: "700" },
                  ]}
                >
                  {n.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={{ flex: 1 }} />
          <View style={s.farmNote}>
            <Icon name="sunny-outline" size={29} />
            <Text style={s.cardTitle}>Good food. Real roots.</Text>
            <Text style={s.muted}>Every basket supports a local farmer.</Text>
          </View>
          <Pressable onPress={() => navigate("Support")} style={s.navItem}>
            <Icon name="help-circle-outline" />
            <Text style={s.navText}>Help & support</Text>
          </Pressable>
          <Pressable style={s.profile} onPress={() => navigate("Account")}>
            <View style={s.avatar}>
              <Text style={s.label}>{name.slice(0, 1)}M</Text>
            </View>
            <View>
              <Text style={s.label}>{name}</Text>
              <Text style={s.muted}>{role}</Text>
            </View>
            <Icon name="chevron-forward" size={16} />
          </Pressable>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <View
          style={[
            s.topbar,
            !wide && { paddingHorizontal: 16, height: 80, gap: 9 },
          ]}
        >
          {!wide && (
            <Text style={[s.brandText, { fontSize: 24 }]}>harvest.</Text>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change location"
            style={s.row}
            onPress={() => setModal("location")}
          >
            <Icon name="location-outline" />
            <View>
              {wide && <Text style={s.eyebrow}>DELIVERING TO</Text>}
              <Text style={[s.label, !wide && { fontSize: 11, maxWidth: 110 }]}>
                {location}⌄
              </Text>
            </View>
          </Pressable>
          <View style={{ flex: 1 }} />
          {wide && <Text style={s.muted}>● Frontend demo</Text>}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            onPress={() => setModal("notifications")}
            style={s.iconButton}
          >
            <Icon name={read ? "notifications-outline" : "notifications"} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open basket"
            onPress={() => setModal("cart")}
            style={s.basketButton}
          >
            <Icon name="bag-handle-outline" color="#fff" />
            <Text style={s.buttonText}>
              {wide ? "My basket · " : ""}
              {count}
            </Text>
          </Pressable>
        </View>
        <ScrollView
          contentContainerStyle={[s.content, { padding: wide ? 34 : 18 }]}
        >
          <View style={s.between}>
            <Text style={s.breadcrumb}>Your local marketplace / {page}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Switch workspace"
              onPress={() => setModal("roles")}
              style={s.row}
            >
              <Icon name="swap-horizontal-outline" size={16} />
              <Text style={s.link}>{role} ⌄</Text>
            </Pressable>
          </View>
          {["Explore", "Saved"].includes(page) && (
            <>
              <View style={[s.hero, !wide && { minHeight: 260 }]}>
                <Image
                  source={{
                    uri: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1500&auto=format&fit=crop",
                  }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={s.heroShade} />
                <View style={s.heroContent}>
                  <Text style={s.heroEyebrow}>
                    LOCAL ROOTS. FRESH BEGINNINGS.
                  </Text>
                  <Text
                    style={[
                      s.heroTitle,
                      { fontSize: wide ? 43 : 32, lineHeight: wide ? 49 : 38 },
                    ]}
                  >
                    From their farm.{"\n"}To your table.
                  </Text>
                  <Text style={s.heroSub}>
                    Seasonal produce. Honest prices. A little closer to home.
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    style={s.heroButton}
                    onPress={() => {
                      setCategory("All produce");
                      setMethod("Organic");
                      toast("Showing organic produce below.");
                    }}
                  >
                    <Text style={s.label}>Explore fresh picks</Text>
                    <Icon name="arrow-forward" size={18} />
                  </Pressable>
                </View>
                {wide && (
                  <View style={s.heroStamp}>
                    <Icon name="leaf-outline" color="#fff" />
                    <Text style={s.stampText}>
                      GROWN LOCAL{"\n"}LOVED DAILY
                    </Text>
                  </View>
                )}
              </View>
              <View style={s.benefits}>
                {[
                  {
                    icon: "leaf-outline",
                    title: "Picked fresh",
                    sub: "Straight from the harvest",
                  },
                  {
                    icon: "shield-checkmark-outline",
                    title: "Know your grower",
                    sub: "Verified local producers",
                  },
                  {
                    icon: "heart-outline",
                    title: "Fair for everyone",
                    sub: "Better value, farm to home",
                  },
                ].map((b) => (
                  <View key={b.title} style={s.benefit}>
                    <View style={s.benefitIcon}>
                      <Icon name={b.icon as IconName} />
                    </View>
                    <View>
                      <Text style={s.label}>{b.title}</Text>
                      {wide && <Text style={s.muted}>{b.sub}</Text>}
                    </View>
                  </View>
                ))}
              </View>
              <View style={s.between}>
                <View>
                  <Text style={s.heading}>
                    {page === "Saved"
                      ? "Your favourite finds"
                      : "Fresh from nearby farms"}
                  </Text>
                  <Text style={s.muted}>
                    A good day starts with something fresh.
                  </Text>
                </View>
                {wide && (
                  <Text style={s.link}>● Harvesting in your neighbourhood</Text>
                )}
              </View>
              <View style={[s.row, { marginVertical: 22, flexWrap: "wrap" }]}>
                <View style={s.search}>
                  <Icon name="search-outline" color={muted} />
                  <TextInput
                    accessibilityLabel="Search produce"
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search vegetables, farms or locations..."
                    placeholderTextColor={muted}
                    style={{
                      flex: 1,
                      fontSize: 14,
                      color: ink,
                      paddingVertical: 12,
                    }}
                  />
                </View>
                <Button
                  secondary
                  label="Filters & sort"
                  onPress={() => setModal("filters")}
                />
              </View>
              <Chips
                options={[
                  "All produce",
                  "Vegetables",
                  "Leafy greens",
                  "Roots & tubers",
                ]}
                value={category}
                onChange={setCategory}
              />
              <View style={[s.between, { marginVertical: 21 }]}>
                <Text style={s.muted}>
                  {filtered.length} fresh finds{" "}
                  {method !== "All methods" ? "· " + method : ""}
                </Text>
                <Text style={s.muted}>{sort}</Text>
              </View>
              <View style={s.productGrid}>
                {filtered.map((p) => (
                  <View
                    key={p.id}
                    style={[s.productCard, { width: wide ? "31.8%" : "47.5%" }]}
                  >
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={"View " + p.name}
                      onPress={() => {
                        setSelected(p);
                        setModal("product");
                      }}
                    >
                      <Image
                        source={{ uri: p.image }}
                        style={[s.productImage, { height: wide ? 175 : 135 }]}
                      />
                      <View style={s.productBadge}>
                        <Text style={s.organicText}>
                          {p.method === "Organic" ? "✦ Organic" : "Farm fresh"}
                        </Text>
                      </View>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={"Save " + p.name}
                      onPress={() => toggleFavorite(p.id)}
                      style={s.heart}
                    >
                      <Icon
                        name={
                          favorites.includes(p.id) ? "heart" : "heart-outline"
                        }
                        size={19}
                      />
                    </Pressable>
                    <View style={{ padding: wide ? 17 : 11, gap: 8 }}>
                      <View style={s.between}>
                        <Text style={s.tiny}>{p.distance} km away</Text>
                        <Text style={s.tiny}>★ {p.rating}</Text>
                      </View>
                      <Text style={s.productTitle}>{p.name}</Text>
                      <Text style={s.muted} numberOfLines={1}>
                        {p.farm} ✓
                      </Text>
                      <View style={[s.between, { marginTop: 9 }]}>
                        <Text style={s.price}>
                          {money(p.price)}
                          <Text style={s.muted}> / kg</Text>
                        </Text>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={"Add " + p.name}
                          onPress={() => add(p)}
                          style={s.addButton}
                        >
                          <Text style={s.addText}>
                            {cart[p.id] ? cart[p.id] + " +" : "Add +"}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
              {!filtered.length &&
                empty(
                  "No produce found",
                  "Try another search or clear your filters.",
                )}
              <View style={s.bottomNote}>
                <Icon name="leaf-outline" size={16} />
                <Text style={s.muted}>
                  Small farms. Big difference. Choose local.
                </Text>
              </View>
            </>
          )}
          {page === "Orders" && (
            <>
              <Text style={s.heading}>Your orders</Text>
              <Text style={s.subtitle}>
                Follow every basket, from harvest to handover.
              </Text>
              {orders
                .filter(
                  (o) => role !== "Producer" || o.farm === "Green Valley Farm",
                )
                .map(orderCard)}
              {!orders.filter(
                (o) => role !== "Producer" || o.farm === "Green Valley Farm",
              ).length &&
                empty(
                  "No orders yet",
                  "Your orders appear here after checkout.",
                )}
            </>
          )}
          {["Dashboard", "Overview"].includes(page) && (
            <>
              <Text style={s.heading}>
                {role === "Producer"
                  ? "Good morning, grower."
                  : "Marketplace overview"}
              </Text>
              <Text style={s.subtitle}>
                A snapshot of your demo marketplace.
              </Text>
              <View style={s.wrap}>
                {[
                  {
                    title: "Active listings",
                    value: items.filter(
                      (p) =>
                        p.active &&
                        (role !== "Producer" || p.farm === "Green Valley Farm"),
                    ).length,
                  },
                  {
                    title: "Orders",
                    value: orders.filter(
                      (o) =>
                        role !== "Producer" || o.farm === "Green Valley Farm",
                    ).length,
                  },
                  {
                    title: "Order value",
                    value: money(
                      orders
                        .filter(
                          (o) =>
                            o.status !== "Cancelled" &&
                            (role !== "Producer" ||
                              o.farm === "Green Valley Farm"),
                        )
                        .reduce((a, o) => a + o.total, 0),
                    ),
                  },
                ].map((x) => (
                  <View
                    key={x.title}
                    style={[s.panel, { flex: 1, minWidth: 135 }]}
                  >
                    <Text style={s.muted}>{x.title}</Text>
                    <Text style={s.stat}>{x.value}</Text>
                  </View>
                ))}
              </View>
              <View style={s.panel}>
                <Text style={s.cardTitle}>Your next harvest starts here</Text>
                <Text style={s.body}>
                  Keep availability current and review incoming orders.
                </Text>
                <Button
                  label="Manage listings"
                  onPress={() => navigate("Listings")}
                />
                <Button
                  secondary
                  label="View orders"
                  onPress={() => navigate("Orders")}
                />
              </View>
              <View style={s.panel}>
                <Text style={s.cardTitle}>Stock watch</Text>
                {items
                  .filter(
                    (p) =>
                      p.stock < 15 &&
                      (role !== "Producer" || p.farm === "Green Valley Farm"),
                  )
                  .map((p) => (
                    <Text key={p.id} style={s.body}>
                      {p.name} · {p.stock} kg remaining
                    </Text>
                  ))}
                <Text style={s.muted}>Low-stock threshold: 15 kg</Text>
              </View>
              <View style={s.panel}>
                <Text style={s.cardTitle}>Settlements</Text>
                <Text style={s.body}>
                  No real settlements. Order values are sample frontend
                  transactions.
                </Text>
              </View>
              {role === "Administrator" && (
                <View style={s.panel}>
                  <Text style={s.cardTitle}>Activity log</Text>
                  {audit.length ? (
                    audit.map((a, i) => (
                      <Text key={i} style={s.body}>
                        {a}
                      </Text>
                    ))
                  ) : (
                    <Text style={s.muted}>No moderation actions yet.</Text>
                  )}
                </View>
              )}
            </>
          )}
          {page === "Listings" && (
            <>
              <View style={s.between}>
                <Text style={s.heading}>Produce listings</Text>
                {role === "Producer" && (
                  <Button
                    label="+ New listing"
                    onPress={() => startListing()}
                  />
                )}
              </View>
              <Text style={s.subtitle}>
                Manage stock, prices and availability.
              </Text>
              {items
                .filter(
                  (p) =>
                    role === "Administrator" || p.farm === "Green Valley Farm",
                )
                .map((p) => (
                  <View style={s.panel} key={p.id}>
                    <View style={s.row}>
                      <Image source={{ uri: p.image }} style={s.thumb} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.cardTitle}>{p.name}</Text>
                        <Text style={s.muted}>
                          {money(p.price)} / kg · {p.stock} kg ·{" "}
                          {p.stock === 0
                            ? "Out of stock"
                            : p.active
                              ? "Active"
                              : "Paused"}
                        </Text>
                      </View>
                    </View>
                    <View style={s.wrap}>
                      <Button
                        secondary
                        label="Edit"
                        onPress={() => startListing(p)}
                      />
                      <Button
                        secondary
                        label={p.active ? "Pause listing" : "Reactivate"}
                        onPress={() => {
                          setItems((ps) =>
                            ps.map((x) =>
                              x.id === p.id ? { ...x, active: !x.active } : x,
                            ),
                          );
                          setAudit((a) => [
                            (p.active ? "Paused " : "Reactivated ") + p.name,
                            ...a,
                          ]);
                        }}
                      />
                      <Button
                        secondary
                        label="Delete"
                        onPress={() => {
                          setSelected(p);
                          setModal("deleteListing");
                        }}
                      />
                    </View>
                  </View>
                ))}
            </>
          )}
          {page === "Deliveries" && (
            <>
              <Text style={s.heading}>Delivery desk</Text>
              <Text style={s.subtitle}>Local routes. Fresher arrivals.</Text>
              {orders
                .filter(
                  (o) =>
                    o.method === "Home delivery" &&
                    ["Ready for Pickup", "Out for Delivery"].includes(o.status),
                )
                .map((o) => (
                  <View key={o.id} style={s.panel}>
                    <Text style={s.cardTitle}>{o.id}</Text>
                    <Text style={s.body}>
                      Pickup: {o.farm}, Kolkata farm collection point
                    </Text>
                    <Text style={s.body}>Drop-off: {o.address}</Text>
                    <Text style={s.muted}>
                      {o.slot} · {o.status}
                    </Text>
                    {o.status === "Ready for Pickup" ? (
                      <Button
                        label="Accept delivery"
                        onPress={() => updateOrder(o, "Out for Delivery")}
                      />
                    ) : (
                      <Button
                        label="Confirm handover"
                        onPress={() => {
                          setActiveOrder(o);
                          setOtp("");
                          setModal("handover");
                        }}
                      />
                    )}
                    <Button
                      secondary
                      label="Report delivery issue"
                      onPress={() => {
                        setTicketText("Delivery issue for " + o.id + ": ");
                        navigate("Support");
                      }}
                    />
                  </View>
                ))}
              {!orders.some(
                (o) =>
                  o.method === "Home delivery" &&
                  ["Ready for Pickup", "Out for Delivery"].includes(o.status),
              ) &&
                empty(
                  "No deliveries waiting",
                  "Prepare a demo order from the producer workspace to see it here.",
                )}
            </>
          )}
          {page === "Verification" && (
            <>
              <Text style={s.heading}>Producer verification</Text>
              <Text style={s.subtitle}>Review sample applications.</Text>
              <View style={s.panel}>
                <Text style={s.cardTitle}>Riverbend Farm</Text>
                <Text style={s.body}>Sample applicant · Kolkata</Text>
                <Text style={s.muted}>
                  Identity and farm documents: demo placeholders only.
                </Text>
                <Text style={s.badge}>
                  {approved ? "Approved (demo)" : "Pending review"}
                </Text>
                <Button
                  label={
                    approved ? "Revoke demo approval" : "Approve demo producer"
                  }
                  onPress={() => {
                    setApproved(!approved);
                    setAudit((a) => [
                      (approved ? "Revoked" : "Approved") +
                        " Riverbend Farm (demo)",
                      ...a,
                    ]);
                  }}
                />
              </View>
            </>
          )}
          {page === "Account" && (
            <>
              <Text style={s.heading}>Make yourself at home</Text>
              <Text style={s.subtitle}>Your profile and preferences.</Text>
              <View style={s.panel}>
                <Text style={s.badge}>
                  {signedIn ? "Demo session active" : "Guest demo session"}
                </Text>
                <Field label="Full name" value={name} onChange={setName} />
                <Field
                  label="Delivery address"
                  value={address}
                  onChange={setAddress}
                />
                <View style={s.between}>
                  <Text style={s.body}>In-app notifications</Text>
                  <Switch
                    value={notifications}
                    onValueChange={setNotifications}
                    trackColor={{ true: green }}
                  />
                </View>
                <Button
                  label="Save profile"
                  onPress={() => toast("Profile saved on this device.")}
                />
                <Button
                  secondary
                  label={signedIn ? "Sign out" : "Sign in / register"}
                  onPress={() =>
                    signedIn
                      ? (setSignedIn(false),
                        toast("Signed out of demo session."))
                      : setModal("auth")
                  }
                />
                <Button
                  secondary
                  label="Switch workspace"
                  onPress={() => setModal("roles")}
                />
                <Button
                  secondary
                  label="Help & support"
                  onPress={() => navigate("Support")}
                />
                <Button
                  secondary
                  label="Request account deletion"
                  onPress={() => setModal("deactivate")}
                />
                <Text style={s.tiny}>
                  English prototype · Regional translations are planned.
                </Text>
              </View>
            </>
          )}
          {page === "Support" && (
            <>
              <Text style={s.heading}>How can we help?</Text>
              <Text style={s.subtitle}>
                A little support, every step of the way.
              </Text>
              <View style={s.panel}>
                <Text style={s.cardTitle}>Create a support ticket</Text>
                <Field
                  label="Describe your question or complaint"
                  value={ticketText}
                  onChange={setTicketText}
                />
                <Button
                  label="Submit demo ticket"
                  onPress={() => {
                    if (ticketText.trim().length < 10)
                      return toast(
                        "Please describe the issue in at least 10 characters.",
                      );
                    setTickets((t) => [
                      { id: "TK-" + uid(), text: ticketText, status: "Open" },
                      ...t,
                    ]);
                    setTicketText("");
                    toast("Demo ticket created.");
                  }}
                />
              </View>
              {tickets.map((t) => (
                <View key={t.id} style={s.panel}>
                  <Text style={s.cardTitle}>
                    {t.id} · {t.status}
                  </Text>
                  <Text style={s.body}>{t.text}</Text>
                  {role === "Administrator" && t.status === "Open" && (
                    <Button
                      label="Resolve ticket"
                      onPress={() =>
                        setTickets((ts) =>
                          ts.map((x) =>
                            x.id === t.id ? { ...x, status: "Resolved" } : x,
                          ),
                        )
                      }
                    />
                  )}
                </View>
              ))}
              {[
                [
                  "How do I order?",
                  "Explore produce, add items to your basket, then choose delivery or farm pickup at checkout.",
                ],
                [
                  "How do cancellations work?",
                  "Cancel pending or accepted orders with a reason. Reserved stock is restored.",
                ],
                [
                  "How do I sell my harvest?",
                  "Switch to Producer, open Listings, and add your produce with a price, stock and harvest date.",
                ],
                [
                  "Are payments real?",
                  "No. Payments, messages, identity checks and order updates are simulated on this device.",
                ],
              ].map(([q, a]) => (
                <View style={s.panel} key={q}>
                  <Text style={s.cardTitle}>{q}</Text>
                  <Text style={s.body}>{a}</Text>
                </View>
              ))}
            </>
          )}
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
                    fontSize: 10,
                    color: page === n.label ? green : muted,
                    fontWeight: "600",
                  }}
                >
                  {n.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
      <Modal
        visible={!!modal}
        transparent
        animationType="fade"
        onRequestClose={() => setModal("")}
      >
        <View style={s.scrim}>
          <View style={[s.modal, { maxWidth: modal === "cart" ? 650 : 550 }]}>
            <View style={s.between}>
              <Text style={[s.heading, { flex: 1 }]}>
                {(
                  {
                    roles: "Choose your workspace",
                    product: selected?.name,
                    cart: "Your basket",
                    filters: "Find your fresh",
                    location: "Your neighbourhood",
                    notifications: "Notifications",
                    listing: editing ? "Edit listing" : "New produce listing",
                    auth: authMode,
                    tracking: "Order details",
                    cancel: "Cancel order",
                    handover: "Confirm handover",
                    chat: "Order conversation",
                    review: "Share your experience",
                    deleteListing: "Delete listing?",
                    deactivate: "Request deletion",
                  } as Record<string, string>
                )[modal] || ""}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close dialog"
                onPress={() => setModal("")}
                style={s.iconButton}
              >
                <Icon name="close" />
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={{ paddingTop: 22, paddingBottom: 20 }}
              keyboardShouldPersistTaps="handled"
            >
              {modal === "roles" && (
                <>
                  <Text style={s.subtitle}>
                    One app, four perspectives. All workspaces use local demo
                    data.
                  </Text>
                  {[
                    "Consumer",
                    "Producer",
                    "Delivery partner",
                    "Administrator",
                  ].map((r) => (
                    <View key={r} style={{ marginBottom: 12 }}>
                      <Button
                        secondary={r !== role}
                        label={r}
                        onPress={() => {
                          setRole(r);
                          navigate(
                            r === "Consumer"
                              ? "Explore"
                              : r === "Producer"
                                ? "Dashboard"
                                : r === "Administrator"
                                  ? "Overview"
                                  : "Deliveries",
                          );
                          setModal("");
                        }}
                      />
                    </View>
                  ))}
                </>
              )}
              {modal === "product" && selected && (
                <>
                  <Image
                    source={{ uri: selected.image }}
                    style={{ height: 230, borderRadius: 16 }}
                  />
                  <Text style={[s.stat, { marginTop: 15 }]}>
                    {money(selected.price)} <Text style={s.muted}>/ kg</Text>
                  </Text>
                  <Text style={s.body}>
                    {selected.farm} ✓ · {selected.distance} km away · ★{" "}
                    {selected.rating}
                  </Text>
                  <Text style={s.body}>
                    {selected.method} · Harvested {selected.harvest}
                  </Text>
                  <Text style={s.body}>
                    {selected.stock} kg available · Minimum 1 kg
                  </Text>
                  <Text style={s.subtitle}>
                    Home delivery or farm pickup. Select your slot at checkout.
                  </Text>
                  <Button
                    label="Add to basket"
                    onPress={() =>
                      add(items.find((p) => p.id === selected.id) || selected)
                    }
                  />
                  <View style={{ height: 10 }} />
                  <Button
                    secondary
                    label={
                      favorites.includes(selected.id)
                        ? "Remove from favourites"
                        : "Save for later"
                    }
                    onPress={() => toggleFavorite(selected.id)}
                  />
                  <Text style={[s.cardTitle, { marginTop: 22 }]}>
                    Community reviews
                  </Text>
                  <Text style={s.body}>
                    “Fresh, flavourful and carefully packed.” — Sample buyer
                  </Text>
                  {Object.entries(reviews)
                    .filter(([id]) =>
                      orders
                        .find((o) => o.id === id)
                        ?.items.some((l) => l.product.id === selected.id),
                    )
                    .map(([id, r]) => (
                      <Text key={id} style={s.body}>
                        {r}
                      </Text>
                    ))}
                </>
              )}
              {modal === "filters" && (
                <>
                  <Text style={s.label}>Farming method</Text>
                  <Chips
                    options={[
                      "All methods",
                      "Organic",
                      "Naturally grown",
                      "Conventionally grown",
                    ]}
                    value={method}
                    onChange={setMethod}
                  />
                  <Text style={[s.label, { marginTop: 20 }]}>Sort by</Text>
                  <Chips
                    options={[
                      "Recommended",
                      "Price: low to high",
                      "Nearest first",
                      "Top rated",
                      "Freshest first",
                    ]}
                    value={sort}
                    onChange={setSort}
                  />
                  <View style={{ height: 20 }} />
                  <Field
                    label="Maximum price per kg (₹)"
                    value={maxPrice}
                    onChange={setMaxPrice}
                    numeric
                  />
                  <View style={s.between}>
                    <Text style={s.body}>Within 3 km</Text>
                    <Switch value={nearby} onValueChange={setNearby} />
                  </View>
                  <Button label="Show produce" onPress={() => setModal("")} />
                  <View style={{ height: 10 }} />
                  <Button
                    secondary
                    label="Reset filters"
                    onPress={() => {
                      setMethod("All methods");
                      setSort("Recommended");
                      setMaxPrice("");
                      setNearby(false);
                      setCategory("All produce");
                    }}
                  />
                </>
              )}
              {modal === "cart" && (
                <>
                  {cartItems.length ? (
                    <>
                      {cartItems.map((p) => (
                        <View key={p.id} style={s.cartLine}>
                          <Image source={{ uri: p.image }} style={s.thumb} />
                          <View style={{ flex: 1, gap: 5 }}>
                            <Text style={s.label}>{p.name}</Text>
                            <Text style={s.muted}>{p.farm}</Text>
                            <Text style={s.label}>
                              {money(p.price * cart[p.id])}
                            </Text>
                            <Pressable
                              accessibilityRole="button"
                              onPress={() => {
                                if (!favorites.includes(p.id))
                                  toggleFavorite(p.id);
                                setCart((c) => {
                                  const n = { ...c };
                                  delete n[p.id];
                                  return n;
                                });
                              }}
                            >
                              <Text style={s.link}>Save for later</Text>
                            </Pressable>
                          </View>
                          <View style={s.quantity}>
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={"Decrease " + p.name}
                              onPress={() => add(p, -1)}
                            >
                              <Icon name="remove" />
                            </Pressable>
                            <Text>{cart[p.id]}</Text>
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={"Increase " + p.name}
                              onPress={() => add(p)}
                            >
                              <Icon name="add" />
                            </Pressable>
                          </View>
                        </View>
                      ))}
                      <Text style={s.subtitle}>
                        Items from different farms create separate orders.
                      </Text>
                      <Chips
                        options={["Home delivery", "Farm pickup"]}
                        value={delivery}
                        onChange={setDelivery}
                      />
                      <View style={{ height: 15 }} />
                      {delivery === "Home delivery" && (
                        <Field
                          label="Delivery address"
                          value={address}
                          onChange={setAddress}
                        />
                      )}
                      <Text style={s.label}>Preferred slot</Text>
                      <Chips
                        options={["Tomorrow, 7–9 AM", "Tomorrow, 5–7 PM"]}
                        value={slot}
                        onChange={setSlot}
                      />
                      <Text style={[s.label, { marginTop: 20 }]}>
                        Payment (simulated)
                      </Text>
                      <Chips
                        options={[
                          "Cash on delivery",
                          "UPI",
                          "Card",
                          "Wallet",
                          "Net banking",
                        ]}
                        value={payment}
                        onChange={setPayment}
                      />
                      <View style={{ height: 15 }} />
                      <Field
                        label="Promo code — try FRESH10"
                        value={coupon}
                        onChange={setCoupon}
                      />
                      <Button
                        secondary
                        label="Apply coupon"
                        onPress={() => {
                          setDiscount(
                            coupon.trim().toUpperCase() === "FRESH10",
                          );
                          toast(
                            coupon.trim().toUpperCase() === "FRESH10"
                              ? "10% discount applied."
                              : "Invalid promo code.",
                          );
                        }}
                      />
                      <View style={s.summary}>
                        <View style={s.between}>
                          <Text style={s.body}>Subtotal</Text>
                          <Text>{money(subtotal)}</Text>
                        </View>
                        <View style={s.between}>
                          <Text style={s.body}>
                            Delivery {subtotal >= 499 ? "(free over ₹499)" : ""}
                          </Text>
                          <Text>{money(fee)}</Text>
                        </View>
                        <View style={s.between}>
                          <Text style={s.body}>Discount</Text>
                          <Text>−{money(savings)}</Text>
                        </View>
                        <View style={s.between}>
                          <Text style={s.cardTitle}>Total</Text>
                          <Text style={s.price}>{money(total)}</Text>
                        </View>
                      </View>
                      <Button
                        label={"Place demo order · " + money(total)}
                        onPress={placeOrder}
                      />
                      <Text
                        style={[s.tiny, { textAlign: "center", marginTop: 12 }]}
                      >
                        No real payment or order is submitted.
                      </Text>
                    </>
                  ) : (
                    empty(
                      "Your basket is waiting",
                      "Add something fresh from your local farms.",
                    )
                  )}
                </>
              )}
              {modal === "location" && (
                <>
                  <Field
                    label="City or postal code"
                    value={location}
                    onChange={setLocation}
                  />
                  <Text style={s.subtitle}>
                    Demo service area: Kolkata. Distances are sample values.
                  </Text>
                  <Button
                    label="Save location"
                    onPress={() => {
                      if (!location.trim()) return toast("Enter a location.");
                      setModal("");
                    }}
                  />
                </>
              )}
              {modal === "notifications" && (
                <>
                  <Text style={s.body}>
                    {!notifications
                      ? "Notifications are turned off in your preferences."
                      : read
                        ? "You’re all caught up."
                        : "Welcome to Harvest. Explore freshly picked local produce."}
                  </Text>
                  {notifications &&
                    orders.slice(0, 4).map((o) => (
                      <Text key={o.id} style={s.body}>
                        {o.id}: {o.status}
                      </Text>
                    ))}
                  <Button
                    secondary
                    label="Mark all as read"
                    onPress={() => {
                      setRead(true);
                      toast("Notifications marked as read.");
                    }}
                  />
                </>
              )}
              {modal === "listing" && (
                <>
                  <Field
                    label="Vegetable name"
                    value={draft.name}
                    onChange={(name) => setDraft((d) => ({ ...d, name }))}
                  />
                  <Field
                    label="Price per kg (₹)"
                    value={draft.price}
                    onChange={(price) => setDraft((d) => ({ ...d, price }))}
                    numeric
                  />
                  <Field
                    label="Available stock (kg)"
                    value={draft.stock}
                    onChange={(stock) => setDraft((d) => ({ ...d, stock }))}
                    numeric
                  />
                  <Field
                    label="Harvest date (YYYY-MM-DD)"
                    value={draft.harvest}
                    onChange={(harvest) => setDraft((d) => ({ ...d, harvest }))}
                  />
                  <Chips
                    options={["Vegetables", "Leafy greens", "Roots & tubers"]}
                    value={draft.category}
                    onChange={(category) =>
                      setDraft((d) => ({ ...d, category }))
                    }
                  />
                  <View style={{ height: 15 }} />
                  <Chips
                    options={[
                      "Organic",
                      "Naturally grown",
                      "Conventionally grown",
                    ]}
                    value={draft.method}
                    onChange={(method) => setDraft((d) => ({ ...d, method }))}
                  />
                  <View style={{ height: 15 }} />
                  {draft.image && (
                    <Image
                      source={{ uri: draft.image }}
                      style={{
                        height: 120,
                        borderRadius: 12,
                        marginBottom: 12,
                      }}
                    />
                  )}
                  <Button
                    secondary
                    label="Choose product image"
                    onPress={pickImage}
                  />
                  <View style={{ height: 12 }} />
                  <Button label="Save listing" onPress={saveListing} />
                </>
              )}
              {modal === "auth" && (
                <>
                  <Text style={s.subtitle}>
                    Demo authentication. No real credentials are needed.
                  </Text>
                  <Chips
                    options={["Sign in", "Register", "Recover account"]}
                    value={authMode}
                    onChange={(v) => {
                      setAuthMode(v);
                      setAuthStep(false);
                    }}
                  />
                  <View style={{ height: 20 }} />
                  <Field
                    label="Email or phone"
                    value={email}
                    onChange={setEmail}
                  />
                  {authStep ? (
                    <>
                      <Field
                        label="Demo verification code (123456)"
                        value={otp}
                        onChange={setOtp}
                        numeric
                      />
                      <Button
                        label="Verify demo code"
                        onPress={() => {
                          if (otp !== "123456")
                            return toast(
                              "Use the displayed demo code: 123456.",
                            );
                          setSignedIn(true);
                          setModal("");
                          setOtp("");
                          setAuthStep(false);
                          toast("Demo session started.");
                        }}
                      />
                    </>
                  ) : (
                    <Button
                      label="Continue with demo OTP"
                      onPress={() => {
                        if (
                          !/^\S+@\S+\.\S+$/.test(email) &&
                          !/^\+?[\d\s]{10,15}$/.test(email)
                        )
                          return toast(
                            "Enter a valid sample email or phone number.",
                          );
                        setAuthStep(true);
                      }}
                    />
                  )}
                </>
              )}
              {modal === "tracking" && activeOrder && (
                <>
                  <Text style={s.cardTitle}>{activeOrder.id}</Text>
                  <Text style={s.body}>
                    {activeOrder.farm} · {activeOrder.status}
                  </Text>
                  {stages.map((st, i) => (
                    <View key={st} style={[s.row, { paddingVertical: 10 }]}>
                      <Icon
                        name={
                          stages.indexOf(activeOrder.status) >= i
                            ? "checkmark-circle"
                            : "ellipse-outline"
                        }
                        color={
                          stages.indexOf(activeOrder.status) >= i
                            ? green
                            : "#CCD3CD"
                        }
                      />
                      <Text style={s.body}>{st}</Text>
                    </View>
                  ))}
                  <Text style={s.body}>
                    {activeOrder.method} · {activeOrder.slot}
                  </Text>
                  <Text style={s.body}>
                    Receipt total: {money(activeOrder.total)}
                  </Text>
                  <Text style={s.body}>Payment: {activeOrder.payment}</Text>
                  {activeOrder.reason && (
                    <Text style={s.body}>
                      Cancellation: {activeOrder.reason}
                    </Text>
                  )}
                  <Text style={s.tiny}>
                    Demo receipt · No tax invoice or real payment
                  </Text>
                </>
              )}
              {modal === "cancel" && (
                <>
                  <Field
                    label="Reason for cancellation"
                    value={reason}
                    onChange={setReason}
                  />
                  <Button label="Confirm cancellation" onPress={cancelOrder} />
                </>
              )}
              {modal === "handover" && (
                <>
                  <Field
                    label="Demo handover OTP (123456)"
                    value={otp}
                    onChange={setOtp}
                  />
                  <Button
                    label="Complete delivery"
                    onPress={() => {
                      if (otp !== "123456")
                        return toast("Enter demo OTP 123456.");
                      if (activeOrder) updateOrder(activeOrder, "Delivered");
                      setModal("");
                    }}
                  />
                </>
              )}
              {modal === "chat" && activeOrder && (
                <>
                  <Text style={s.subtitle}>
                    Local conversation preview for {activeOrder.id}. Messages
                    are not sent.
                  </Text>
                  {(messages[activeOrder.id] || []).map((m, i) => (
                    <View key={i} style={s.summary}>
                      <Text style={s.body}>{m}</Text>
                    </View>
                  ))}
                  <Field
                    label="Message"
                    value={message}
                    onChange={setMessage}
                  />
                  <Button
                    label="Add demo message"
                    onPress={() => {
                      if (message.trim()) {
                        setMessages((ms) => ({
                          ...ms,
                          [activeOrder.id]: [
                            ...(ms[activeOrder.id] || []),
                            message,
                          ],
                        }));
                        setMessage("");
                      }
                    }}
                  />
                </>
              )}
              {modal === "review" && activeOrder && (
                <>
                  <Chips
                    options={["1", "2", "3", "4", "5"]}
                    value={rating}
                    onChange={setRating}
                  />
                  <Field
                    label="Your review"
                    value={message}
                    onChange={setMessage}
                  />
                  <Button
                    label="Save review"
                    onPress={() => {
                      if (!message.trim())
                        return toast("Write a review first.");
                      setReviews((rs) => ({
                        ...rs,
                        [activeOrder.id]: rating + " ★ — " + message,
                      }));
                      setMessage("");
                      setModal("");
                      toast("Demo review saved.");
                    }}
                  />
                </>
              )}
              {modal === "deleteListing" && (
                <>
                  <Text style={s.subtitle}>
                    Remove {selected?.name} from the demo marketplace?
                  </Text>
                  <Button
                    label="Delete listing"
                    onPress={() => {
                      setItems((ps) => ps.filter((p) => p.id !== selected?.id));
                      setCart((c) => {
                        const n = { ...c };
                        if (selected) delete n[selected.id];
                        return n;
                      });
                      setModal("");
                    }}
                  />
                </>
              )}
              {modal === "deactivate" && (
                <>
                  <Text style={s.subtitle}>
                    Create a local account-deletion request for this demo
                    profile?
                  </Text>
                  <Button
                    label="Create deletion request"
                    onPress={() => {
                      setTickets((t) => [
                        {
                          id: "TK-" + uid(),
                          text: "Account deletion request for " + name,
                          status: "Open",
                        },
                        ...t,
                      ]);
                      setSignedIn(false);
                      setModal("");
                      toast("Demo deletion request created.");
                    }}
                  />
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
      {!!notice && (
        <View accessibilityRole="alert" style={s.toast}>
          <Text style={{ color: "#fff", fontSize: 14 }}>{notice}</Text>
        </View>
      )}
    </View>
  );
}
