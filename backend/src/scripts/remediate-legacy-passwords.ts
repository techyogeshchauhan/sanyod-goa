import { connectDb, disconnectDb } from '../config/db';
import { env } from '../config/env';
import { User } from '../models/User';
import { hashPassword } from '../utils/passwords';

async function remediateLegacyPasswords() {
  await connectDb(env.MONGODB_URI);
  try {
    let plaintextPasswordsRehashed = 0;
    let emptyLegacyCredentialsCleared = 0;
    const plaintextUsers = User.find({ legacyAlgo: 'plain', passwordHash: { $exists: false } })
      .select('+legacyPasswordHash')
      .cursor();

    for await (const user of plaintextUsers) {
      const legacyPassword = user.legacyPasswordHash;
      const update = legacyPassword
        ? {
            $set: { passwordHash: await hashPassword(legacyPassword) },
            $unset: { legacyPasswordHash: '', legacyAlgo: '' },
          }
        : { $unset: { legacyPasswordHash: '', legacyAlgo: '' } };
      const result = await User.updateOne(
        { _id: user._id, legacyAlgo: 'plain', passwordHash: { $exists: false } },
        update,
      );
      if (result.modifiedCount) {
        if (legacyPassword) plaintextPasswordsRehashed++;
        else emptyLegacyCredentialsCleared++;
      }
    }

    // These hashes cannot be upgraded without the user's password. Removing them forces
    // the normal password-reset flow, which replaces the credential with bcrypt.
    const weakHashes = await User.updateMany(
      { legacyAlgo: { $in: ['md5', 'sha1'] }, passwordHash: { $exists: false } },
      { $unset: { legacyPasswordHash: '', legacyAlgo: '' } },
    );
    const staleMetadata = await User.updateMany(
      {
        $or: [
          { legacyAlgo: { $exists: true } },
          { legacyPasswordHash: { $exists: true } },
        ],
      },
      { $unset: { legacyPasswordHash: '', legacyAlgo: '' } },
    );
    // Invalidate reset links issued before reset tokens were removed from request URLs.
    const resetTokens = await User.updateMany(
      { passwordResetTokenHash: { $exists: true } },
      { $unset: { passwordResetTokenHash: '', passwordResetExpires: '' } },
    );

    console.info(
      `Credential remediation complete: ${plaintextPasswordsRehashed} plaintext credentials rehashed, ` +
        `${weakHashes.modifiedCount} weak-hash accounts require password reset, ` +
        `${emptyLegacyCredentialsCleared} empty legacy credentials cleared, ` +
        `${staleMetadata.modifiedCount} stale metadata records removed, ` +
        `${resetTokens.modifiedCount} outstanding password reset links invalidated.`,
    );
  } finally {
    await disconnectDb();
  }
}

remediateLegacyPasswords().catch((err) => {
  console.error('Legacy credential remediation failed.', err);
  process.exitCode = 1;
});
