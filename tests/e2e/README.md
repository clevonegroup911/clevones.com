# Tests e2e Playwright (T009)

Preuves automatisées du parcours `/admin` MFA. Fixtures synthétiques uniquement (`e2e.admin@example.test`). Aucun secret de production.

```bash
npx playwright install chromium
npx playwright test
```

La base PostgreSQL doit être **locale et temporaire** (`PLAYWRIGHT_DATABASE_URL`, `TEST_DATABASE_URL`, ou Docker `clevones_e2e`). L’URL de production est refusée.

Les captures sûres sont écrites dans `tests/e2e/evidence/`.
