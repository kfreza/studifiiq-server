import { Router } from "express";
import { cs_getCollections } from "../config/db.js";
import { cs_httpError, cs_toObjectId } from "../utils/httpError.js";
import { cs_verifyToken } from "../middleware/verifyToken.js";

const router = Router();
const CS_HOUR = 60 * 60 * 1000;

// date "YYYY-MM-DD"
const cs_isDate = (value) => {
  const cs_parts = String(value || "").split("-");
  if (cs_parts.length !== 3 || cs_parts[0].length !== 4) return false;
  const cs_date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(cs_date.getTime()) && cs_date.toISOString().startsWith(value);
};

// time "HH:MM" on the hour or half hour
const cs_isTime = (value) => {
  const cs_parts = String(value || "").split(":");
  if (cs_parts.length !== 2) return false;
  const [cs_h, cs_m] = cs_parts.map(Number);
  return Number.isInteger(cs_h) && cs_h >= 0 && cs_h <= 23 && (cs_m === 0 || cs_m === 30) && cs_parts[0].length === 2;
};

// slot times are stored as studio-local wall time
const cs_toDate = (date, time) => new Date(`${date}T${time}:00.000Z`);

// overlap with a confirmed booking
const cs_findConflict = (cs_bookings, studioId, start, end, excludeId) =>
  cs_bookings.findOne({
    studioId,
    status: "Confirmed",
    start: { $lt: end },
    end: { $gt: start },
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  });

const cs_conflictMessage = (conflict) =>
  `This studio is already booked from ${conflict.startTime} to ${conflict.endTime} on ${conflict.date}. Choose different hours.`;

// mark finished confirmed bookings as completed
const cs_completePast = (cs_bookings, filter) =>
  cs_bookings.updateMany(
    { ...filter, status: "Confirmed", end: { $lt: new Date() } },
    { $set: { status: "Completed", updatedAt: new Date() } }
  );

// create booking
router.post("/bookings", cs_verifyToken, async (req, res) => {
  const { studioId, date, startTime, endTime } = req.body || {};
  if (!cs_isDate(date)) throw cs_httpError(400, "Choose a valid booking date.");
  if (!cs_isTime(startTime) || !cs_isTime(endTime)) throw cs_httpError(400, "Choose valid start and end times.");

  const cs_today = new Date().toISOString().slice(0, 10);
  if (date < cs_today) throw cs_httpError(400, "Choose today or a future date.");

  const cs_start = cs_toDate(date, startTime);
  const cs_end = cs_toDate(date, endTime);
  const cs_hours = (cs_end - cs_start) / CS_HOUR;
  if (cs_hours <= 0) throw cs_httpError(400, "End time must be after the start time.");
  if (cs_hours > 12) throw cs_httpError(400, "A single booking can be at most 12 hours.");

  const { cs_studios, cs_bookings } = await cs_getCollections();
  const cs_studio = await cs_studios.findOne({ _id: cs_toObjectId(studioId, "Studio") });
  if (!cs_studio) throw cs_httpError(404, "Studio not found.");
  if (cs_studio.ownerEmail === req.cs_user.email) throw cs_httpError(400, "You can't book a studio you host.");

  const cs_conflict = await cs_findConflict(cs_bookings, cs_studio._id, cs_start, cs_end);
  if (cs_conflict) throw cs_httpError(409, cs_conflictMessage(cs_conflict));

  const cs_now = new Date();
  const cs_subtotal = cs_hours * cs_studio.hourlyRate;
  const cs_doc = {
    studioId: cs_studio._id,
    studioTitle: cs_studio.title,
    studioImage: cs_studio.images?.[0] || "",
    studioLocation: cs_studio.location,
    hostName: cs_studio.ownerName,
    hostEmail: cs_studio.ownerEmail,
    userName: req.cs_user.name,
    userEmail: req.cs_user.email,
    date,
    startTime,
    endTime,
    start: cs_start,
    end: cs_end,
    hours: cs_hours,
    hourlyRate: cs_studio.hourlyRate,
    securityDeposit: cs_studio.securityDeposit,
    subtotal: cs_subtotal,
    totalPrice: cs_subtotal + cs_studio.securityDeposit,
    status: "Pending",
    createdAt: cs_now,
    updatedAt: cs_now,
  };
  const { insertedId } = await cs_bookings.insertOne(cs_doc);
  res.status(201).json({ ...cs_doc, _id: insertedId });
});

