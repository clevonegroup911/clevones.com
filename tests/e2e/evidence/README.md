# Preuves visuelles admin MFA (T009)

Ce dossier reçoit les captures Playwright **sans secret**.

Fichiers produits par `npx playwright test` :

- `desktop-login.png` / `mobile-login.png` — formulaire de connexion vide
- `desktop-mfa.png` / `mobile-mfa.png` — écran TOTP sans challenge (champ absent, message d'expiration)
- `desktop-mfa-challenge.png` / `mobile-mfa-challenge.png` — écran TOTP avec challenge de fixture, champ code vide
- `desktop-dashboard.png` / `mobile-dashboard.png` — dashboard après authentification de fixture

Interdit dans les captures : QR, secret TOTP, codes de récupération, mot de passe, `.env`.

Les PNG générés ne sont pas versionnés. Le HTML de rapport Playwright est local (`tests/e2e/report/`).
