import { createApp } from './app';
import { connectDb, disconnectDb } from './config/db';
import { closeSessionStores } from './config/session';
import { env } from './config/env';
import { logger } from './utils/logger';

async function main() {
  await connectDb(env.MONGODB_URI);
  const app = createApp({ mongoUri: env.MONGODB_URI });
  const server = app.listen(env.PORT, () => {
    logger.info(`API listening on http://localhost:${env.PORT}`);
  });

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Shutting down');
    server.close(() => {
      Promise.all([closeSessionStores(), disconnectDb()])
        .catch((err) => logger.error({ err }, 'Error while disconnecting MongoDB'))
        .finally(() => process.exit(0));
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start the API');
  process.exit(1);
});
