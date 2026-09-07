import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const BACKUP = new URL("./backup-postgres.sh", import.meta.url);
const VERIFY = new URL("./verify-backup.sh", import.meta.url);

function read(url) {
  return readFileSync(url, "utf8");
}

test("backup and verify scripts are valid bash and refuse production restore", () => {
  for (const script of [BACKUP, VERIFY]) {
    const syntax = spawnSync("bash", ["-n", script.pathname], { encoding: "utf8" });
    assert.equal(syntax.status, 0, syntax.stderr);
  }

  const backup = read(BACKUP);
  const verify = read(VERIFY);

  assert.match(backup, /--format=custom/);
  assert.match(backup, /\.partial/);
  assert.match(backup, /sudo -n -u postgres pg_dump/);
  assert.match(backup, /sha256sum/);
  assert.match(backup, /pg_restore --list/);
  assert.doesNotMatch(backup, /migrate deploy/);
  assert.doesNotMatch(backup, /pm2 restart|systemctl restart|nginx -s reload/);
  assert.doesNotMatch(backup, /^\s*source /m);
  assert.doesNotMatch(backup, /cat ["']?\.env/);
  assert.doesNotMatch(backup, /printenv/);
  assert.doesNotMatch(backup, /dropdb\s+clevones_prod/);
  assert.doesNotMatch(backup, /rm -rf|rm -r /);

  assert.match(verify, /sha256sum -c/);
  assert.match(verify, /pg_restore --list/);
  assert.match(verify, /is_forbidden_db/);
  assert.match(verify, /pg_restore --no-owner --no-privileges --dbname=/);
  assert.doesNotMatch(verify, /dropdb clevones_prod/);
  assert.doesNotMatch(verify, /^\s*source /m);
  assert.doesNotMatch(verify, /cat ["']?\.env/);
  assert.doesNotMatch(verify, /printenv/);
  assert.doesNotMatch(verify, /rm -rf/);
});
