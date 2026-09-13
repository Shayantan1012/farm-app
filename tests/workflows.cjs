// Execute the real app with native view primitives replaced by host elements.
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict"),
  ts = require("typescript"),
  React = require("react");
const { create, act } = require("react-test-renderer");
global.IS_REACT_ACT_ENVIRONMENT = true;
const storage = new Map(),
  cache = new Map();
const native = Object.fromEntries(
  [
    "View",
    "Text",
    "ScrollView",
    "Pressable",
    "TextInput",
    "Image",
    "Switch",
  ].map((k) => [k, k]),
);
Object.assign(native, {
  Modal: ({ visible, children }) =>
    visible ? React.createElement("Modal", null, children) : null,
  StyleSheet: { create: (x) => x, absoluteFill: {} },
  Platform: { OS: "web" },
  useWindowDimensions: () => ({ width: 1280, height: 900 }),
});
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      jsx: ts.JsxEmit.React,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const req = (id) => {
    if (id === "react-native") return native;
    if (id === "expo-status-bar") return { StatusBar: "StatusBar" };
    if (id === "@expo/vector-icons") return { Ionicons: "Icon" };
    if (id === "expo-image-picker")
      return { launchImageLibraryAsync: async () => ({ canceled: true }) };
    if (id === "@react-native-async-storage/async-storage")
      return {
        getItem: async (k) => storage.get(k) || null,
        setItem: async (k, v) => storage.set(k, v),
      };
    if (id.startsWith(".")) {
      const base = path.resolve(path.dirname(file), id);
      return load([base + ".tsx", base + ".ts"].find(fs.existsSync));
    }
    return require(id);
  };
  new Function("require", "module", "exports", code)(
    req,
    module,
    module.exports,
  );
  return module.exports;
}
const App = load(path.join(__dirname, "../App.tsx")).default;
let app;
const text = (node) =>
  typeof node === "string" ? node : node?.children?.map(text).join("") || "";
const button = (label) =>
  app.root.findAll(
    (n) =>
      n.type === "Pressable" &&
      (n.props.accessibilityLabel === label || text(n) === label),
  )[0];
const click = async (label) => {
  const b = button(label);
  assert.ok(b, "Button exists: " + label);
  await act(async () => b.props.onPress());
};
const fill = async (label, value) => {
  const f = app.root.findAll(
    (n) => n.type === "TextInput" && n.props.accessibilityLabel === label,
  )[0];
  assert.ok(f, "Field exists: " + label);
  await act(async () => f.props.onChangeText(value));
};
const saved = () => JSON.parse(storage.get("harvest-demo-v1"));
(async () => {
  await act(async () => {
    app = create(React.createElement(App));
  });
  assert.equal(saved().items.length, 6);
  await fill("Search produce", "spinach");
  assert.ok(button("Add Tender baby spinach"));
  assert.equal(button("Add Fresh vine tomatoes"), undefined);
  await fill("Search produce", "");
  await click("Save Fresh vine tomatoes");
  assert.deepEqual(saved().favorites, ["1"]);
  await click("Add Fresh vine tomatoes");
  await click("Add Tender baby spinach");
  await click("Open basket");
  await fill("Promo code — try FRESH10", "FRESH10");
  await click("Apply coupon");
  await click("Place demo order · ₹102");
  assert.equal(saved().orders.length, 2);
  assert.equal(
    saved().orders.reduce((n, o) => n + o.total, 0),
    102,
  );
  assert.equal(saved().items[0].stock, 23);
  assert.equal(saved().items[1].stock, 17);
  assert.deepEqual(saved().cart, {});
  await click("Cancel order");
  await fill("Reason for cancellation", "Changed my delivery plans");
  await click("Confirm cancellation");
  assert.equal(saved().orders[0].status, "Cancelled");
  assert.equal(saved().items[0].stock, 24);
  await click("Switch workspace");
  await click("Consumer");
  await click("Add Fresh vine tomatoes");
  await click("Open basket");
  await click("Farm pickup");
  await click("Place demo order · ₹36");
  await click("Switch workspace");
  await click("Producer");
  await click("Orders");
  await click("Accept order");
  await click("Next status");
  await click("Next status");
  assert.equal(saved().orders[0].status, "Ready for Pickup");
  await click("Confirm pickup");
  await fill("Demo handover OTP (123456)", "000000");
  await click("Complete delivery");
  assert.equal(saved().orders[0].status, "Ready for Pickup");
  await fill("Demo handover OTP (123456)", "123456");
  await click("Complete delivery");
  assert.equal(saved().orders[0].status, "Delivered");
  await click("Listings");
  await click("+ New listing");
  await fill("Vegetable name", "Test cucumbers");
  await fill("Price per kg (₹)", "25");
  await fill("Available stock (kg)", "3");
  await click("Save listing");
  assert.equal(saved().items[0].name, "Test cucumbers");
  await click("Switch workspace");
  await click("Consumer");
  for (let i = 0; i < 4; i++) await click("Add Test cucumbers");
  assert.equal(saved().cart[saved().items[0].id], 3);
  await act(async () => app.unmount());
  await act(async () => {
    app = create(React.createElement(App));
  });
  assert.equal(saved().cart[saved().items[0].id], 3);
  await act(async () => app.unmount());
  console.log(
    "PASS: search, favourites, multi-farm checkout, discounts, stock restoration, role switching, pickup OTP, listings, stock limits and persistence.",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