// booked slots for a date
router.get("/studios/:id/availability", async (req, res) => {
  const cs_date = String(req.query.date || "");
  if (!cs_isDate(cs_date)) throw cs_httpError(400, "Choose a valid date.");
  const { cs_bookings } = await cs_getCollections();
  const slots = await cs_bookings
    .find(
      { studioId: cs_toObjectId(req.params.id, "Studio"), date: cs_date, status: { $in: ["Pending", "Confirmed"] } },
      { projection: { _id: 0, startTime: 1, endTime: 1, status: 1 } }
    )
    .sort({ start: 1 })
    .toArray();
  res.json(slots);
});

// my bookings
router.get("/my-bookings", cs_verifyToken, async (req, res) => {
  const { cs_bookings } = await cs_getCollections();
  await cs_completePast(cs_bookings, { userEmail: req.cs_user.email });
  const bookings = await cs_bookings.find({ userEmail: req.cs_user.email }).sort({ start: -1 }).toArray();
  res.json(bookings);
});

// cancel my pending booking
router.patch("/bookings/:id/cancel", cs_verifyToken, async (req, res) => {
  const { cs_bookings } = await cs_getCollections();
  const cs_booking = await cs_bookings.findOne({ _id: cs_toObjectId(req.params.id, "Booking") });
  if (!cs_booking) throw cs_httpError(404, "Booking not found.");
  if (cs_booking.userEmail !== req.cs_user.email) throw cs_httpError(403, "You can only cancel your own bookings.");
  if (cs_booking.status !== "Pending") throw cs_httpError(400, "Only pending bookings can be cancelled.");

  const booking = await cs_bookings.findOneAndUpdate(
    { _id: cs_booking._id },
    { $set: { status: "Cancelled", updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  res.json(booking);
});

// requests for my studios
router.get("/incoming-bookings", cs_verifyToken, async (req, res) => {
  const { cs_bookings } = await cs_getCollections();
  await cs_completePast(cs_bookings, { hostEmail: req.cs_user.email });
  const bookings = await cs_bookings.find({ hostEmail: req.cs_user.email }).sort({ createdAt: -1 }).toArray();
  res.json(bookings);
});

// host confirms or declines
router.patch("/bookings/:id/status", cs_verifyToken, async (req, res) => {
  const cs_status = req.body?.status;
  if (!["Confirmed", "Cancelled"].includes(cs_status)) throw cs_httpError(400, "Status must be Confirmed or Cancelled.");

  const { cs_bookings } = await cs_getCollections();
  const cs_booking = await cs_bookings.findOne({ _id: cs_toObjectId(req.params.id, "Booking") });
  if (!cs_booking) throw cs_httpError(404, "Booking not found.");
  if (cs_booking.hostEmail !== req.cs_user.email) throw cs_httpError(403, "Only the host can respond to this request.");
  if (cs_booking.status !== "Pending") throw cs_httpError(400, "Only pending requests can be confirmed or declined.");

  if (cs_status === "Confirmed") {
    const cs_conflict = await cs_findConflict(cs_bookings, cs_booking.studioId, cs_booking.start, cs_booking.end, cs_booking._id);
    if (cs_conflict) throw cs_httpError(409, cs_conflictMessage(cs_conflict));
  }

  const booking = await cs_bookings.findOneAndUpdate(
    { _id: cs_booking._id },
    { $set: { status: cs_status, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  res.json(booking);
});

// dashboard summary
router.get("/dashboard", cs_verifyToken, async (req, res) => {
  const cs_email = req.cs_user.email;
  const { cs_studios, cs_bookings } = await cs_getCollections();
  await Promise.all([
    cs_completePast(cs_bookings, { userEmail: cs_email }),
    cs_completePast(cs_bookings, { hostEmail: cs_email }),
  ]);

  const [listings, cs_mine, cs_incoming] = await Promise.all([
    cs_studios.countDocuments({ ownerEmail: cs_email }),
    cs_bookings.find({ userEmail: cs_email }, { projection: { status: 1 } }).toArray(),
    cs_bookings.find({ hostEmail: cs_email }, { projection: { status: 1, subtotal: 1 } }).toArray(),
  ]);

  const cs_count = (list, status) => list.filter((item) => item.status === status).length;
  res.json({
    listings,
    bookings: { total: cs_mine.length, pending: cs_count(cs_mine, "Pending"), confirmed: cs_count(cs_mine, "Confirmed") },
    requests: { pending: cs_count(cs_incoming, "Pending"), confirmed: cs_count(cs_incoming, "Confirmed") },
    earnings: cs_incoming
      .filter((item) => item.status === "Confirmed" || item.status === "Completed")
      .reduce((sum, item) => sum + (item.subtotal || 0), 0),
  });
});

export default router;
