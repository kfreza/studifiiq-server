import { Router } from "express";
import { cs_getCollections } from "../config/db.js";
import { CS_CATEGORIES, CS_SORT_OPTIONS } from "../utils/constants.js";
import { cs_httpError, cs_toObjectId } from "../utils/httpError.js";
import { cs_validateStudio } from "../utils/validateStudio.js";
import { cs_verifyToken } from "../middleware/verifyToken.js";

const router = Router();

// all studios
router.get("/studios", async (req, res) => {
  const cs_category = String(req.query.category || "").trim();
  const cs_search = String(req.query.search || "").trim();
  const cs_sort = CS_SORT_OPTIONS[req.query.sort] || CS_SORT_OPTIONS.newest;
  const cs_page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const cs_limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 48);

  const cs_filter = {};
  if (cs_category && cs_category !== "All") {
    if (!CS_CATEGORIES.includes(cs_category)) throw cs_httpError(400, "Unknown studio category.");
    cs_filter.category = cs_category;
  }
  if (cs_search) {
    const cs_term = cs_search.toLowerCase();
    const cs_contains = (field) => ({ $gt: [{ $indexOfCP: [{ $toLower: field }, { $literal: cs_term }] }, -1] });
    cs_filter.$expr = {
      $or: [cs_contains("$title"), cs_contains("$location"), cs_contains("$category")],
    };
  }

  const { cs_studios } = await cs_getCollections();
  const [studios, total] = await Promise.all([
    cs_studios
      .find(cs_filter)
      .sort(cs_sort)
      .skip((cs_page - 1) * cs_limit)
      .limit(cs_limit)
      .toArray(),
    cs_studios.countDocuments(cs_filter),
  ]);

  res.json({ studios, total, page: cs_page, totalPages: Math.max(Math.ceil(total / cs_limit), 1) });
});

// featured studios
router.get("/featured", async (req, res) => {
  const { cs_studios } = await cs_getCollections();
  const studios = await cs_studios.find().sort(CS_SORT_OPTIONS.rating).limit(6).toArray();
  res.json(studios);
});

// category counts
router.get("/categories", async (req, res) => {
  const { cs_studios } = await cs_getCollections();
  const cs_counts = await cs_studios
    .aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }])
    .toArray();
  const cs_countMap = Object.fromEntries(cs_counts.map((item) => [item._id, item.count]));
  res.json(CS_CATEGORIES.map((name) => ({ name, count: cs_countMap[name] || 0 })));
});

// single studio
router.get("/studios/:id", async (req, res) => {
  const { cs_studios } = await cs_getCollections();
  const studio = await cs_studios.findOne({ _id: cs_toObjectId(req.params.id, "Studio") });
  if (!studio) throw cs_httpError(404, "Studio not found.");
  res.json(studio);
});

// owner check
const cs_findOwnedStudio = async (cs_studios, id, email) => {
  const cs_studio = await cs_studios.findOne({ _id: cs_toObjectId(id, "Studio") });
  if (!cs_studio) throw cs_httpError(404, "Studio not found.");
  if (cs_studio.ownerEmail !== email) throw cs_httpError(403, "You can only change studios you host.");
  return cs_studio;
};

// create studio
router.post("/studios", cs_verifyToken, async (req, res) => {
  const cs_data = cs_validateStudio(req.body);
  const cs_now = new Date();
  const cs_doc = {
    ...cs_data,
    ownerName: req.cs_user.name,
    ownerEmail: req.cs_user.email,
    ownerPhoto: req.cs_user.photo || "",
    rating: 0,
    reviewCount: 0,
    createdAt: cs_now,
    updatedAt: cs_now,
  };
  const { cs_studios } = await cs_getCollections();
  const { insertedId } = await cs_studios.insertOne(cs_doc);
  res.status(201).json({ ...cs_doc, _id: insertedId });
});

// my listings
router.get("/my-listings", cs_verifyToken, async (req, res) => {
  const { cs_studios } = await cs_getCollections();
  const studios = await cs_studios.find({ ownerEmail: req.cs_user.email }).sort(CS_SORT_OPTIONS.newest).toArray();
  res.json(studios);
});

// update studio
router.patch("/studios/:id", cs_verifyToken, async (req, res) => {
  const { cs_studios } = await cs_getCollections();
  const cs_studio = await cs_findOwnedStudio(cs_studios, req.params.id, req.cs_user.email);
  const cs_data = cs_validateStudio(req.body);
  const studio = await cs_studios.findOneAndUpdate(
    { _id: cs_studio._id },
    { $set: { ...cs_data, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  res.json(studio);
});

// delete studio
router.delete("/studios/:id", cs_verifyToken, async (req, res) => {
  const { cs_studios, cs_reviews, cs_bookings, cs_wishlist } = await cs_getCollections();
  const cs_studio = await cs_findOwnedStudio(cs_studios, req.params.id, req.cs_user.email);
  await cs_studios.deleteOne({ _id: cs_studio._id });
  await Promise.all([
    cs_reviews.deleteMany({ studioId: cs_studio._id }),
    cs_wishlist.deleteMany({ studioId: cs_studio._id }),
    cs_bookings.updateMany(
      { studioId: cs_studio._id, status: "Pending" },
      { $set: { status: "Cancelled", updatedAt: new Date() } }
    ),
  ]);
  res.json({ ok: true, deletedId: cs_studio._id });
});

export default router;
