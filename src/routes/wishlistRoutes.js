import { Router } from "express";
import { cs_getCollections } from "../config/db.js";
import { cs_httpError, cs_toObjectId } from "../utils/httpError.js";
import { cs_verifyToken } from "../middleware/verifyToken.js";

const router = Router();

// saved studio ids
router.get("/wishlist/ids", cs_verifyToken, async (req, res) => {
  const { cs_wishlist } = await cs_getCollections();
  const cs_items = await cs_wishlist
    .find({ userEmail: req.cs_user.email }, { projection: { studioId: 1 } })
    .toArray();
  res.json(cs_items.map((item) => String(item.studioId)));
});

// saved studios
router.get("/wishlist", cs_verifyToken, async (req, res) => {
  const { cs_wishlist } = await cs_getCollections();
  const studios = await cs_wishlist
    .aggregate([
      { $match: { userEmail: req.cs_user.email } },
      { $sort: { createdAt: -1 } },
      { $lookup: { from: "cs_studios", localField: "studioId", foreignField: "_id", as: "studio" } },
      { $unwind: "$studio" },
      { $replaceRoot: { newRoot: "$studio" } },
    ])
    .toArray();
  res.json(studios);
});

// save studio
router.post("/wishlist", cs_verifyToken, async (req, res) => {
  const cs_studioId = cs_toObjectId(req.body?.studioId, "Studio");
  const { cs_studios, cs_wishlist } = await cs_getCollections();
  if (!(await cs_studios.findOne({ _id: cs_studioId }, { projection: { _id: 1 } }))) {
    throw cs_httpError(404, "Studio not found.");
  }
  await cs_wishlist.updateOne(
    { userEmail: req.cs_user.email, studioId: cs_studioId },
    { $setOnInsert: { userEmail: req.cs_user.email, studioId: cs_studioId, createdAt: new Date() } },
    { upsert: true }
  );
  res.status(201).json({ ok: true, studioId: String(cs_studioId) });
});

// remove studio
router.delete("/wishlist/:studioId", cs_verifyToken, async (req, res) => {
  const cs_studioId = cs_toObjectId(req.params.studioId, "Studio");
  const { cs_wishlist } = await cs_getCollections();
  await cs_wishlist.deleteOne({ userEmail: req.cs_user.email, studioId: cs_studioId });
  res.json({ ok: true, studioId: String(cs_studioId) });
});

export default router;
