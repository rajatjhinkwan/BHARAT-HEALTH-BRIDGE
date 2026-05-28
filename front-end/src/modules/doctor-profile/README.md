# Bharat Health Bridge — Doctor Profile Management

Enterprise doctor profile module with real-time sync, Cloudinary uploads, and MongoDB persistence.

## Route

`/doctor/profile` (requires doctor role + login)

## Demo Login

Use any seeded doctor from staff registry:

- Employee ID: `DOC-CARD-123`
- Password: `password123` (default from seed)
- Department: `Cardiology`

## API Base

`http://localhost:4000/api/doctors`

### Key Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/profile` | Full doctor profile |
| PATCH | `/profile` | Update sections |
| PATCH | `/profile/image` | Upload avatar |
| PATCH | `/profile/availability` | Schedule & status |
| POST | `/documents` | Upload license/certs |
| PATCH | `/profile/password` | Change password |

## Cloudinary (Optional)

Add to `back-end/.env`:

```
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

Without Cloudinary, files save to `back-end/uploads/` and serve at `/uploads/`.
