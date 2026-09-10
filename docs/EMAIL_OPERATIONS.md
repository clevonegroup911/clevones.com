# Notifications email opérationnelles (T023)

Livré 2026-09-10. Aucun secret réel. Aucun envoi réseau obligatoire.

## Architecture

- `EmailProvider` abstrait (`lib/email/types.ts`)
- Providers : `console` (défaut), `memory` (tests), `flaky` (tests retries)
- `sendEmail` : retries + journal processus (`getEmailJournal`)
- Templates FR/EN : `initiativeEmailTemplate`
- Branchement : `POST /api/initiative-submission`

## Configuration

`.env.example` : `EMAIL_PROVIDER=console|test|memory`

Pas de SMTP credentials dans Git. Un provider réel = gate humain / T026.

## Preuves

- `lib/email/send.test.ts` retries + outbox
- mode dev/test sans réseau
