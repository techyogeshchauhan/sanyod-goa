import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

process.env.NODE_ENV = 'test';
// Uploaded files go to a throwaway folder, never the real storage.
process.env.STORAGE_DIR = mkdtempSync(path.join(tmpdir(), 'sanyod-test-storage-'));
process.env.LEGACY_SITE_DIR = '';
// Never send real email from tests, whatever .env says: mail goes to the in-memory outbox.
process.env.SMTP_HOST = '';
