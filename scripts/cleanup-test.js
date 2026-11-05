// Removes the local test accounts and their data. Usage: npm run cleanup:test
import "dotenv/config";
import { cs_connectDB, cs_getCollections } from "../src/config/db.js";

const CS_TEST_EMAILS = ["host.test@studiospace.dev", "creator.test@studiospace.dev"];

const cs_run = async () => {
  const cs_db = await cs_connectDB();
  const { cs_studios, cs_reviews, cs_bookings, cs_wishlist, users } = await cs_getCollections();

  // test studios and their data
  const cs_testStudios = await cs_studios.find({ ownerEmail: { $in: CS_TEST_EMAILS } }, { projection: { _id: 1 } }).toArray();
  const cs_studioIds = cs_testStudios.map((studio) => studio._id);

  const cs_results = {
    studios: (await cs_studios.deleteMany({ _id: { $in: cs_studioIds } })).deletedCount,
    reviews: (await cs_reviews.deleteMany({ $or: [{ studioId: { $in: cs_studioIds } }, { userEmail: { $in: CS_TEST_EMAILS } }] })).deletedCount,
    bookings: (await cs_bookings.deleteMany({ $or: [{ studioId: { $in: cs_studioIds } }, { userEmail: { $in: CS_TEST_EMAILS } }] })).deletedCount,
    wishlist: (await cs_wishlist.deleteMany({ $or: [{ studioId: { $in: cs_studioIds } }, { userEmail: { $in: CS_TEST_EMAILS } }] })).deletedCount,
  };

  // test accounts
  const cs_testUsers = await users.find({ email: { $in: CS_TEST_EMAILS } }, { projection: { _id: 1 } }).toArray();
  const cs_userIds = cs_testUsers.flatMap((user) => [user._id, String(user._id)]);
  cs_results.sessions = (await cs_db.collection("session").deleteMany({ userId: { $in: cs_userIds } })).deletedCount;
  cs_results.accounts = (await cs_db.collection("account").deleteMany({ userId: { $in: cs_userIds } })).deletedCount;
  cs_results.users = (await users.deleteMany({ email: { $in: CS_TEST_EMAILS } })).deletedCount;

  console.log("Removed test data:", cs_results);
  process.exit(0);
};

cs_run().catch((err) => {
  console.error("Cleanup failed:", err.message);
  process.exit(1);
});
