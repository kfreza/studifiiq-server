import { Router } from "express";
import { cs_getCollections } from "../config/db.js";
import { cs_httpError, cs_toObjectId } from "../utils/httpError.js";
import { cs_verifyToken } from "../middleware/verifyToken.js";

const router = Router();

// studio reviews
router.get("/studios/:id/reviews", async (req, res) => {
  const cs_studioId = cs_toObjectId(req.params.id, "Studio");
  const { cs_reviews } = await cs_getCollections();
  const reviews = await cs_reviews
    .find({ studioId: cs_studioId }, { projection: { userEmail: 0 } })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();
  res.json(reviews);
});

// add review
router.post("/studios/:id/reviews", cs_verifyToken, async (req, res) => {
  const cs_studioId = cs_toObjectId(req.params.id, "Studio");
  const cs_rating = Number(req.body?.rating);
  const cs_comment = String(req.body?.comment ?? "").trim();
  if (!Number.isInteger(cs_rating) || cs_rating < 1 || cs_rating > 5) throw cs_httpError(400, "Choose a rating from 1 to 5 stars.");
  if (cs_comment.length < 10 || cs_comment.length > 600) throw cs_httpError(400, "Write a review between 10 and 600 characters.");

  const { cs_studios, cs_reviews, cs_bookings } = await cs_getCollections();
  const cs_email = req.cs_user.email;
  const cs_studio = await cs_studios.findOne({ _id: cs_studioId });
  if (!cs_studio) throw cs_httpError(404, "Studio not found.");
  if (cs_studio.ownerEmail === cs_email) throw cs_httpError(400, "You can't review a studio you host.");

  const cs_booked = await cs_bookings.findOne({
    studioId: cs_studioId,
    userEmail: cs_email,
    status: { $in: ["Confirmed", "Completed"] },
  });
  if (!cs_booked) throw cs_httpError(403, "Only creators with a confirmed or completed booking can review this studio.");
  if (await cs_reviews.findOne({ studioId: cs_studioId, userEmail: cs_email })) {
    throw cs_httpError(409, "You've already reviewed this studio.");
  }

  const cs_review = {
    studioId: cs_studioId,
    userName: req.cs_user.name,
    userEmail: cs_email,
    userPhoto: req.cs_user.photo || "",
    rating: cs_rating,
    comment: cs_comment,
    createdAt: new Date(),
  };
  const { insertedId } = await cs_reviews.insertOne(cs_review);

  // recalculate studio rating
  const [cs_stats] = await cs_reviews
    .aggregate([{ $match: { studioId: cs_studioId } }, { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } }])
    .toArray();
  await cs_studios.updateOne(
    { _id: cs_studioId },
    { $set: { rating: Math.round(cs_stats.avg * 10) / 10, reviewCount: cs_stats.count } }
  );

  const { userEmail, ...cs_public } = cs_review;
  res.status(201).json({ ...cs_public, _id: insertedId });
});

export default router;
