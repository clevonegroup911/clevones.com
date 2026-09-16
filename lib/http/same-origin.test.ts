import assert from "node:assert/strict";
import test from "node:test";

import {
  assertSameOriginMutation,
  parseLocalAllowedOrigins,
} from "@/lib/http/same-origin";

test("same-origin matches APP_ORIGIN", () => {
  const request = new Request("http://localhost:3000/api", {
    method: "POST",
    headers: { origin: "http://localhost:3000" },
  });
  const result = assertSameOriginMutation(request, {
    APP_ORIGIN: "http://localhost:3000",
    NODE_ENV: "production",
  } as NodeJS.ProcessEnv);
  assert.equal(result.ok, true);
});

test("parseLocalAllowedOrigins rejects non-loopback", () => {
  const list = parseLocalAllowedOrigins({
    NODE_ENV: "development",
    X200_LOCAL_ALLOWED_ORIGINS: "http://192.168.1.1:3000,http://127.0.0.1:3001",
  } as NodeJS.ProcessEnv);
  assert.deepEqual(list, ["http://127.0.0.1:3001"]);
});
