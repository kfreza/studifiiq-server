import { Router } from "express";
import { cs_getCollections } from "../config/db.js";
import { CS_CATEGORIES, CS_SORT_OPTIONS } from "../utils/constants.js";
import { cs_httpError, cs_toObjectId } from "../utils/httpError.js";

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

export default router;
