import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";

const BACKUP = new URL("./backup-postgres.sh", import.meta.url);
const VERIFY = new URL("./verify-backup.sh", import.meta.url);
const SCHEDULED = new URL("./run-scheduled-backup.sh", import.meta.url);
const RETAIN = new URL("./retain-postgres-backups.sh", import.meta.url);
const SERVICE = new URL("../ops/systemd/clevones-postgres-backup.service", import.meta.url);
const TIMER = new URL("../ops/systemd/clevones-postgres-backup.timer", import.meta.url);
const DOCS = new URL("../docs/BACKUPS.md", import.meta.url);

function read(url) {
  return readFileSync(url, "utf8");
}

function bashN(url) {
  return spawnSync("bash", ["-n", url.pathname], { encoding: "utf8" });
}

function utcStampDaysAgo(daysAgo, hms = "010203") {
  const date = new Date(Date.now() - daysAgo * 86400000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}T${hms}Z`;
}

function createStampDir(root, stamp, filename = "sample.dump") {
  const dir = join(root, stamp);
  mkdirSync(dir, { mode: 0o700, recursive: true });
  writeFileSync(join(dir, filename), "dump-fixture\n", { mode: 0o600 });
  writeFileSync(join(dir, "SHA256SUMS"), "deadbeef  sample.dump\n", { mode: 0o600 });
  return dir;
}

function commandExists(name) {
  return spawnSync("bash", ["-lc", `command -v ${name}`], { encoding: "utf8" }).status === 0;
}

function pgEnv(pg) {
  return {
    ...process.env,
    PGPASSWORD: pg.password,
    PGCONNECT_TIMEOUT: "5",
    PGAPPNAME: "clevones-t011-test",
  };
}

function pgIsReady(pg) {
  return spawnSync(
    "pg_isready",
    ["-h", pg.host, "-p", String(pg.port), "-U", pg.user],
    { encoding: "utf8", env: pgEnv(pg), timeout: 8000 },
  ).status === 0;
}

function envPg() {
  const host = process.env.CLEVONES_BACKUP_TEST_HOST || "127.0.0.1";
  if (!["127.0.0.1", "localhost", "::1"].includes(host)) {
    return null;
  }
  const port = process.env.CLEVONES_BACKUP_TEST_PORT || "5432";
  const user =
    process.env.CLEVONES_BACKUP_TEST_USER
    || process.env.PGUSER
    || (process.env.CI ? "ci_user" : "");
  const password =
    process.env.CLEVONES_BACKUP_TEST_PASSWORD
    || process.env.PGPASSWORD
    || (process.env.CI ? "ci_pass" : "");
  if (!user || !password) {
    return null;
  }
  return { host, port, user, password, started: false };
}

function wait(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function pgDumpMajor() {
  const version = spawnSync("pg_dump", ["--version"], { encoding: "utf8" });
  const match = /PostgreSQL\)\s+(\d+)/.exec(version.stdout || "");
  return match ? match[1] : null;
}

function dockerImageForDump() {
  const major = pgDumpMajor();
  const candidates = [];
  if (major) {
    candidates.push(`postgres:${major}-alpine`);
  }
  candidates.push("postgres:16-alpine");
  for (const image of candidates) {
    const have = spawnSync("docker", ["images", "-q", image], {
      encoding: "utf8",
      timeout: 8000,
    });
    if (have.status === 0 && have.stdout.trim()) {
      return image;
    }
  }
  return null;
}
function startDockerPg() {
  if (!commandExists("docker")) {
    return null;
  }
  const info = spawnSync("docker", ["info"], { encoding: "utf8", timeout: 8000 });
  if (info.status !== 0) {
    return null;
  }
  const image = dockerImageForDump();
  if (!image) {
    return null;
  }
  const pg = { host: "127.0.0.1", port: "55433", user: "t011", password: "t011", started: true };
  spawnSync("docker", ["rm", "-f", "clevones-t011-pg"], { encoding: "utf8", timeout: 10000 });
  const run = spawnSync(
    "docker",
    [
      "run",
      "-d",
      "--rm",
      "--name",
      "clevones-t011-pg",
      "--network",
      "host",
      "-e",
      "POSTGRES_USER=t011",
      "-e",
      "POSTGRES_PASSWORD=t011",
      "-e",
      "POSTGRES_DB=clevones_t011_seed",
      "-e",
      "PGPORT=55433",
      image,
    ],
    { encoding: "utf8", timeout: 20000 },
  );
  if (run.status !== 0) {
    return null;
  }
  const deadline = Date.now() + 90000;
  while (Date.now() < deadline) {
    if (pgIsReady(pg)) {
      return pg;
    }
    wait(1000);
  }
  spawnSync("docker", ["rm", "-f", "clevones-t011-pg"], { encoding: "utf8", timeout: 10000 });
  return null;
}

function resolveLivePg() {
  const fromEnv = envPg();
  if (fromEnv && commandExists("pg_isready") && pgIsReady(fromEnv)) {
    return fromEnv;
  }
  return startDockerPg();
}

test("backup and verify scripts are valid bash and refuse production restore", () => {
  for (const script of [BACKUP, VERIFY, SCHEDULED, RETAIN]) {
    const syntax = bashN(script);
    assert.equal(syntax.status, 0, syntax.stderr);
  }

  const backup = read(BACKUP);
  const verify = read(VERIFY);
  const scheduled = read(SCHEDULED);
  const retain = read(RETAIN);

  assert.match(backup, /--format=custom/);
  assert.match(backup, /\.partial/);
  assert.match(backup, /sudo -n -u postgres/);
  assert.match(backup, /sha256sum/);
  assert.match(backup, /pg_restore --list/);
  assert.match(backup, /DISK_USED_PCT/);
  assert.match(backup, /refusing non-loopback PostgreSQL host/);
  assert.doesNotMatch(backup, /migrate deploy/);
  assert.doesNotMatch(backup, /pm2 restart|systemctl restart|nginx -s reload/);
  assert.doesNotMatch(backup, /^\s*source /m);
  assert.doesNotMatch(backup, /cat ["']?\.env/);
  assert.doesNotMatch(backup, /printenv/);
  assert.doesNotMatch(backup, /dropdb\s+clevones_prod/);
  assert.doesNotMatch(backup, /rm -rf|rm -r /);
  assert.doesNotMatch(backup, /^\s*DATABASE_URL=/m);
  assert.doesNotMatch(backup, /\$DATABASE_URL/);

  assert.match(verify, /sha256sum -c/);
  assert.match(verify, /pg_restore --list/);
  assert.match(verify, /is_forbidden_db/);
  assert.match(verify, /t011/);
  assert.match(verify, /pg_restore --no-owner --no-privileges --dbname=/);
  assert.doesNotMatch(verify, /dropdb clevones_prod/);
  assert.doesNotMatch(verify, /^\s*source /m);
  assert.doesNotMatch(verify, /cat ["']?\.env/);
  assert.doesNotMatch(verify, /printenv/);
  assert.doesNotMatch(verify, /rm -rf/);
  assert.doesNotMatch(verify, /^\s*DATABASE_URL=/m);
  assert.doesNotMatch(verify, /\$DATABASE_URL/);

  assert.match(scheduled, /backup-postgres\.sh/);
  assert.match(scheduled, /verify-backup\.sh/);
  assert.match(scheduled, /clevones_t011_restore_/);
  assert.doesNotMatch(scheduled, /systemctl enable|systemctl start/);
  assert.doesNotMatch(scheduled, /^\s*DATABASE_URL=/m);
  assert.doesNotMatch(scheduled, /\$DATABASE_URL/);
  assert.doesNotMatch(scheduled, /^\s*source /m);

  assert.match(retain, /20260907T020712Z/);
  assert.match(retain, /20260907T134843Z/);
  assert.match(retain, /--dry-run/);
  assert.match(retain, /allow-production-root/);
  assert.match(retain, /refusing --apply on the production backup root/);
});

test("backup script refuses non-loopback hosts and connection-string dbnames", () => {
  const root = mkdtempSync(join(tmpdir(), "t011-refuse-"));
  try {
    const remote = spawnSync(
      "bash",
      [BACKUP.pathname, "--backup-root", root, "--dbname", "demo", "--no-sudo", "--host", "8.8.8.8"],
      { encoding: "utf8" },
    );
    assert.equal(remote.status, 2);
    assert.match(remote.stderr, /non-loopback/);

    const uri = spawnSync(
      "bash",
      [BACKUP.pathname, "--backup-root", root, "--dbname", "postgresql://example"],
      { encoding: "utf8" },
    );
    assert.equal(uri.status, 2);
    assert.match(uri.stderr, /connection-string/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("systemd templates are oneshot timers and do not load secrets or enable themselves", () => {
  const service = read(SERVICE);
  const timer = read(TIMER);
  const docs = read(DOCS);

  assert.match(service, /Type=oneshot/);
  assert.match(service, /run-scheduled-backup\.sh/);
  assert.match(service, /not enabled/i);
  assert.doesNotMatch(service, /^EnvironmentFile=/m);
  assert.doesNotMatch(service, /^Environment=/m);
  assert.doesNotMatch(service, /systemctl enable/);

  assert.match(timer, /OnCalendar=/);
  assert.match(timer, /WantedBy=timers\.target/);
  assert.match(timer, /not enabled/i);
  assert.doesNotMatch(timer, /^Environment=/m);
  assert.doesNotMatch(timer, /^EnvironmentFile=/m);

  assert.match(docs, /TIMER_ENABLED_PRODUCTION = NO/);
  assert.match(docs, /20260907T020712Z/);
  assert.match(docs, /20260907T134843Z/);
});

test("retention dry-run keeps T004/T005 and apply only deletes expired test stamps", () => {
  const root = mkdtempSync(join(tmpdir(), "t011-retain-"));
  try {
    const protectedA = "20260907T020712Z";
    const protectedB = "20260907T134843Z";
    const recent = utcStampDaysAgo(0);
    const expired = utcStampDaysAgo(400, "000000");
    createStampDir(root, protectedA);
    createStampDir(root, protectedB);
    createStampDir(root, recent);
    createStampDir(root, expired);

    const dry = spawnSync("bash", [RETAIN.pathname, "--backup-root", root, "--dry-run"], {
      encoding: "utf8",
    });
    assert.equal(dry.status, 0, dry.stderr);
    assert.match(dry.stdout, /RETENTION_OK/);
    assert.match(dry.stdout, /MODE=dry-run/);
    assert.match(dry.stdout, new RegExp(`RETENTION_KEEP stamp=${protectedA}`));
    assert.match(dry.stdout, new RegExp(`RETENTION_KEEP stamp=${protectedB}`));
    assert.match(dry.stdout, new RegExp(`RETENTION_KEEP stamp=${recent}`));
    assert.match(dry.stdout, new RegExp(`RETENTION_EXPIRE stamp=${expired}`));
    assert.equal(existsSync(join(root, expired)), true, "dry-run must not delete");

    const apply = spawnSync("bash", [RETAIN.pathname, "--backup-root", root, "--apply"], {
      encoding: "utf8",
    });
    assert.equal(apply.status, 0, apply.stderr);
    assert.match(apply.stdout, /RETENTION_DELETED/);
    assert.equal(existsSync(join(root, expired)), false);
    assert.equal(existsSync(join(root, protectedA)), true);
    assert.equal(existsSync(join(root, protectedB)), true);
    assert.equal(existsSync(join(root, recent)), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("retention --apply refuses the production backup root", () => {
  const prod = "/home/clevones/backups/clevones.com";
  const before = existsSync(prod) ? readdirSync(prod).sort() : null;
  const run = spawnSync("bash", [RETAIN.pathname, "--backup-root", prod, "--apply"], {
    encoding: "utf8",
  });
  assert.equal(run.status, 2);
  if (before) {
    assert.match(run.stderr, /production backup root/);
    assert.deepEqual(readdirSync(prod).sort(), before);
  }
});

test("off-production dump, checksum, list and temporary restore", async (t) => {
  const tools = ["pg_dump", "pg_restore", "createdb", "dropdb", "psql", "pg_isready", "sha256sum"];
  if (!tools.every(commandExists)) {
    t.skip("PostgreSQL client tools are not installed on this host");
    return;
  }

  const pg = resolveLivePg();
  if (!pg) {
    t.skip("no loopback PostgreSQL reachable for T011 (CI service or local docker)");
    return;
  }

  const token = `t011${Date.now().toString(36)}${process.pid}`;
  const srcDb = `clevones_t011_test_${token}`;
  const root = mkdtempSync(join(tmpdir(), "t011-dump-"));
  const env = pgEnv(pg);

  const createdb = spawnSync(
    "createdb",
    ["-h", pg.host, "-p", String(pg.port), "-U", pg.user, "--encoding=UTF8", srcDb],
    { encoding: "utf8", env },
  );
  if (createdb.status !== 0) {
    if (pg.started) {
      spawnSync("docker", ["rm", "-f", "clevones-t011-pg"], { encoding: "utf8", timeout: 10000 });
    }
    t.skip("could not create a temporary test database");
    return;
  }

  try {
    const seed = spawnSync(
      "psql",
      [
        "-h", pg.host, "-p", String(pg.port), "-U", pg.user, "-d", srcDb,
        "-v", "ON_ERROR_STOP=1",
        "-c", "CREATE TABLE t011_probe(id int PRIMARY KEY); INSERT INTO t011_probe VALUES (1);",
      ],
      { encoding: "utf8", env },
    );
    assert.equal(seed.status, 0, seed.stderr);

    const scheduled = spawnSync(
      "bash",
      [
        SCHEDULED.pathname,
        "--backup-root", root,
        "--dbname", srcDb,
        "--no-sudo",
        "--host", pg.host,
        "--port", String(pg.port),
        "--username", pg.user,
        "--restore-test",
      ],
      { encoding: "utf8", env },
    );
    assert.equal(scheduled.status, 0, `${scheduled.stderr}\n${scheduled.stdout}`);
    assert.match(scheduled.stdout, /BACKUP_OK/);
    assert.match(scheduled.stdout, /VERIFY_LIST_OK/);
    assert.match(scheduled.stdout, /RESTORE_TEST_OK/);
    assert.match(scheduled.stdout, /TEMP_DB_DROPPED=/);
    assert.match(scheduled.stdout, /SCHEDULED_BACKUP_OK/);
    assert.doesNotMatch(scheduled.stdout, /DATABASE_URL/);
    assert.doesNotMatch(scheduled.stdout, /postgresql:\/\//);
    assert.doesNotMatch(scheduled.stderr || "", /DATABASE_URL/);

    const dumpLine = scheduled.stdout.split("\n").find((line) => line.startsWith("DUMP="));
    assert.ok(dumpLine);
    const dump = dumpLine.slice("DUMP=".length);
    const verifySums = spawnSync("sha256sum", ["-c", join(dirname(dump), "SHA256SUMS")], {
      encoding: "utf8",
    });
    assert.equal(verifySums.status, 0, verifySums.stderr);
    assert.match(verifySums.stdout, /OK/);

    const listed = spawnSync("pg_restore", ["--list", dump], { encoding: "utf8" });
    assert.equal(listed.status, 0, listed.stderr);
    assert.match(listed.stdout, /t011_probe/);

    const droppedLine = scheduled.stdout.split("\n").find((line) => line.startsWith("TEMP_DB_DROPPED="));
    assert.ok(droppedLine);
    const dropped = droppedLine.slice("TEMP_DB_DROPPED=".length);
    const leftover = spawnSync(
      "psql",
      [
        "-h", pg.host, "-p", String(pg.port), "-U", pg.user, "-d", "postgres", "-Atqc",
        `SELECT datname FROM pg_database WHERE datname='${dropped}';`,
      ],
      { encoding: "utf8", env },
    );
    assert.equal((leftover.stdout || "").trim(), "");
  } finally {
    spawnSync("dropdb", ["-h", pg.host, "-p", String(pg.port), "-U", pg.user, "--if-exists", srcDb], {
      encoding: "utf8",
      env,
    });
    rmSync(root, { recursive: true, force: true });
    if (pg.started) {
      spawnSync("docker", ["rm", "-f", "clevones-t011-pg"], { encoding: "utf8", timeout: 10000 });
    }
  }
});
