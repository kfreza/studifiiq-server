import { CS_CATEGORIES } from "./constants.js";
import { cs_httpError } from "./httpError.js";

const cs_text = (value) => String(value ?? "").trim();

const cs_isUrl = (value) => {
  try {
    const cs_url = new URL(value);
    return cs_url.protocol === "http:" || cs_url.protocol === "https:";
  } catch {
    return false;
  }
};

const cs_numberIn = (value, min, max, message, integer = false) => {
  const cs_value = Number(value);
  if (!Number.isFinite(cs_value) || cs_value < min || cs_value > max || (integer && !Number.isInteger(cs_value))) {
    throw cs_httpError(400, message);
  }
  return cs_value;
};

// validate and clean studio input
export const cs_validateStudio = (body = {}) => {
  const title = cs_text(body.title);
  if (title.length < 4 || title.length > 80) throw cs_httpError(400, "Title must be between 4 and 80 characters.");

  const category = cs_text(body.category);
  if (!CS_CATEGORIES.includes(category)) throw cs_httpError(400, "Choose a valid studio category.");

  const hourlyRate = cs_numberIn(body.hourlyRate, 5, 5000, "Hourly rate must be between $5 and $5,000.");
  const securityDeposit = cs_numberIn(body.securityDeposit, 0, 10000, "Security deposit must be between $0 and $10,000.");
  const maxCapacity = cs_numberIn(body.maxCapacity, 1, 500, "Max capacity must be a whole number from 1 to 500.", true);

  const location = cs_text(body.location);
  if (location.length < 3 || location.length > 100) throw cs_httpError(400, "Location must be between 3 and 100 characters.");

  const images = (Array.isArray(body.images) ? body.images : []).map(cs_text).filter(Boolean);
  if (images.length < 1 || images.length > 6) throw cs_httpError(400, "Add between 1 and 6 photos.");
  if (!images.every(cs_isUrl)) throw cs_httpError(400, "Every photo must be a valid http or https URL.");

  const amenities = [...new Set((Array.isArray(body.amenities) ? body.amenities : []).map(cs_text).filter(Boolean))];
  if (amenities.length < 1 || amenities.length > 20) throw cs_httpError(400, "Choose between 1 and 20 amenities.");
  if (amenities.some((item) => item.length > 40)) throw cs_httpError(400, "Each amenity must be 40 characters or fewer.");

  const overview = cs_text(body.overview);
  if (overview.length < 50 || overview.length > 2000) throw cs_httpError(400, "Overview must be between 50 and 2,000 characters.");

  return { title, category, hourlyRate, securityDeposit, maxCapacity, location, images, amenities, overview };
};
