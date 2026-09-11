const SECRET_PATTERNS = [
  /postgresql:\/\/[^\s"'`]+/gi,
  /(?<![A-Z_])(AUTH_SECRET|MFA_ENCRYPTION_KEY|DATABASE_URL|TEST_DATABASE_URL)\s*[=:]\s*[^\s"'`]+/gi,
  /github_pat_[A-Za-z0-9_]+/g,
  /ghp_[A-Za-z0-9_]+/g,
  /gho_[A-Za-z0-9_]+/g,
  /ghu_[A-Za-z0-9_]+/g,
  /ghs_[A-Za-z0-9_]+/g,
  /ghr_[A-Za-z0-9_]+/g,
  /Bearer\s+[A-Za-z0-9._\-]+/gi,
];

export function redactSecrets(text) {
  let output = String(text);
  for (const pattern of SECRET_PATTERNS) {
    output = output.replace(pattern, "[redacted]");
  }
  return output;
}
