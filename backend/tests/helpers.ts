import mongoose from 'mongoose';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app';
import { connectDb } from '../src/config/db';
import { env } from '../src/config/env';
import { closeSessionStores } from '../src/config/session';
import { CSRF_HEADER_NAME } from '../src/shared/constants';

const testUri = env.MONGODB_URI_TEST ?? env.MONGODB_URI.replace(/\/([^/?]+)(\?|$)/, '/$1_test$2');

export async function setupTestApp(): Promise<Express> {
  if (!/test/i.test(testUri)) throw new Error(`Refusing to run tests against a non-test database: ${testUri}`);
  await connectDb(testUri);
  await mongoose.connection.dropDatabase();
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
  return createApp({ mongoUri: testUri });
}

export async function teardownTestApp(): Promise<void> {
  await closeSessionStores();
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
}

/** A cookie-keeping client that has fetched a CSRF token. */
export async function csrfAgent(app: Express) {
  const agent = request.agent(app);
  const res = await agent.get('/api/auth/csrf').expect(200);
  const token = res.body.data.csrfToken as string;
  return {
    agent,
    token,
    post: (url: string, body?: object) => agent.post(url).set(CSRF_HEADER_NAME, token).send(body ?? {}),
  };
}
