# Harvest ? connected React Native marketplace

The app loads products and user data from the Node.js/MongoDB API. There are no preloaded vegetables, stock photos, fictional ratings or demo role switching. Old AsyncStorage demo records are no longer read.

## Start

Start the backend first (see ../farm-backend/README.md). From this folder:

    npm.cmd install
    npm.cmd start

Android Studio emulator: npm.cmd run android. Browser: npm.cmd run web.

The API defaults to http://10.0.2.2:4000/api on Android and http://localhost:4000/api on web/iOS simulator. For a physical phone, set EXPO_PUBLIC_API_URL to your computer's LAN IP in .env.local and restart Expo. Do not use 10.0.2.2 for browser previews or real phones. The phone and computer must be on the same network.

## Add a farmer product

1. Open Sign in / Register, choose Register, select Farmer, and enter your name, farm name, email and password (12 characters minimum).
2. Verify your email with the code. With local EXPOSE_DEV_OTP enabled, the app labels and displays the development-only code returned by the API.
3. A real administrator signs in, opens Users, and approves the verified farmer account. Create the first administrator with the backend create-admin command.
4. Sign in as the farmer and open My products. If approval happened after login, press Check approval status.
5. Choose Add product. Enter its name, price, stock, minimum order, location, a farm pickup map pin, category, growing method and actual harvest date. Add an expiry date if needed.
6. Choose your product photo from the device, or leave the photo empty. JPEG/PNG/WebP, up to 5 MB; images are verified, resized and stored in MongoDB.
7. Save product. It appears in My products and in Explore when active, in stock and not expired. Edit, pause, reactivate or delete it from My products. Deletion requires confirmation.

Farm identity comes from the authenticated account. You cannot publish for another farmer or bypass approval from the app. No replacement image is supplied for missing photos.

## Connected workflows

Sign-in/registration/recovery, profiles, public product discovery, farmer listing management, favorites, carts, cash checkout, orders, cancellation, pickup/delivery handover, reviews, order conversations, support tickets, notifications and administrator account approvals use the backend. Amounts and inventory are confirmed by the server. No successful local fallback is shown when the backend is unavailable.

Tokens remain in memory. Sign in again after restarting the app; saved products, orders and uploaded photos remain in MongoDB. The interface is English. Online payments, geospatial search, identity-document checks and bank settlements remain outside this implementation.

## Organization

App.tsx contains the app shell and navigation. Each screen is separate in src/screens/, shared controls are in src/components/, and src/services/api.ts contains typed HTTP operations. Styles and colors remain in src/styles/ and src/theme/.

## Verify

    npm.cmd run typecheck
    npm.cmd test
    npm.cmd run build:web

Frontend integration tests render the real farmer screens and send real HTTP requests to an isolated backend/MongoDB replica set. Native display primitives, the embedded map view, photo picker and GPS are substituted. Tracking tests cover permission denial, GPS publication, background stop and screen cleanup. Install backend dependencies before running these tests. Tests never use your configured application database. Physical-device layout testing is still required.

## Order maps and delivery tracking

1. Farmer: add or edit a product and choose its **Farm pickup** pin. Tap the map, enter coordinates, or press **Use current location**. Existing products need a pickup pin before they can be ordered.
2. Consumer: choose **Home delivery** in the basket, enter the address and select the **Delivery destination** pin. Farm pickup orders only need the farm's pin.
3. Farmer: progress the order through Accepted, Preparing and Ready for Pickup.
4. An approved delivery partner signs in, opens Deliveries and presses **Accept delivery**. The assigned partner can then see both endpoints.
5. Any participant opens **Orders / Deliveries ? Track on map**. Green is pickup, blue is destination, orange is the delivery partner. The partner presses **Start sharing location** and allows foreground location permission.
6. Consumers and farmers see the partner's latest position, timestamp and accuracy, refreshed every 10 seconds. **Navigate to pickup / destination** opens Google Maps directions.

Sharing runs only while the tracking screen is open and the app is in the foreground. It stops on leaving the screen, backgrounding, manual stop, sign-out or completed handover. Returning to the screen requires pressing Start again. This implementation does not run background tracking or estimate arrival times. Samples older than one minute are marked stale. Network failures stop GPS publishing; the screen tells the partner to restart. Abrupt disconnection can leave a stale last position visible until sharing is restarted or stopped.

Leaflet is hosted by the backend at `/map/`; OpenStreetMap supplies map tiles. No map API key is required. Internet access is needed for tiles; coordinates remain visible if tiles fail. Web GPS requires HTTPS or localhost. Android Studio emulator: use Extended controls ? Location to provide a simulated position; test actual movement on a real phone. For standalone native builds, rebuild after adding the Expo location plugin; use HTTPS for a deployed backend.

The map, location picker, tracking screen, and GPS/polling hook are separate files under `src/components/maps/`, `src/screens/OrderTracking.tsx`, and `src/hooks/useOrderTracking.ts`.

Older orders without coordinates display a missing-pin message instead of invented coordinates. Editing a product changes future orders only; each order keeps its original pickup and destination pins. Multiple pickup points from one farmer create separate orders with the existing checkout-wide delivery charge and discount allocation.
