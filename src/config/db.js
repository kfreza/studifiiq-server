import { MongoClient, ServerApiVersion } from "mongodb";

// One cached connection, reused across requests (works locally and on Vercel serverless)
let cs_client = null;
let cs_dbPromise = null;

export const cs_connectDB = () => {
  if (cs_dbPromise) return cs_dbPromise;

  const cs_uri = process.env.CS_MONGODB_URI;
  if (!cs_uri) throw new Error("CS_MONGODB_URI is missing in .env");

  cs_client = new MongoClient(cs_uri, {
    serverApi: { version: ServerApiVersion.v1, deprecationErrors: true },
  });

  cs_dbPromise = cs_client
    .connect()
    .then((client) => client.db(process.env.CS_DB_NAME || "studioSpaceDB"))
    .catch((err) => {
      cs_dbPromise = null; // allow a retry on the next request
      throw err;
    });

  return cs_dbPromise;
};

// All app-owned collections in one place
export const cs_getCollections = async () => {
  const cs_db = await cs_connectDB();
  return {
    cs_studios: cs_db.collection("cs_studios"),
    cs_bookings: cs_db.collection("cs_bookings"),
    cs_reviews: cs_db.collection("cs_reviews"),
    cs_wishlist: cs_db.collection("cs_wishlist"),
    // BetterAuth-owned collections (names predefined by BetterAuth — read only here)
    users: cs_db.collection("user"),
    sessions: cs_db.collection("session"),
  };
};
