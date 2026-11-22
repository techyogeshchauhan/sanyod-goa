import type { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found' } });
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of err.issues) {
      const key = issue.path.join('.') || '_';
      if (!fields[key]) fields[key] = issue.message;
    }
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Please check the highlighted fields', fields },
    });
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, ...(err.fields ? { fields: err.fields } : {}) },
    });
  }

  // A unique index refused the write (e.g. a UPI transaction ID already used by an active record).
  if ((err as { code?: number })?.code === 11000) {
    return res.status(409).json({
      error: { code: 'CONFLICT', message: 'This conflicts with an existing record (for example a transaction ID already in use).' },
    });
  }

  // Schema validation / casting that the request schemas did not catch.
  if (err instanceof mongoose.Error.ValidationError) {
    const fields = Object.fromEntries(Object.entries(err.errors).map(([k, e]) => [k, e.message]));
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Please check the highlighted fields', fields } });
  }
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid value', fields: { [err.path]: 'Invalid value' } } });
  }

  // body-parser errors (malformed JSON, payload too large)
  const status = typeof err?.status === 'number' ? err.status : 500;
  if (status >= 400 && status < 500) {
    return res.status(status).json({ error: { code: 'BAD_REQUEST', message: 'Invalid request' } });
  }

  logger.error({ err, requestId: req.id, path: req.path }, 'Unhandled error');
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again later.' } });
};
