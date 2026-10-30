// Execute the real app with native view primitives replaced by host elements.
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict"),
  ts = require("typescript"),
  React = require("react");
const { create, act } = require("react-test-renderer");
global.IS_REACT_ACT_ENVIRONMENT = true;
const cache = new Map();
let photoBase64 = "";
const localStore = new Map();
let gpsCallback,
  appStateCallback,
  gpsRemoved = 0,
  permission = "granted";
const locationMock = {
  Accuracy: { High: 4 },
  requestForegroundPermissionsAsync: async () => ({ status: permission }),
  hasServicesEnabledAsync: async () => true,
  enableNetworkProviderAsync: async () => {},
  getCurrentPositionAsync: async () => ({
    coords: { latitude: 22.5726, longitude: 88.3639, accuracy: 8 },
    timestamp: Date.now(),
    mocked: false,
  }),
  reverseGeocodeAsync: async () => [
    {
      formattedAddress: "Kolkata, West Bengal 700001, India",
      city: "Kolkata",
      region: "West Bengal",
      postalCode: "700001",
      country: "India",
    },
  ],
  watchPositionAsync: async (_options, callback) => {
    gpsCallback = callback;
    return {
      remove: () => {
        gpsRemoved++;
      },
    };
  },
};
const native = Object.fromEntries(
  [
    "View",
    "Text",
    "ScrollView",
    "Pressable",
    "TextInput",
    "Image",
    "Switch",
    "ActivityIndicator",
  ].map((k) => [k, k]),
);
Object.assign(native, {
  View: ({ children, ...props }) => {
    React.Children.forEach(children, (child) => {
      assert.ok(
        typeof child !== "string" && typeof child !== "number",
        "Native View children must wrap text and numbers in a Text component",
      );
    });
    return React.createElement("View", props, children);
  },
  AppState: {
    currentState: "active",
    addEventListener: (_event, callback) => {
      appStateCallback = callback;
      return { remove() {} };
    },
  },
  Linking: { openURL: async () => {} },
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
    if (id === "@react-native-async-storage/async-storage")
      return {
        __esModule: true,
        default: {
          getItem: async (key) => localStore.get(key) || null,
          setItem: async (key, value) => localStore.set(key, value),
        },
      };
    if (id === "expo-location") return locationMock;
    if (id === "react-native-webview") return { WebView: "WebView" };
    if (id === "@react-native-community/datetimepicker")
      return { __esModule: true, default: "DateTimePicker" };
    if (id === "expo-status-bar") return { StatusBar: "StatusBar" };
    if (id === "@expo/vector-icons") return { Ionicons: "Icon" };
    if (id === "expo-image-picker")
      return {
        launchImageLibraryAsync: async () => ({
          canceled: false,
          assets: [
            {
              uri: "data:image/png;base64," + photoBase64,
              base64: photoBase64,
            },
          ],
        }),
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

// Real HTTP requests and a real temporary MongoDB replica set. Only native view
// primitives and the device photo picker are replaced for this Node test.
let app, server, replica, mongoose;
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
  assert.ok(!b.props.disabled, "Button enabled: " + label);
  await act(async () => {
    await b.props.onPress();
  });
};
const fill = async (label, value) => {
  const field = app.root.findAll(
    (n) => n.type === "TextInput" && n.props.accessibilityLabel === label,
  )[0];
  assert.ok(field, "Field exists: " + label);
  await act(async () => field.props.onChangeText(value));
};
const chooseDate = async (label, value) => {
  await click(label);
  const picker = app.root.findAll(
    (node) => node.type === "DateTimePicker",
  )[0];
  assert.ok(picker, "Calendar exists: " + label);
  await act(async () =>
    picker.props.onChange({ type: "set" }, new Date(value + "T12:00:00")),
  );
};
const waitFor = async (predicate) => {
  for (let i = 0; i < 150; i++) {
    if (await predicate()) return;
    await act(async () => {
      await new Promise((r) => setTimeout(r, 30));
    });
  }
  throw new Error("Timed out waiting for UI: " + text(app.root));
};
(async () => {
  const { pathToFileURL } = require("node:url");
  const backend = path.resolve(__dirname, "../../farm-backend");
  const moduleAt = (p) => import(pathToFileURL(path.join(backend, p)).href);
  mongoose = require(path.join(backend, "node_modules/mongoose"));
  const { MongoMemoryReplSet } = require(
    path.join(backend, "node_modules/mongodb-memory-server"),
  );
  const sharp = require(path.join(backend, "node_modules/sharp"));
  photoBase64 = (
    await sharp({
      create: { width: 8, height: 8, channels: 3, background: "#338844" },
    })
      .png()
      .toBuffer()
  ).toString("base64");
  replica = await MongoMemoryReplSet.create({
    binary: {
      downloadDir: path.join(
        backend,
        "node_modules/.cache/mongodb-memory-server",
      ),
    },
    replSet: { count: 1, storageEngine: "wiredTiger" },
  });
  const { connectDatabase } = await moduleAt("src/db.js");
  await connectDatabase(replica.getUri("harvest_frontend_test"));
  const { createApp } = await moduleAt("src/app.js");
  const { configFromEnv } = await moduleAt("src/config.js");
  const { User } = await moduleAt("src/models/User.js");
  const { Product } = await moduleAt("src/models/Product.js");
  const { ProductImage } = await moduleAt("src/models/ProductImage.js");
  const { hashPassword } = await moduleAt("src/lib/security.js");
  const password = "Test-farmer-password-2026!";
  await User.create({
    name: "Integration Farmer",
    farmName: "Integration Farm",
    email: "farmer@test.example",
    role: "producer",
    passwordHash: await hashPassword(password),
    approved: true,
    verified: true,
  });
  server = createApp(
    configFromEnv({ NODE_ENV: "test", EXPOSE_DEV_OTP: "true" }),
  ).listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  process.env.EXPO_PUBLIC_API_URL =
    "http://127.0.0.1:" + server.address().port + "/api";
  const App = load(path.join(__dirname, "../App.tsx")).default;
  await act(async () => {
    app = create(React.createElement(App));
  });
  await waitFor(() => text(app.root).includes("No products listed yet."));
  assert.equal(
    app.root.findAll((n) => n.type === "Image").length,
    0,
    "No hard-coded photo fallback",
  );
  await click("English");
  await click("Use this language");
  assert.ok(text(app.root).includes("আপনার ভাষা বেছে নিন"));
  assert.ok(text(app.root).includes("নির্বাচিত"));
  assert.equal(localStore.get("harvest-language"), "bn");
  await click("এই ভাষা ব্যবহার করুন");
  assert.ok(text(app.root).includes("Choose your language"));
  assert.equal(localStore.get("harvest-language"), "en");
  await click("Sign in / Register");
  await click("First administrator setup");
  await waitFor(() => Boolean(button("Create administrator")));
  await fill("Administrator name", "First UI Admin");
  await fill("Administrator email", "ui-admin@test.example");
  await fill("Administrator password (at least 12 characters)", password);
  await fill("Confirm administrator password", password);
  await click("Create administrator");
  await waitFor(() => text(app.root).includes("Administrator created"));
  assert.equal(await User.countDocuments({ role: "administrator" }), 1);
  await click("Back to sign in");
  await click("First administrator setup");
  await waitFor(() => text(app.root).includes("Administrator setup is closed"));
  assert.equal(button("Create administrator"), undefined);
  await click("Back to sign in");
  await fill("Email address", "ui-admin@test.example");
  await fill("Password (at least 12 characters)", password);
  await act(async () => {
    const buttons = app.root.findAll(
      (n) => n.type === "Pressable" && text(n) === "Sign in",
    );
    await buttons.at(-1).props.onPress();
  });
  await waitFor(() => text(app.root).includes("Recorded cash collected"));
  await click("Create administrator");
  await fill("Administrator name", "Second UI Admin");
  await fill("Administrator email", "ui-second@test.example");
  await fill("Administrator password (at least 12 characters)", password);
  await fill("Confirm administrator password", password);
  await act(async () => {
    const buttons = app.root.findAll(
      (n) => n.type === "Pressable" && text(n) === "Create administrator",
    );
    await buttons.at(-1).props.onPress();
  });
  await waitFor(() => text(app.root).includes("ui-second@test.example"));
  assert.equal(await User.countDocuments({ role: "administrator" }), 2);
  await click("Farms");
  await waitFor(() => text(app.root).includes("farmer@test.example"));
  await click("Products");
  await waitFor(() => text(app.root).includes("No records yet."));
  await click("Account");
  await click("Sign out");
  await waitFor(() => Boolean(button("Sign in / Register")));
  await click("Sign in / Register");
  await click("Register");
  await click("Consumer");
  await fill("Your full name", "Registration Test");
  await fill("Email address", "registration@test.example");
  await fill("Phone number (optional)", "+91 98765 43210");
  await fill("Street / village address", "12 Test Road");
  await fill("City / village", "Kolkata");
  await fill("State", "West Bengal");
  await fill("Postal / PIN code", "700029");
  await fill("Password (at least 12 characters)", password);
  await fill("Confirm password", "different-password");
  await click("Create account");
  assert.ok(text(app.root).includes("Passwords do not match"));
  assert.equal(
    await User.countDocuments({ email: "registration@test.example" }),
    0,
  );
  await fill("Confirm password", password);
  await click("Create account");
  await waitFor(() => text(app.root).includes("Enter the verification code"));
  const registered = await User.findOne({ email: "registration@test.example" });
  assert.equal(registered.address, "12 Test Road");
  assert.equal(registered.city, "Kolkata");
  assert.equal(registered.state, "West Bengal");
  assert.equal(registered.postalCode, "700029");
  assert.equal(registered.phone, "+919876543210");
  await act(async () => {
    const chip = app.root
      .findAll((n) => n.type === "Pressable" && text(n) === "Sign in")
      .at(-1);
    await chip.props.onPress();
  });

  await fill("Email address", "farmer@test.example");
  await fill("Password (at least 12 characters)", password);
  // Target the form button rather than the navigation entry with the same name.
  await act(async () => {
    const buttons = app.root.findAll(
      (n) => n.type === "Pressable" && text(n) === "Sign in",
    );
    await buttons[buttons.length - 1].props.onPress();
  });
  await waitFor(() => Boolean(button("Add product")));
  await click("Add product");
  await click("Save product");
  assert.equal(await Product.countDocuments(), 0, "Invalid form does not save");
  await fill("Product name", "Farmer grown beans");
  await fill("Price per kg (₹)", "47.50");
  await fill("Available stock (kg)", "12");
  await waitFor(() => text(app.root).includes("Kolkata, West Bengal 700001"));
  await fill("Farm location", "Farm test location");
  await chooseDate("Harvest date", new Date().toISOString().slice(0, 10));
  await click("Choose product photo");
  await click("Save product");
  await waitFor(() => Boolean(button("Edit product")));
  const saved = await Product.findOne();
  assert.equal(saved.name, "Farmer grown beans");
  assert.equal(saved.pricePaise, 4750);
  assert.equal(saved.farm, "Integration Farm");
  assert.match(saved.image, /^\/api\/images\//);
  assert.equal(await ProductImage.countDocuments(), 1);
  const imageResponse = await fetch(
    process.env.EXPO_PUBLIC_API_URL.replace(/\/api$/, "") + saved.image,
  );
  assert.equal(imageResponse.status, 200);
  assert.equal(imageResponse.headers.get("content-type"), "image/jpeg");
  await click("Pause");
  await waitFor(() => Boolean(button("Reactivate")));
  assert.equal((await Product.findById(saved.id)).active, false);
  await click("Reactivate");
  await waitFor(() => Boolean(button("Pause")));
  await click("Edit product");
  await fill("Price per kg (₹)", "50");
  await click("Save product");
  await waitFor(() => Boolean(button("Edit product")));
  assert.equal((await Product.findById(saved.id)).pricePaise, 5000);
  await click("Explore");
  await waitFor(() => text(app.root).includes("Farmer grown beans"));
  await click("My products");
  await waitFor(() => Boolean(button("Delete product")));
  await click("Delete product");
  await click("Confirm delete");
  await waitFor(() =>
    text(app.root).includes("You have not added any products yet."),
  );
  assert.equal((await Product.findById(saved.id)).deleted, true);
  await click("Explore");
  await waitFor(() => text(app.root).includes("No available products."));
  await act(async () => {
    await new Promise((r) => setTimeout(r, 100));
  });
  await act(async () => app.unmount());
  app = null;
  // Exercise the real tracking UI against the test API; substitute only device GPS.
  const { Order } = await moduleAt("src/models/Order.js");
  const { api } = load(path.join(__dirname, "../src/services/api.ts"));
  const { OrderTracking } = load(
    path.join(__dirname, "../src/screens/OrderTracking.tsx"),
  );
  const farmer = await User.findOne({ email: "farmer@test.example" });
  const rider = await User.create({
    name: "Test Rider",
    email: "rider@test.example",
    role: "delivery",
    approved: true,
    verified: true,
    passwordHash: await hashPassword(password),
  });
  const buyer = await User.create({
    name: "Test Buyer",
    email: "buyer@test.example",
    role: "consumer",
    verified: true,
    passwordHash: await hashPassword(password),
  });
  const tracked = await Order.create({
    consumer: buyer._id,
    producer: farmer._id,
    driver: rider._id,
    farm: farmer.farmName,
    status: "Out for Delivery",
    method: "delivery",
    payment: "cod",
    pickupAddress: "Test farm",
    address: "Test destination",
    pickupLocation: { latitude: 22.57, longitude: 88.36 },
    destinationLocation: { latitude: 22.51, longitude: 88.35 },
  });
  const showTracking = async (email) => {
    if (app) await act(async () => app.unmount());
    await waitFor(
      async () =>
        !(await Order.findById(tracked.id).select("+trackingSession"))
          .trackingSession,
    );
    const login = await api.login(email, password);
    await act(async () => {
      app = create(
        React.createElement(OrderTracking, {
          order: { id: tracked.id, driver: rider.id },
          user: login.user,
          onClose() {},
        }),
      );
    });
    await waitFor(() => text(app.root).includes("Pickup: Test farm"));
  };
  await showTracking("rider@test.example");
  permission = "denied";
  await click("Start sharing location");
  assert.ok(text(app.root).includes("Allow location access"));
  assert.equal(
    (await Order.findById(tracked.id).select("+trackingSession"))
      .trackingSession,
    undefined,
  );
  permission = "granted";
  await click("Start sharing location");
  assert.ok(button("Stop sharing location"));
  await act(async () =>
    gpsCallback({
      coords: { latitude: 22.54, longitude: 88.355, accuracy: 6 },
      timestamp: Date.now(),
    }),
  );
  await waitFor(async () =>
    Boolean((await Order.findById(tracked.id)).driverLocation),
  );
  const sample = await Order.findById(tracked.id);
  assert.equal(sample.driverLocation.latitude, 22.54);
  await act(async () => appStateCallback("background"));
  await waitFor(
    async () =>
      !(await Order.findById(tracked.id).select("+trackingSession"))
        .trackingSession,
  );
  assert.ok(gpsRemoved > 0, "backgrounding stops native GPS watcher");
  await act(async () => appStateCallback("active"));
  await click("Start sharing location");
  await showTracking("farmer@test.example");
  await waitFor(
    async () =>
      !(await Order.findById(tracked.id).select("+trackingSession"))
        .trackingSession,
  );
  assert.equal(button("Start sharing location"), undefined);
  await showTracking("buyer@test.example");
  assert.equal(button("Start sharing location"), undefined);
  assert.ok(text(app.root).includes("Destination: Test destination"));
  await act(async () => app.unmount());
  api.setToken(null);
  await act(async () => {
    app = create(React.createElement(App));
  });
  await waitFor(() => text(app.root).includes("No products listed yet."));
  // A stopped backend must show an error, never restore the former demo catalog.
  await new Promise((r) => server.close(r));
  server = null;
  await click("Refresh marketplace");
  await waitFor(() => text(app.root).includes("Cannot reach the farm server"));
  assert.equal(app.root.findAll((n) => n.type === "Image").length, 0);
  console.log(
    "PASS: one-time administrator setup, closed setup page, admin sign-in, second-admin creation, admin business pages, registration confirmation, real farmer sign-in, empty catalog, form validation, MongoDB product/photo persistence, image retrieval, edit, pause, reactivate, delete, public catalog refresh connection-error state, shared tracking UI, GPS permission denial, publication, background stop and unmount cleanup.",
  );
})()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (app) await act(async () => app.unmount());
    if (server) await new Promise((r) => server.close(r));
    if (mongoose) await mongoose.disconnect();
    if (replica) await replica.stop();
  });
