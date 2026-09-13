# Harvest — React Native frontend

One Expo application for a farm-to-consumer marketplace, based on the supplied Functional Requirements for the Farm.pdf.

## Run

Requires Node.js and npm. From this folder, run:

    npm install
    npm start

Scan the Expo QR code with a compatible Expo Go client, or use npm run android with an Android emulator. For the browser preview:

    npm run web

On Windows PowerShell, use npm.cmd if execution policy blocks npm.ps1. iOS simulator execution requires macOS.

## Included

- Consumer: search, categories, farming-method/price/distance filters, sorting, favourites, product details, basket quantities, save for later, delivery/pickup checkout, coupon, order history, cancellation, reorder, tracking, receipt and completed-order reviews.
- Producer: summary, listing creation/editing/image selection, pause/reactivate/delete, stock display and order status management.
- Delivery partner: available deliveries, acceptance, handover OTP and issue reporting.
- Administrator: overview, sample producer approval, listing moderation, support-ticket resolution and session activity log.
- Shared: profile, sample sign-in/registration/recovery, notifications, location entry, FAQs, support tickets and order conversation previews.

Switch roles using Switch workspace at the top of the content. The producer workspace represents Green Valley Farm. Use its tomatoes or carrots to demonstrate the full producer workflow.

Demo OTP: 123456. Coupon: FRESH10 (10%). Delivery: ₹35, free at ₹499, or free pickup. Each producer gets a separate suborder; discounts are allocated without changing the final basket total.

## Frontend boundary

This is a functional prototype, not an implementation of every one of the PDF's 141 requirements. Authentication, payments, verification, communication, refunds and deliveries are simulated. No backend, secrets, payment gateway or external messaging is implemented. Role switching is a demonstration feature, not an authorization boundary.

Products, basket, favourites, orders, tickets, name and address persist locally using AsyncStorage. Other preferences, conversations, reviews and moderation state last for the current session. Images use remote Unsplash URLs; uploaded image references are local previews.

Current limitations: English only; sample Kolkata locations/distances; fixed demo slots and harvest dates; kg units and 1 kg minimum; no GPS/maps, document verification, bank settlements, report downloads, regional translation, voice assistance, real market price feeds, multi-address management or comprehensive administrator configuration. These require additional frontend work and/or service integration.

## Validation

    npm run typecheck
    npm test
    npm run build:web

Component integration tests execute the actual app's handlers and state with native view primitives mocked. They do not replace visual inspection or testing on physical Android/iOS devices.

Project structure: App.tsx contains screens and local state; src/components/ contains separate Icon, Button, Field and Chips components; src/styles/appStyles.ts contains shared styles; src/theme/colors.ts contains theme colours; src/data.ts defines typed fixtures; tests/workflows.cjs verifies the main purchase and fulfilment flows.
