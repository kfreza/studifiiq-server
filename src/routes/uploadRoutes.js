import { Router } from "express";
import { cs_httpError } from "../utils/httpError.js";
import { cs_verifyToken } from "../middleware/verifyToken.js";

const router = Router();
const CS_MAX_BASE64 = 4.2 * 1024 * 1024;

// upload image to imgbb
router.post("/upload", cs_verifyToken, async (req, res) => {
  const cs_key = process.env.CS_IMGBB_KEY;
  if (!cs_key) throw cs_httpError(500, "Image upload isn't configured on the server.");

  const cs_image = String(req.body?.image || "");
  if (!cs_image) throw cs_httpError(400, "Choose an image to upload.");
  if (cs_image.length > CS_MAX_BASE64) throw cs_httpError(413, "Images must be 3 MB or smaller.");

  const cs_res = await fetch(`https://api.imgbb.com/1/upload?key=${cs_key}`, {
    method: "POST",
    body: new URLSearchParams({ image: cs_image }),
  });
  const cs_data = await cs_res.json().catch(() => null);
  if (!cs_res.ok || !cs_data?.data?.display_url) {
    throw cs_httpError(502, "The image host rejected this file. Try a JPG or PNG under 3 MB.");
  }
  res.status(201).json({ url: cs_data.data.display_url });
});

export default router;
