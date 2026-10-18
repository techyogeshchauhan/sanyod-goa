/**
 * Creates every collection and syncs its indexes with the Mongoose schemas (docs/09 Part B).
 * Safe to re-run: existing collections and data are kept.
 * Usage: npm run db:init
 */
import mongoose from 'mongoose';
import { connectDb, disconnectDb } from '../config/db';
import { env } from '../config/env';
import '../models';

export async function initDb(): Promise<string[]> {
  const existing = new Set((await mongoose.connection.db!.listCollections().toArray()).map((c) => c.name));
  const created: string[] = [];
  for (const m of Object.values(mongoose.models)) {
    if (!existing.has(m.collection.collectionName)) {
      await m.createCollection();
      created.push(m.collection.collectionName);
    }
    await m.syncIndexes();
  }
  return created;
}

async function main() {
  await connectDb(env.MONGODB_URI);
  const created = await initDb();
  // eslint-disable-next-line no-console
  console.log(`Collections ready (${Object.keys(mongoose.models).length}). Created: ${created.join(', ') || 'none'}.`);
}

if (require.main === module) {
  main()
    .catch((err: Error) => {
      // eslint-disable-next-line no-console
      console.error(err);
      process.exitCode = 1;
    })
    .finally(() => disconnectDb());
}
