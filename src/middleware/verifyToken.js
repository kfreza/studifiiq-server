import jwt from "jsonwebtoken";
import { cs_httpError } from "../utils/httpError.js";

export const CS_TOKEN_COOKIE = "cs_token";

// verify jwt cookie
export const cs_verifyToken = (req, res, next) => {
  const cs_token = req.cookies?.[CS_TOKEN_COOKIE];
  if (!cs_token) return next(cs_httpError(401, "Unauthorized. Please log in to continue."));

  try {
    req.cs_user = jwt.verify(cs_token, process.env.CS_JWT_SECRET);
    next();
  } catch {
    next(cs_httpError(401, "Unauthorized. Your session has expired, please log in again."));
  }
};
