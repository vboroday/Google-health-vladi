# Fitbit → iPhone widgets

Work folder for getting Fitbit data (now served through the **Google Health** app,
which replaced the Fitbit app in May 2026) onto the iPhone Home Screen / Lock Screen
as widgets: steps, calories burned, active minutes, heart rate, sleep, and so on.

Status: **research + starter code**, as of 2026-11-01.

## The problem

- The Google Health iOS app ships almost no widgets (reports say only a Steps widget
  survived the May 2026 redesign), and there is no official way to configure what
  a widget shows.
- Fitbit's own Web API is being retired: Google announced final deprecation of the
  legacy endpoints for **September 2026** and moved everything to the
  **Google Health API** with Google OAuth.
- We want widgets we control: which metrics, which layout, and the ability to swap
  them around.

## Routes, ranked

| # | Route | Effort | Control | Risk |
|---|-------|--------|---------|------|
| A | **Google Health → Apple Health → any Health widget app** | Low (no code) | Medium | Low |
| B | **Google Health API → tiny backend → Scriptable widget** | Medium (code) | Full | Medium (API is new, token rules) |
| C | Third-party "Widgets for Fitbit" style apps | Very low | Low | Medium (tiny apps, may break) |
| D | Native Swift app (WidgetKit + HealthKit) | High | Full | Low once built |

Details for each live in `routes/`.

### Recommendation

Start with **Route A today**. Google Health version 5.05 (rolled out from
2 August 2026) added a "Sync to Apple Health" switch, so Fitbit data lands in Apple
Health without third-party sync apps. Once it is in Apple Health, every Health
widget app on the App Store, and Apple's own widgets, can show it. That gets steps,
calories, sleep and heart rate on the Home Screen in about ten minutes.

Then build **Route B** in this folder as the "fully custom" path: a Scriptable widget
that renders JSON from a small endpoint we own. Route B is also the only route that
lets us show Fitbit-only metrics (Daily Readiness, Active Zone Minutes, Sleep Score)
that do not map onto Apple Health types.

Route D is the long-term option if we ever want to ship it to other people.

## What is in here

```
google-health-vladi/
├── README.md                     this file
├── routes/
│   ├── 01-apple-health-bridge.md  Route A step by step
│   ├── 02-google-health-api.md    Route B design, OAuth, endpoints, caveats
│   └── 03-other-options.md        Routes C and D, plus Home Assistant
├── scriptable/
│   └── fitbit-widget.js           Scriptable widget (works in mock mode now)
└── api/
    └── summary.example.json       JSON shape the widget expects
```

## Next steps

- [ ] Update Google Health on the iPhone to 5.05 or later and turn on Apple Health sync
      (`routes/01-apple-health-bridge.md`).
- [ ] Pick a Health widget app, add a steps + calories widget, confirm numbers match
      Google Health.
- [ ] Register an app in the Google Health API console as a **Personal** app
      (`routes/02-google-health-api.md`), and confirm the real endpoint URLs and
      refresh-token lifetime. These could not be fetched from this environment
      (developers.google.com was blocked), so the API notes are from the migration
      guide summaries and the Fitbit developer forum.
- [ ] Install Scriptable, paste `scriptable/fitbit-widget.js`, run it in mock mode.
- [ ] Stand up the summary endpoint (Vercel function or similar) and point the widget at it.

## Sources used

- Google Health 5.05 adds Apple Health sync:
  gadgetsandwearables.com (2026-08-03), idropnews.com, macobserver.com,
  techtimes.com (notes HRV still not synced).
- Legacy Fitbit Web API retirement and Google Health API migration:
  dev.fitbit.com/build/reference/web-api/, developers.google.com/health/migration,
  community.fitbit.com "Introducing the next phase of the Fitbit Web API".
- Fitbit community threads requesting an iOS widget (2021 onward), and 9to5Google
  reporting the trimmed widget lineup in May 2026.
