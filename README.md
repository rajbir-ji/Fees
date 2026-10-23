# College Fee ERP · PS-071 · AGT-007
React + Vite + Capacitor — one codebase for web, Android APK and iOS.

## Web (localhost)
    npm install
    npm run dev                 # http://localhost:5173

## Free web hosting
    npm run build
    npx firebase-tools login && npx firebase-tools use --add
    npx firebase-tools deploy   # hosting + firestore.rules
    # or: npx vercel

## Android APK
Cloud, no Android Studio: push this folder to a GitHub repo (branch `main`) →
Actions → "Build APK" → download artifact `fee-erp-debug-apk` → `app-debug.apk`.

Local (JDK 21 + Android SDK):
    npm run build
    npx cap add android
    npx cap sync android
    cd android && ./gradlew assembleDebug
    # → android/app/build/outputs/apk/debug/app-debug.apk

## iOS (Mac + Xcode)
    npx cap add ios && npx cap sync ios && npx cap open ios

## Structure
    src/App.jsx          glass UI: demo dock, ReAct trace, ledger card, late-fee configurator, HITL
    src/lib/lateFee.js   DAILY / TIERED / PERCENTAGE engine, grace, cap, Sundays, auto-block
    src/lib/agent.js     simulated ReAct runner for ⚡1 ⚡2 ⚡3
    src/lib/tools.js     Gemini function-calling schemas (6 tools)
    firestore.rules      per-college isolation via auth claims
    public/firebase-messaging-sw.js   FCM background notifications

## Not wired yet
Firebase Auth/Firestore reads, real Gemini calls, bank-webhook UTR check, receipt OCR,
device fingerprinting, AES encryption, QR image (the UPI button opens the intent link).
