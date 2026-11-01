# Routes C and D, and side paths

## Route C: third-party "widgets for Fitbit" apps

Apps such as *Widgets for Fitbit* and *FitWidget* log into the Fitbit/Google
account on your behalf and draw widgets. Zero setup, but:

- They are tiny indie apps with very few ratings. Several older ones died when
  Fitbit changed its API, and the September 2026 retirement of the legacy API
  will likely take out any that have not migrated.
- You hand a third party your health account credentials or OAuth grant.
- Metric choice is whatever the developer built.

Fine for a quick test. Not something to rely on.

## Route D: native iOS app (Swift, WidgetKit + HealthKit)

Build our own app with a widget extension. Two data paths:

1. **HealthKit only** (after Route A's sync is on): the widget reads Apple
   Health directly. No network, no tokens, refreshes on HealthKit background
   delivery. Cleanest option for steps/calories/sleep/HR.
2. **Google Health API inside the app**: needed for Fitbit-only scores. Requires
   the same OAuth setup as Route B but with the token in the iOS Keychain.

Costs: Xcode, an Apple Developer account for on-device installs beyond 7 days
($99/yr), and real Swift work. Worth it only if the widget becomes something to
share or publish. Good reference: "Building WellnessWidgets" (bitcot.com) walks
through HealthKit + WidgetKit + SwiftUI.

## Side path: Home Assistant

If a Home Assistant instance exists, the Fitbit integration pulls daily
summaries into HA, and the HA iOS companion app (2026.9+) offers Home/Lock
Screen widgets for any entity. That gives configurable widgets with no extra
code, at the cost of running HA. The HA Fitbit integration is also on the legacy
API, so check its migration status before investing.

## Side path: Shortcuts

Apple Shortcuts can read Apple Health samples ("Find Health Samples") and the
Shortcuts widget can run one on tap, but Shortcuts cannot draw a live-updating
widget face. Useful for "log water to Fitbit" style actions, not for display.
