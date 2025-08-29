const { ZodError } = require('zod');

function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'ValidationError', details: err.flatten() });
  }
  if (err && err.status && err.message) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error('[UnhandledError]', err);
  return res.status(500).json({ error: 'InternalServerError' });
}

module.exports = { errorHandler };
