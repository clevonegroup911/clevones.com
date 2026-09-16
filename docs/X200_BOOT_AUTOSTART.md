# X200 Boot Autostart — automatic startup and self-recovery

## Architecture

```
POWER ON
  ↓
Fedora + Docker
  ↓
PostgreSQL container clevones-x200-db (restart=unless-stopped)
  ↓
systemd --user (requires linger for pre-login start)
  ├─ clevones-x200-control-center.service  → 127.0.0.1:3001
  ├─ clevones-x200-autopilot.service
  └─ clevones-x200-boot-watchdog.timer (~60s)
  ↓
Graphical login
  ↓
XDG autostart → xdg-open http://127.0.0.1:3001/admin/x200 (once/session)
```

Control Center URL (fixed): `http://127.0.0.1:3001/admin/x200`

## Install

```bash
npm run x200:autostart:install
```

Idempotent. Resolves the real repository path and Node/npm binaries at install time.
Does **not** run `sudo`. Does **not** store GitHub tokens. Does **not** git pull or switch branches.

If linger is disabled:

```
LINGER_REQUIRED=yes
COMMAND=sudo loginctl enable-linger "$USER"
```

Owner must run that command manually. Re-run `npm run x200:autostart:status` to verify.

## Status

```bash
npm run x200:autostart:status
```

Reports:

- `CONTROL_CENTER_AUTOSTART`
- `AUTOPILOT_AUTOSTART`
- `DATABASE_AUTOSTART`
- `BROWSER_AUTOSTART`
- `LINGER`
- `PORT`
- `OVERALL` (`READY` | `DEGRADED` | `LINGER_REQUIRED` | `CONFLICT`)

## Repair

```bash
npm run x200:autostart:repair
```

Re-writes only known X200 unit/desktop files and re-enables allowlisted units.
Never touches unrelated systemd services.

## Disable

```bash
npm run x200:autostart:disable
```

Stops/disables only:

- `clevones-x200-control-center.service`
- `clevones-x200-autopilot.service`
- `clevones-x200-boot-watchdog.service` / `.timer`
- XDG desktop entry

Leaves the database container running (no volume destroy).

## Port 3001 ownership

| State | Behavior |
|---|---|
| FREE | Start Control Center |
| ALREADY_RUNNING (X200) | Report healthy; do not duplicate |
| PORT_3001_CONFLICT (unknown) | Refuse start; expose PID details; **never kill** |

## Database

Container name: `clevones-x200-db`

- Sets Docker restart policy to `unless-stopped` (verified via `docker inspect`)
- Starts existing container if stopped
- Bounded health wait
- Never recreates container, destroys volumes, resets DB, or runs production migrations

If Docker is unavailable → Control Center reports **DEGRADED** (never invents SUCCESS).

## Watchdog

Timer ~60s. Requires multiple consecutive HTTP failures before recovery.
Max recovery attempts then cooldown. Audits to `.x200/boot-watchdog-audit.jsonl`.

Never:

- reboots the computer
- kills unknown processes
- resets the database
- bypasses Human Gates

## Human Gate guarantees

Autostart authorization does **not** authorize:

- MERGE
- DEPLOY_PRODUCTION
- APPLY_MIGRATION
- RESTORE_BACKUP
- ROLLBACK_PRODUCTION
- ENABLE_PAYMENT_LIVE
- SECRET_CHANGES
- DESTRUCTIVE_OPERATIONS

Control Center actions use a fixed allowlist (`START_CONTROL_CENTER`, …).
Arbitrary `systemctl` unit names from the browser are rejected.

## Control Center UX

- Overview badge: `BOOT: READY | DEGRADED | NOT_INSTALLED | …`
- Tab **STARTUP** with VALUE / SOURCE / TIMESTAMP / FRESHNESS / VERIFICATION facts
- Safe actions with audit receipts and explicit confirmation for disable

## Repository files

| Path | Role |
|---|---|
| `ops/systemd/*.template` | Versioned unit templates |
| `ops/xdg/*.template` | Versioned XDG autostart template |
| `scripts/x200-autostart.mjs` | install/status/repair/disable |
| `scripts/x200-control-center-serve.mjs` | serve + port/DB checks |
| `scripts/x200-browser-autostart.mjs` | once-per-session browser open |
| `scripts/x200-boot-watchdog.mjs` | bounded recovery |
| `lib/x200/boot/*` | parsers, status, actions |

Generated user-home paths are **not** committed.

## Troubleshooting

1. `PORT_3001_CONFLICT` — identify the unknown PID; stop it manually if safe; never use pkill patterns.
2. `LINGER_REQUIRED` — run the printed `sudo loginctl enable-linger` command.
3. `DB_RUNNING=NO` — `docker start clevones-x200-db` (or START DATABASE in UI).
4. Control Center inactive but port owned by X200 — already running via another launcher; installer will not duplicate.
5. CI — use `X200_AUTOSTART_DRY_RUN=1` / fixtures; never alter GitHub runner systemd.

## Security boundaries

- Bind `127.0.0.1` only (never `0.0.0.0` by default)
- No credentials in unit files
- No arbitrary shell from the browser
- Fixed `xdg-open` argv and fixed URL only
- SUPER_ADMIN + CSRF for mutations
- Human Gates remain enforced for sensitive ops
