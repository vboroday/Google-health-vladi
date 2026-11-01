# Route B: Google Health API → small backend → Scriptable widget

Full control over what the widget shows, including Fitbit-only metrics.

## Architecture

```
Fitbit tracker ──BT──▶ Google Health app ──▶ Google cloud
                                               │  Google Health API (OAuth 2.0)
                                               ▼
                    ┌───────────────────────────────────────┐
                    │ summary endpoint (Vercel function or  │
                    │ any tiny server). Holds the refresh   │
                    │ token, refreshes access token, calls  │
                    │ the API, returns one small JSON blob. │
                    └───────────────────────────────────────┘
                                               │ HTTPS GET + secret header
                                               ▼
                    Scriptable widget on iPhone (scriptable/fitbit-widget.js)
```

Why a backend at all? Scriptable can do HTTP, but it has no safe place for a
long-lived OAuth refresh token and cannot run the OAuth redirect flow cleanly.
Keeping tokens server-side also means the widget stays a dumb renderer that we
can restyle without touching auth.

## The API (what is known, what needs checking)

The legacy Fitbit Web API (`api.fitbit.com/1/user/-/...`) is being retired
(final deprecation announced for September 2026). New work should target the
**Google Health API**.

Known from the migration guide and Fitbit developer forum:

- Auth is standard **Google OAuth 2.0**, not Fitbit's own OAuth server.
- Scopes look like `https://www.googleapis.com/auth/googlehealth.<area>` and
  `...<area>.readonly`. The old Fitbit `activity` scope maps to
  `googlehealth.activity_and_fitness(.readonly)`. Expect similar names for
  heart rate, sleep, body, oxygen saturation, temperature, respiratory rate.
- App registration offers a **Personal** application type. On the legacy API
  this type got intraday data for the developer's own account automatically.
  Confirm the same holds on the new API.
- Existing Fitbit tokens do not carry over. Re-consent is required.
- **Unverified / "Testing" Google OAuth apps get refresh tokens that expire
  every 7 days.** This is a forum report, not official text, but it matches
  normal Google OAuth behaviour for apps in Testing status. Either publish the
  app (verification can be heavy for health scopes) or accept a weekly re-auth.
  Check this first, it decides whether the backend is set-and-forget.

Still to confirm (developers.google.com was not reachable from this session):

- Base URL and exact resource paths for daily summaries and intraday series.
- Whether "Legacy Fitbit Account" (non-Google-login) users can use the API at
  all. The forum says they cannot, so the Fitbit account must be migrated to a
  Google account.
- Rate limits per user per hour.

## Backend sketch

One endpoint, `GET /api/summary`, protected by a shared secret header, returns
the shape in `api/summary.example.json`:

```json
{
  "date": "2026-11-01",
  "steps": 7421, "stepsGoal": 10000,
  "caloriesOut": 1980, "caloriesGoal": 2500,
  "activeZoneMinutes": 28, "azmGoal": 22,
  "restingHeartRate": 58,
  "sleepMinutes": 412, "sleepScore": 81,
  "readinessScore": 74,
  "updatedAt": "2026-11-01T14:03:12Z"
}
```

Implementation notes:

- Store `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `REFRESH_TOKEN`, and
  `WIDGET_SECRET` as environment variables. Never commit them.
- Do the one-time consent on a laptop with a redirect to `localhost`, save the
  refresh token, then deploy.
- Cache the API response for 5 to 10 minutes. Widgets poll more often than the
  data changes, and health APIs rate-limit per user.
- Return `Cache-Control: no-store` to Scriptable and do caching server-side,
  otherwise iOS may serve a stale widget for hours.

## Widget

`scriptable/fitbit-widget.js` renders small, medium and large layouts from the
JSON above. It has a `MOCK` flag so the layout can be designed before the backend
exists. Metrics shown are chosen by a `METRICS` array at the top of the file, so
"interchanging" what a widget shows is a one-line edit, and the same script can be
added several times with different widget parameters.
