import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const APP = new URL("./health-check-app.sh", import.meta.url);
const POSTGRES = new URL("./health-check-postgres.sh", import.meta.url);
const SYSTEM = new URL("./health-check-system.sh", import.meta.url);

function read(url) {
  return readFileSync(url, "utf8");
}

function bashN(url) {
  return spawnSync("bash", ["-n", url.pathname], { encoding: "utf8" });
}

function run(url, args) {
  return spawnSync("bash", [url.pathname, ...args], { encoding: "utf8" });
}

test("health-check scripts are valid bash, dry-run locally, and refuse production side effects", () => {
  for (const script of [APP, POSTGRES, SYSTEM]) {
    const syntax = bashN(script);
    assert.equal(syntax.status, 0, syntax.stderr);
  }

  const app = read(APP);
  const postgres = read(POSTGRES);
  const system = read(SYSTEM);

  for (const source of [app, postgres, system]) {
    assert.match(source, /--dry-run/);
    assert.doesNotMatch(source, /pm2 restart|systemctl restart|nginx -s reload/);
    assert.doesNotMatch(source, /^\s*source /m);
    assert.doesNotMatch(source, /cat ["']?\.env/);
    assert.doesNotMatch(source, /printenv/);
    assert.doesNotMatch(source, /gcloud (monitoring|alpha|beta)/);
    assert.doesNotMatch(source, /migrate deploy/);
  }

  assert.match(app, /refusing non-loopback URL/);
  assert.match(postgres, /refusing non-loopback PostgreSQL host/);
  assert.match(postgres, /pg_isready/);
  assert.doesNotMatch(postgres, /PGPASSWORD|DATABASE_URL/);
  assert.match(system, /df -P/);
  assert.doesNotMatch(system, /pm2 jlist|pm2 pretty|dump\.env/);

  const appDry = run(APP, ["--dry-run"]);
  assert.equal(appDry.status, 0, appDry.stderr);
  assert.match(appDry.stdout, /DRY_RUN_OK/);
  assert.match(appDry.stdout, /127\.0\.0\.1/);
  assert.match(appDry.stdout, /\/health/);

  const appRefused = run(APP, ["--dry-run", "--url", "https://clevones.com/"]);
  assert.equal(appRefused.status, 2);
  assert.match(appRefused.stderr, /non-loopback/);

  const pgDry = run(POSTGRES, ["--dry-run"]);
  assert.equal(pgDry.status, 0, pgDry.stderr);
  assert.match(pgDry.stdout, /DRY_RUN_OK/);

  const pgRefused = run(POSTGRES, ["--dry-run", "--host", "10.1.2.3"]);
  assert.equal(pgRefused.status, 2);
  assert.match(pgRefused.stderr, /non-loopback/);

  const systemDry = run(SYSTEM, ["--dry-run"]);
  assert.equal(systemDry.status, 0, systemDry.stderr);
  assert.match(systemDry.stdout, /DRY_RUN_OK/);

  const systemLive = run(SYSTEM, []);
  assert.ok(systemLive.status === 0 || systemLive.status === 1, systemLive.stderr);
  assert.match(systemLive.stdout, /DISK_USED_PCT=/);
  assert.match(systemLive.stdout, /MEM_TOTAL_KB=/);
  assert.doesNotMatch(systemLive.stdout, /AUTH_SECRET|MFA_ENCRYPTION_KEY|postgresql:\/\//);
});
