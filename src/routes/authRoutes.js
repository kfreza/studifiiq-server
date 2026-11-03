import { Router } from "express";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { cs_getCollections } from "../config/db.js";
import { cs_httpError } from "../utils/httpError.js";
import { CS_TOKEN_COOKIE, cs_verifyToken } from "../middleware/verifyToken.js";

const router = Router();

const CS_SESSION_COOKIES = ["__Secure-better-auth.session_token", "better-auth.session_token"];
const CS_TOKEN_AGE = 7 * 24 * 60 * 60 * 1000;

// cookie options
const cs_cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
});

// issue jwt from a valid betterauth session
router.post("/jwt", async (req, res) => {
  const cs_raw = CS_SESSION_COOKIES.map((name) => req.cookies?.[name]).find(Boolean);
  if (!cs_raw) throw cs_httpError(401, "Unauthorized. Please log in first.");

  const cs_dot = cs_raw.lastIndexOf(".");
  const cs_sessionToken = cs_dot > 0 ? cs_raw.slice(0, cs_dot) : cs_raw;

  const { sessions, users } = await cs_getCollections();
  const cs_session = await sessions.findOne({ token: cs_sessionToken });
  if (!cs_session || new Date(cs_session.expiresAt) < new Date()) {
    throw cs_httpError(401, "Your session has expired. Please log in again.");
  }

  const cs_userId = String(cs_session.userId);
  const cs_user = await users.findOne(
    ObjectId.isValid(cs_userId) ? { _id: new ObjectId(cs_userId) } : { _id: cs_session.userId }
  );
  if (!cs_user) throw cs_httpError(401, "Account not found. Please log in again.");

  const cs_payload = {
    uid: String(cs_user._id),
    email: cs_user.email,
    name: cs_user.name,
    photo: cs_user.image || "",
  };
  const cs_token = jwt.sign(cs_payload, process.env.CS_JWT_SECRET, { expiresIn: "7d" });

  res.cookie(CS_TOKEN_COOKIE, cs_token, { ...cs_cookieOptions(), maxAge: CS_TOKEN_AGE });
  res.json({ ok: true, user: cs_payload });
});

// clear jwt
router.post("/logout", (req, res) => {
  res.clearCookie(CS_TOKEN_COOKIE, cs_cookieOptions());
  res.json({ ok: true });
});

// current user
router.get("/me", cs_verifyToken, (req, res) => {
  res.json(req.cs_user);
});

export default router;
