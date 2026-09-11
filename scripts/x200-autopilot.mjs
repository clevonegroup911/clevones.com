#!/usr/bin/env node
import { createHash } from "node:crypto";
import { closeSync, existsSync, openSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { hostname } from "node:os";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const LOCK = resolve(ROOT, ".x200/autopilot.lock");
const GATE = resolve(ROOT, ".x200/HUMAN_GATE.json");
const BACKLOG = resolve(ROOT, "backlog.json");
const DEFAULT_SLEEP_MS = Number(process.env.X200_AUTOPILOT_POLL_MS || 60000);
const DEFAULT_AGENT_TIMEOUT_MS = Number(process.env.X200_AGENT_TIMEOUT_MS || 3300000);
const MAX_STALLS = 3;

function parseArgs(argv) {
  const flags = new Set(argv.filter((arg) => arg.startsWith("--") && !arg.includes("=")));
  const value = (name, fallback = null) => {
    const prefix = `${name}=`;
    const inline = argv.find((arg) => arg.startsWith(prefix));
    if (inline) return inline.slice(prefix.length);
    const index = argv.indexOf(name);
    if (index >= 0 && argv[index + 1] && !argv[index + 1].startsWith("--")) return argv[index + 1];
    return fallback;
  };
  return {
    daemon: flags.has("--daemon"),
    once: flags.has("--once"),
    dryRun: flags.has("--dry-run"),
    model: value("--model", process.env.X200_CURSOR_MODEL || null),
    maxCycles: Number(value("--max-cycles", process.env.X200_AUTOPILOT_MAX_CYCLES || 200)),
    sleepMs: Number(value("--poll-ms", DEFAULT_SLEEP_MS)),
    agentTimeoutMs: Number(value("--agent-timeout-ms", DEFAULT_AGENT_TIMEOUT_MS)),
  };
}

function run(command, args = [], options = {}) {
  return spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    env: process.env,
    stdio: options.inherit ? "inherit" : "pipe",
    timeout: options.timeout,
  });
}

function commandExists(command) {
  const result = run("bash", ["-lc", `command -v ${command}`]);
  return result.status === 0;
}

function detectAgent() {
  if (process.env.X200_AGENT_BIN) return process.env.X200_AGENT_BIN;
  if (commandExists("cursor-agent")) return "cursor-agent";
  if (commandExists("agent")) return "agent";
  return null;
}

function readBacklog() {
  return JSON.parse(readFileSync(BACKLOG, "utf8"));
}

function statusSnapshot() {
  const head = run("git", ["rev-parse", "HEAD"]);
  const branch = run("git", ["branch", "--show-current"]);
  const backlog = existsSync(BACKLOG) ? readFileSync(BACKLOG) : Buffer.from("");
  const hash = createHash("sha256").update(backlog).digest("hex");
  return {
    head: head.status === 0 ? head.stdout.trim() : "unknown",
    branch: branch.status === 0 ? branch.stdout.trim() : "unknown",
    backlogHash: hash,
  };
}

function gitDirty() {
  const result = run("git", ["status", "--porcelain"]);
  return result.status !== 0 || Boolean(result.stdout.trim());
}

function validate() {
  const result = run("npm", ["run", "--silent", "x200:validate"]);
  if (result.status !== 0) {
    process.stderr.write(result.stdout || "");
    process.stderr.write(result.stderr || "");
    return false;
  }
  return true;
}

function writeGate(reason, tasks = []) {
  const payload = {
    version: 1,
    generatedAt: new Date().toISOString(),
    host: hostname(),
    reason,
    tasks: tasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      requiresHuman: task.requiresHuman,
      nextAction: task.nextAction || null,
    })),
  };
  writeFileSync(GATE, `${JSON.stringify(payload, null, 2)}\n`);
  process.stdout.write(`HUMAN_GATE ${reason}: ${tasks.map((task) => task.id).join(", ") || "none"}\n`);
}

function clearGate() {
  if (existsSync(GATE)) rmSync(GATE, { force: true });
}

function taskSummary(task) {
  return JSON.stringify({
    id: task.id,
    title: task.title,
    objective: task.objective,
    priority: task.priority,
    status: task.status,
    scope: task.scope,
    acceptanceCriteria: task.acceptanceCriteria,
    tests: task.tests,
    risk: task.risk,
    requiresHuman: task.requiresHuman,
    nextAction: task.nextAction,
  }, null, 2);
}

