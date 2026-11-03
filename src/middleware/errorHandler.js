// 404 for unknown API routes
export const cs_notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// Central error handler — Express 5 forwards async errors here automatically
// eslint-disable-next-line no-unused-vars
export const cs_errorHandler = (err, req, res, next) => {
  const cs_status = err.status || 500;
  if (cs_status >= 500) console.error(err);
  res.status(cs_status).json({
    message: cs_status >= 500 ? "Something went wrong on the server." : err.message,
  });
};
