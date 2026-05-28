# Database seeding — Bharat Health Bridge

## Quick start

From `back-end/` with MongoDB running:

```bash
npm run seed:hospital
```

This clears and re-seeds patients, beds (all clinical wards), staff, and OPD queue data.

## Automatic bootstrap (server start)

On `npm run dev` / `npm start`, the API runs:

- `ensureClinicalBeds()` — beds for ICU, Neuro Ward, Nephro Ward, etc. (Room 101–103)
- `ensureLabSeed()` — sample lab orders (Indian patient names)
- `ensurePharmacySeed()` — medicine catalog with low/out/expiring stock

## Demo login

- Admin: `admin@hospital.com` / `password123`
- Reception: `reception@hospital.com` / `password123`

## Nurse Station wards

Use labels in the UI (Neurology, Nephrology, …) mapped to DB ward keys (`Neuro Ward`, `Nephro Ward`, …). After seeding, open **Nurse Station** with **All rooms** to see ward-wide bed counts.
