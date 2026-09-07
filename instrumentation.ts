export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertMfaEncryptionKeyForProduction } = await import(
      "./lib/auth/mfa-config"
    );
    assertMfaEncryptionKeyForProduction();
  }
}
