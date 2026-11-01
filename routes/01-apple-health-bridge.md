# Route A: Google Health → Apple Health → widget app

No code. Works because Google Health 5.05 (August 2026) can now **write** Fitbit data
into Apple Health, not just read from it.

## Steps

1. **Update Google Health** on the iPhone to version 5.05 or later
   (App Store → profile → scroll to updates).
2. Open Google Health. On first launch after the update a consent page titled
   **"Sync Google Health with Apple Health"** appears. Accept it.
   If it does not appear: Google Health → profile → settings → *Apple Health* →
   turn on sync, and grant all read/write categories.
3. Verify the grant in Apple Health: **Health app → profile picture → Apps →
   Google Health**. Everything you want in widgets must be allowed to *write*.
4. Wear the Fitbit for a bit, sync Google Health, then open Apple Health →
   Browse → Activity → Steps and confirm a "Google Health" source appears.
5. Add widgets. Two options:
   - **Apple built-in**: long-press the Home Screen → Edit → Add Widget →
     *Fitness* (Activity rings; counts calories from Apple Health active energy)
     or *Health* widgets on iOS 26 (steps, sleep, heart rate, medications).
   - **Third-party Health widget apps** (all read Apple Health, so they all see
     the Fitbit data): Widget Wizard, Health Widget App Pro, Stats, VitalTile,
     Hidgets, Step Count Widget. These let you pick metrics per widget slot,
     which is the "interchangeable" behaviour we want.

## What syncs

Reported in coverage of 5.05: steps, exercise/workouts, sleep, vitals
(heart rate, resting heart rate, SpO2, respiratory rate, skin temperature),
calories, distance, weight.

Known gaps (as of August 2026): **HRV is not written** to Apple Health.
Fitbit-only scores (Daily Readiness, Sleep Score, Active Zone Minutes, Stress
Management) have no Apple Health type and do not transfer. Use Route B for those.

## Gotchas

- Apple Health de-duplicates by source priority. If an Apple Watch is also
  paired, set source priority under each data type → *Data Sources & Access*.
- Sync is not instant. Google Health must sync from the Fitbit over Bluetooth,
  then push to Apple Health. Expect a lag of minutes, sometimes longer when the
  app is backgrounded.
- Widget refresh is governed by iOS WidgetKit budgets (roughly every 15 to
  60 minutes), not by the app. Lock Screen widgets refresh more often.