function promptFor(backlog) {
  const active = backlog.tasks.filter((task) => task.status === "EN_COURS");
  if (active.length) {
    return `MODE X200 FAST-LANE — FEDORA LOCAL AUTOPILOT.\n\nUn agent précédent s'est arrêté ou cette session reprend du travail actif. Lis AGENTS.md, .cursor/rules/clevones.mdc, backlog.json et TASK_REPORT.md. Inspecte HEAD, git status, claims et preuves. Reprends sans rejouer un effet externe incertain. Continue les tâches EN_COURS suivantes jusqu'à quality-gate, rapport, commit/push autorisé et état correct. Si un bail doit être renouvelé, fais-le avec x200:claim. Si un effet externe est incertain, bloque seulement cette tâche et poursuis une tâche indépendante admissible. Ne touche jamais .env, secrets, production, migration réelle, merge main ou paiement réel sans gate propriétaire explicite.\n\nTâches actives:\n${active.map(taskSummary).join("\n\n")}`;
  }

  const inControl = backlog.tasks.filter((task) => task.status === "EN_CONTRÔLE");
  if (inControl.length) {
    return `MODE X200 FAST-LANE — FEDORA LOCAL AUTOPILOT.\n\nRéconcilie les tâches EN_CONTRÔLE ci-dessous. Utilise GitHub/gh et les SHA réels, pas des captures. Vérifie le job quality correspondant à la lane exigée. Si SUCCESS sur le bon SHA et critères satisfaits, finalise la tâche, mets à jour les preuves/rapports de façon compacte, commit/push sur la branche de travail autorisée, puis enchaîne immédiatement la prochaine tâche PRÊTE non sensible dans la même session. Un commentaire [X100-CI] n'est pas bloquant. Ne merge pas main et ne déploie pas.\n\nTâches en contrôle:\n${inControl.map(taskSummary).join("\n\n")}`;
  }

  const ready = backlog.tasks.filter((task) => task.status === "PRÊTE" && !task.requiresHuman);
  if (ready.length) {
    const selected = [...ready].sort((a, b) => String(a.id).localeCompare(String(b.id)))[0];
    return `MODE X200 FAST-LANE — FEDORA LOCAL AUTOPILOT.\n\nExécute TOUTE la tâche ci-dessous de bout en bout sans demander de confirmation de routine. Commence par lire AGENTS.md, PROJECT_CONTEXT.md, backlog.json, TASK_REPORT.md et .cursor/rules/clevones.mdc, puis valide x200. Réserve la tâche avec x200:claim, travaille uniquement dans son scope, satisfais les critères, lance les contrôles adaptés, mets à jour TASK_REPORT.md + reports/tasks/<ID>.md + backlog.json de façon compacte, commit et push sur la branche de travail autorisée. Si CI est nécessaire, utilise gh/GitHub pour vérifier le job quality réel et finalise quand la preuve correspond au bon SHA. Continue ensuite automatiquement vers une autre tâche PRÊTE admissible tant que la session le permet. Zéro doublon. Après 3 échecs identiques, change de stratégie ou bloque la tâche avec diagnostic. Ne modifie jamais .env/secrets. Aucun merge main, déploiement, migration production, auth/MFA production, suppression de données ou paiement réel sans gate propriétaire explicite.\n\nTâche cible:\n${taskSummary(selected)}`;
  }

  return null;
}

function launchAgent(agentBin, prompt, options) {
  const args = ["-p", "--force", "--output-format", "text"];
  if (options.model) args.push("--model", options.model);
  args.push(prompt);
  process.stdout.write(`AUTOPILOT_AGENT_START bin=${agentBin}\n`);
  const result = run(agentBin, args, { inherit: true, timeout: options.agentTimeoutMs });
  if (result.error?.code === "ETIMEDOUT") {
    process.stderr.write("AUTOPILOT_AGENT_TIMEOUT — un nouvel agent reprendra au cycle suivant.\n");
    return 124;
  }
  return result.status ?? 1;
}

function acquireLock() {
  try {
    const fd = openSync(LOCK, "wx", 0o600);
    writeFileSync(fd, `${JSON.stringify({ pid: process.pid, host: hostname(), startedAt: new Date().toISOString() })}\n`);
    return fd;
  } catch (error) {
    if (error && error.code === "EEXIST") {
      process.stderr.write(`AUTOPILOT_LOCKED ${LOCK}\n`);
      process.exit(2);
    }
    throw error;
  }
}

function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const agentBin = detectAgent();
  if (!agentBin && !options.dryRun) {
    process.stderr.write("Cursor CLI introuvable. Installer Cursor CLI puis lancer `cursor-agent login` (ou `agent login`).\n");
    return 2;
  }

  const lockFd = acquireLock();
  let stalls = 0;
  let cycles = 0;
  try {
    while (cycles < options.maxCycles) {
      cycles += 1;
      if (!existsSync(BACKLOG)) {
        process.stderr.write("backlog.json introuvable.\n");
        return 2;
      }
      if (gitDirty()) {
        writeGate("WORKTREE_DIRTY_BEFORE_AUTOPILOT", []);
        return 3;
      }
      if (!validate()) {
        writeGate("X200_VALIDATE_FAILED", []);
        return 4;
      }

      const backlog = readBacklog();
      const humanReady = backlog.tasks.filter((task) => task.status === "PRÊTE" && task.requiresHuman);
      const prompt = promptFor(backlog);

      if (!prompt) {
        if (humanReady.length) {
          writeGate("OWNER_AUTHORIZATION_REQUIRED", humanReady);
          if (!options.daemon || options.once) return 10;
          await sleep(options.sleepMs);
          continue;
        }
        clearGate();
        process.stdout.write("AUTOPILOT_IDLE no active, in-control or ready non-human task.\n");
        if (!options.daemon || options.once) return 0;
        await sleep(options.sleepMs);
        continue;
      }

      clearGate();
      const before = statusSnapshot();
      if (options.dryRun) {
        process.stdout.write(`${prompt}\n`);
        return 0;
      }

      const exitCode = launchAgent(agentBin, prompt, options);
      const after = statusSnapshot();
      const progressed = before.head !== after.head || before.backlogHash !== after.backlogHash;
      stalls = progressed ? 0 : stalls + 1;

      process.stdout.write(`AUTOPILOT_CYCLE cycle=${cycles} agentExit=${exitCode} progressed=${progressed} stalls=${stalls}\n`);
      if (stalls >= MAX_STALLS) {
        writeGate("THREE_CYCLES_WITHOUT_PROGRESS", []);
        return 5;
      }
      if (options.once) return exitCode === 0 || exitCode === 124 ? 0 : exitCode;
    }
    writeGate("MAX_CYCLES_REACHED", []);
    return 6;
  } finally {
    try { closeSync(lockFd); } catch {}
    rmSync(LOCK, { force: true });
  }
}

main().then((code) => process.exit(code), (error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
});
