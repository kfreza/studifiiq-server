# Studifiiq API

Express and MongoDB server for [Studifiiq](https://studifiiq-client.vercel.app), a marketplace for booking creative studios by the hour. Client repository: https://github.com/kfreza/studifiiq-client

## Endpoints

Routes marked with a lock need the `cs_token` HTTP-only JWT cookie and return **401** without it.

| Method | Path | Description |
|---|---|---|
| GET | `/api/studios` | List studios: `category`, `search`, `sort`, `page`, `limit` |
| GET | `/api/featured` | Six top-rated studios |
| GET | `/api/categories` | Categories with studio counts |
| GET | `/api/studios/:id` | One studio |
| GET | `/api/studios/:id/reviews` | Reviews for a studio |
| GET | `/api/studios/:id/availability?date=` | Booked and requested slots for a date |
| POST 🔒 | `/api/studios` | Create a studio |
| PATCH 🔒 | `/api/studios/:id` | Update your studio |
| DELETE 🔒 | `/api/studios/:id` | Delete your studio |
| GET 🔒 | `/api/my-listings` | Studios you host |
| POST 🔒 | `/api/bookings` | Request a booking (rejects overlaps with confirmed bookings) |
| GET 🔒 | `/api/my-bookings` | Your bookings |
| PATCH 🔒 | `/api/bookings/:id/cancel` | Cancel your pending booking |
| GET 🔒 | `/api/incoming-bookings` | Requests for studios you host |
| PATCH 🔒 | `/api/bookings/:id/status` | Host confirms or declines a request |
| GET 🔒 | `/api/dashboard` | Listing, booking and earnings stats |
| POST 🔒 | `/api/studios/:id/reviews` | Review a studio you booked |
| GET, POST, DELETE 🔒 | `/api/wishlist` | Saved studios |
| POST 🔒 | `/api/upload` | Upload an image to imgbb |
| POST | `/api/jwt` | Exchange a BetterAuth session for the JWT cookie |
| POST | `/api/logout` | Clear the JWT cookie |

## Run locally

```bash
npm install
cp .env.example .env    # MongoDB URI, JWT secret, imgbb key, client URL
npm run seed            # demo data
npm run dev             # http://localhost:5000
```

`npm run cleanup:test` removes local test accounts and their data.
