import argon2 from "argon2";

const ARGON2_OPTIONS = {
  type: argon2.argon2id as 0 | 1 | 2 | undefined,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
  hashLength: 32,
} satisfies Parameters<typeof argon2.hash>[1];

/**
 * Valid Argon2id hash used only to equalize verify timing when no user exists.
 * It is not associated with any account.
 */
const TIMING_DUMMY_HASH =
  "$argon2id$v=19$m=19456,p=1,t=2$RmjUiM5/vVDSGpTvO3ifWw$fxZtIufzvIB7m5LZGtGFLoUdiEyqs0jUyrj/aX6fJC8";

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(
  passwordHash: string,
  password: string,
): Promise<boolean> {
  try {
    return await argon2.verify(passwordHash, password);
  } catch {
    return false;
  }
}

export async function verifyPasswordAgainstDummy(password: string): Promise<void> {
  await verifyPassword(TIMING_DUMMY_HASH, password);
}
