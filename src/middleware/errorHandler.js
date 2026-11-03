// 404 handler
export const cs_notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// error handler
export const cs_errorHandler = (err, req, res, next) => {
  const cs_status = err.status || 500;
  if (cs_status >= 500) console.error(err);
  res.status(cs_status).json({
    message: cs_status >= 500 ? "Something went wrong on the server." : err.message,
  });
};
