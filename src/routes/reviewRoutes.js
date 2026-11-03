import { Router } from "express";
import { cs_getCollections } from "../config/db.js";
import { cs_toObjectId } from "../utils/httpError.js";

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

export default router;
