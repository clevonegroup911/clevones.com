# Clevones.com

Institutional website for **Clevones** — an independent platform for territorial economic-flow governance in the Democratic Republic of Congo and across Africa.

This repository contains the public marketing site and a **preparatory layer** for the future SaaS platform (authentication, client portal, and extranet).

## Tech stack

| Technology | Role |
|---|---|
| [Next.js 15](https://nextjs.org/) | React framework, App Router |
| [TypeScript](https://www.typescriptlang.org/) | Static typing |
| [Tailwind CSS 4](https://tailwindcss.com/) | Utility-first design system |
| [Zod](https://zod.dev/) | Server-side validation for API payloads |
| [ESLint](https://eslint.org/) | Code quality and consistency |

## Prerequisites

- **Node.js** 20 or later
- **npm** 10 or later

Verify your environment:

```bash
node -v
npm -v
```

## Getting started

### 1. Install dependencies

From the project root:

```bash
npm install
```

### 2. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The dev server supports hot reload — save a file and the browser updates automatically.

### 3. Build the production version

```bash
npm run build
```

This runs a production compile and type check. To serve the build locally:

```bash
npm run start
```

Production server defaults to [http://localhost:3000](http://localhost:3000).

### 4. Run lint

```bash
npm run lint
```

ESLint is configured via `eslint.config.mjs` with the Next.js and React Hooks rulesets. Run lint before opening a pull request or deploying.

## Testing

There is no automated test suite in this repository yet. Use the following workflow to validate changes:

| Step | Command / action |
|---|---|
| Static analysis | `npm run lint` — must pass with no errors |
| Production build | `npm run build` — must complete without TypeScript or build errors |
| Manual smoke test | `npm run dev` — visit key routes (see [Page list](#page-list)) |
| Responsive check | Resize the viewport or use device emulation — layout is mobile-first |
| Auth placeholder | Confirm `/portal` loads; route protection in `middleware.ts` is prepared but not active |

When adding features, manually verify navigation links, form interactions (contact page), and metadata on each affected route.

For the contact form, submit a structured initiative on `/contact` and confirm the API returns a success response. In development, check the server console for a safe metadata log (document references and file content are not logged).

## Backend API

### `POST /api/initiative-submission`

Accepts structured initiative submissions from the contact form. Validates the payload server-side with Zod, prepares content for future email delivery, and returns JSON responses. No database, authentication, or email provider is connected yet.

**Request** — `Content-Type: application/json`

| Field | Required | Description |
|---|---|---|
| `organizationName` | Yes | Submitting organization |
| `legalStatus` | Yes | Legal form of the organization |
| `country` | Yes | Country of registration or operation |
| `contactPerson` | Yes | Named institutional contact |
| `professionalEmail` | Yes | Official email for correspondence |
| `actorType` | Yes | Actor category (see form options) |
| `initiativeTitle` | Yes | Title of the proposed initiative |
| `initiativeStage` | Yes | Current maturity stage |
| `shortDescription` | Yes | Initiative summary (minimum 40 characters) |
| `complianceConfirmation` | Yes | Must be `true` — governance acknowledgment |
| `website` | No | Organization website |
| `phone` | No | Phone or WhatsApp |
| `actorTypeOther` | Conditional | Required when `actorType` is `other` |
| `territoryConcerned` | Yes | Geographic or territorial scope |
| `availableDocumentation` | No | References to available documentation (text only; no file uploads) |
| `complianceStatus` | Yes | Regulatory or institutional compliance position |
| `expectedCollaborationType` | Yes | Expected scope of collaboration |

**Responses**

| Status | Body | Meaning |
|---|---|---|
| `200` | `{ "success": true, "message": "..." }` | Submission received |
| `400` | `{ "success": false, "errors": { "field": "message" } }` | Validation failure |
| `400` | `{ "success": false, "error": "..." }` | Malformed request body |
| `500` | `{ "success": false, "error": "..." }` | Server error |

**Development logging** — When `NODE_ENV=development`, the route logs submission metadata to the server console. Document references, file content, and private attachments are never logged.

**Integration** — The contact form calls this route via `submitInitiativeSubmission()` in `lib/contact-form.ts`. Email content is prepared in `lib/initiative-submission-email.ts` for a future provider.

**Example**

```bash
curl -X POST http://localhost:3000/api/initiative-submission \
  -H "Content-Type: application/json" \
  -d '{
    "organizationName": "Example Institution",
    "legalStatus": "Public agency",
    "country": "Democratic Republic of the Congo",
    "contactPerson": "Jane Doe",
    "professionalEmail": "contact@example.org",
    "actorType": "institution",
    "initiativeTitle": "Territorial logistics governance pilot",
    "initiativeStage": "documented-initiative",
    "shortDescription": "A structured pilot to align territorial logistics actors under documented governance criteria and reporting standards.",
    "territoryConcerned": "Kinshasa",
    "complianceStatus": "Subject to national transport and ESG reporting requirements.",
    "expectedCollaborationType": "Governance design and institutional coordination.",
    "complianceConfirmation": true
  }'
```

## Project structure

```
clevones-com/
├── app/
│   ├── (public)/              # Public institutional site
│   │   ├── page.tsx           # Home
│   │   ├── positioning/
│   │   ├── methodology/
│   │   ├── ecosystem/
│   │   ├── insights/          # Listing + [slug] articles
│   │   ├── governance/
│   │   ├── contact/
│   │   ├── mentions-legales/
│   │   ├── confidentialite/
│   │   ├── mission/           # French alternate route
│   │   └── positionnement/    # French alternate route
│   ├── (auth)/                # Authentication shell
│   │   └── sign-in/
│   ├── (dashboard)/           # Client portal shell
│   │   └── portal/
│   ├── layout.tsx             # Root layout, fonts, metadata
│   └── globals.css            # Design tokens and global styles
├── components/
│   ├── layout/                # Header, footer, site shell
│   ├── sections/              # Page-level content blocks
│   └── ui/                    # Reusable UI primitives
├── lib/
│   ├── constants/             # Navigation, ecosystem, CTA config
│   ├── auth/                  # Auth routes and protected-path helpers
│   ├── seo/                   # Metadata helpers
│   ├── validation/            # Zod schemas for API payloads
│   ├── initiative-submission-email.ts  # Email preparation (provider not wired)
│   ├── initiative-submission-log.ts    # Development-safe submission logging
│   ├── contact-form.ts        # Contact form types, client validation, API client
│   ├── site.ts                # Site-wide configuration
│   └── *-page.ts              # Per-page content and copy
├── types/                     # Shared TypeScript types
├── public/                    # Static assets
├── middleware.ts              # Route protection (ready for auth integration)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── eslint.config.mjs
```

### Conventions

- **Mobile-first** — base styles target mobile; enrich with `sm`, `lg`, and larger breakpoints.
- **Components** — `layout/` for global structure, `sections/` for page content, `ui/` for stateless primitives.
- **Content** — institutional copy lives in `lib/*-page.ts` and `lib/site.ts` so pages stay thin and content is easy to maintain.
- **Path alias** — `@/*` maps to the project root (see `tsconfig.json`).

## Page list

### Public site

| Route | Description |
|---|---|
| `/` | Home — hero, positioning preview, methodology, ecosystem, insights |
| `/positioning` | Institutional positioning and role definition |
| `/methodology` | Governance methodology and process |
| `/ecosystem` | Territorial ecosystem map and actors |
| `/insights` | Strategic insights index |
| `/insights/governance-before-capital` | Article — governance before capital |
| `/insights/informal-coordination-cost` | Article — cost of informal coordination |
| `/insights/institutionally-legible-initiative` | Article — legible initiatives |
| `/insights/logistics-as-governance` | Article — logistics as governance |
| `/insights/neutral-platforms-territorial-coordination` | Article — neutral platforms |
| `/insights/investment-ready-initiatives-drc` | Article — investment readiness in the DRC |
| `/governance` | Governance framework and compliance posture |
| `/contact` | Strategic collaboration and contact form |
| `/mentions-legales` | Legal notice |
| `/confidentialite` | Privacy policy |

### Alternate routes (French)

| Route | Description |
|---|---|
| `/mission` | Mission statement (French) |
| `/positionnement` | Positioning page (French alias) |

### Platform (preparatory)

| Route | Description | Status |
|---|---|---|
| `/sign-in` | Sign-in page | UI ready; auth provider not wired |
| `/portal` | Client portal / extranet entry | Shell ready; protected by `middleware.ts` when auth is enabled |

Route constants and protected-path logic live in `lib/auth/`. Uncomment the redirect block in `middleware.ts` when integrating sessions (JWT, cookies, or an auth provider).

## Design system

Institutional palette — restrained and authoritative:

- **Brand** — deep blue (`brand-950` → `brand-50`)
- **Accent** — discreet gold (`accent-500`)
- **Typography** — Georgia (institutional headings) + Segoe UI / system sans (body)

Tokens and utilities are defined in `app/globals.css` and `tailwind.config.ts`.

## Future roadmap

Planned evolution from institutional site to full SaaS platform:

| Area | Description |
|---|---|
| **Backend API** | Extend beyond contact submissions (`POST /api/initiative-submission`) to platform data and business logic |
| **Authentication** | Session management, sign-in/sign-out, protected routes via `middleware.ts` |
| **PostgreSQL** | Primary datastore for users, initiatives, compliance records, and audit trails |
| **Payments (Visa + M-Pesa)** | Dual-rail billing for international cards and mobile money in the DRC |
| **Clevonet extranet** | Client portal for territorial actors — dashboards, documents, and coordination workflows |
| **AI assistant** | Governance-aware assistant for initiative structuring and compliance guidance |
| **Reporting system** | Institutional reporting, exports, and territorial economic-flow analytics |

## License

Proprietary — © Clevones. All rights reserved.
