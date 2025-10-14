# nQCrm – Development Plan (Blueprint)

Status: Phase 1 – Full MVP Implementation (In Progress)
Owner: Engineering
Last updated: <auto>

---

## 1) Executive Summary
nQCrm is a modern, dark-themed CRM dashboard built with React + FastAPI + MongoDB, branded with neon-green accents (#00C676 / #39FF8E). The MVP delivers:
- Authenticated app shell with sidebar navigation and logo
- Core modules: Dashboard, Projects, Clients, Invoices, Payments
- Stripe integration for invoice payments + transactions list (test mode)
- Clean API-first backend for future mobile app integration
- Data visualizations with Recharts and a cohesive, accessible dark UI following design_guidelines.md

---

## 2) Objectives
- Implement secure JWT auth with default admin user (admin@nqcrm.com / admin123)
- Provide CRUD APIs and UI for Projects, Clients, Invoices
- Integrate Stripe: create payment intents for invoices, list transactions, handle webhooks, and show payout summaries
- Dashboard KPIs + charts: revenue bar chart, payments line chart, recent activity feed
- Ensure responsive layout (desktop/tablet), polished micro-interactions, and testability via data-testid attributes
- Use UUID identifiers and timezone-aware datetimes throughout

---

## 3) UI/UX Design Guidelines (Applied)
Reference: /app/design_guidelines.md

- Color System (per guidelines):
  - Primary: #00C676; Accent: #39FF8E; Base backgrounds: #0B0F10/#0E1417
  - Tokens injected into CSS: --primary, --primary-accent, --bg-base, --fg-primary, etc.
  - Per rule: Gradients limited to <20% viewport; only for login/hero overlays
- Typography: Space Grotesk (headings), Inter (body), Roboto Mono (code)
- Components: Use shadcn/ui exclusively for forms, dialogs, toasts, tables, etc.
- Icons: lucide-react
- Motion: Specific transitions (no transition: all). Hover/active/focus-visible states on all interactive elements
- Data states: explicit loading (skeleton), empty, and error states for each data view
- Accessibility: WCAG AA contrast, keyboard operable menus/dialogs/forms
- Testing attributes: every interactive/critical info element has data-testid

---

## 4) Implementation Steps (Phased)

### Phase 1 – Full MVP Implementation (COMPLETED)
Backend (FastAPI):
- Auth:
  - POST /api/auth/login (JWT issuance), GET /api/auth/me
  - bcrypt password hashing, JWT via python-jose; secure and stateless
  - Seed default admin user (UUID id) if absent
- Data Models (MongoDB, UUIDs, tz-aware datetimes):
  - Client: id, name, email, company, phone, project_ids[], created_at, updated_at
  - Project: id, title, client_id, status, deadline, total_value, created_at, updated_at
  - Invoice: id, number, client_id, project_id, amount, currency, status (paid/pending/overdue), due_date, issued_date, paid_at, stripe_payment_intent_id, created_at, updated_at
  - Payment: id, invoice_id, client_id, amount, currency, status, stripe_charge_id/intent_id, created_at
  - Activity: id, type, entity_type, entity_id, message, actor, timestamp
- CRUD Endpoints (all prefixed with /api):
  - /clients [GET/POST], /clients/{id} [GET/PATCH/DELETE]
  - /projects [GET/POST], /projects/{id} [GET/PATCH/DELETE]
  - /invoices [GET/POST], /invoices/{id} [GET/PATCH/DELETE]
  - /payments [GET] (derived + Stripe sync), /metrics [GET] (aggregate KPIs), /activity [GET]
- Stripe Integration:
  - POST /api/payments/intent -> create PaymentIntent for an invoice (test mode)
  - GET /api/payments/transactions -> list recent Stripe charges/payment_intents
  - Webhooks: /api/stripe/webhook -> update invoice/payment status (payment_intent.succeeded, charge.succeeded)
- Aggregations:
  - KPIs for Dashboard: total revenue (paid invoices sum), active projects count, client count

Frontend (React + React Router + Tailwind + shadcn/ui):
- App Shell: Left sidebar (logo + nav), topbar, content area; dark theme tokens loaded in index.css
- Pages:
  - Login: text-logo, gradient overlay (<20%), email/password form
  - Dashboard: Stat cards, Revenue BarChart, Payments LineChart, Recent Activity
  - Projects: Table + Create/Edit dialog
  - Clients: Search + Table + Add/Edit sheet/dialog
  - Invoices: Tabs (All/Paid/Pending/Overdue) + Table + New Invoice dialog
  - Payments: Transactions list + date filter; payout summaries
- State & Data:
  - Axios API layer using REACT_APP_BACKEND_URL + /api prefix
  - AuthContext storing JWT; Protected routes; attach Bearer token
  - Loading/empty/error states
- Visuals:
  - Recharts (dark theme via CSS tokens); Framer Motion for entrance animations
  - Sonner for toasts; lucide-react icons

Tooling & Ops:
- Use yarn add for dependencies (no npm).
- Supervisor-managed services; logs at /var/log/supervisor/*
- Follow CRITICAL rules: /api prefix, bind 0.0.0.0:8001, UUIDs, tz-aware datetimes

Deliverables for Phase 1:
- Working auth, CRUD APIs, basic UI for modules, charts fed from mock/real data, Stripe intent creation & listing

### Phase 2 – Webhooks, Real-time, and Activity (COMPLETED)
- Stripe webhooks wiring (secure signature verification)
- Activity feed events on CRUD + payment success (append via server)
- Realtime updates:
  - MVP: client polls activity/metrics every 10–20s
  - Enhancement: FastAPI WebSocket endpoint for push updates (activity + invoice state)

### Phase 3 – Polish & Testing
- Testing agent run for end-to-end flows and API checks
- UI refinements per design; accessibility checks; performance passes
- Error boundary components + robust empty/loading visuals

### Phase 4 – Enhancements (Optional/Post-MVP)
- 2FA (time-based OTP) for admin user
- Export/Import CSVs for invoices and clients
- Multi-user roles & permissions

---

## 5) Technical Details

Architecture & Environment:
- Frontend -> Backend: process.env.REACT_APP_BACKEND_URL + /api
- Backend -> MongoDB: MONGO_URL (existing). Preserve and never change this variable name/value.
- Backend binding: 0.0.0.0:8001
- Ingress: /api/* -> backend; others -> frontend

Security:
- JWT with HS256; tokens expire (e.g., 24h); refresh optional later
- Passwords hashed with bcrypt; no plaintext storage
- CORS origins from env CORS_ORIGINS (comma-separated)
- Never log secrets; avoid echoing keys in logs

Stripe:
- Backend-only usage of Secret key; Frontend uses publishable key only when needed (not required for server-created payment intents + server confirmation)
- ENV (backend/.env):
  - STRIPE_SECRET_KEY=<set in env, do not hardcode>
  - STRIPE_WEBHOOK_SECRET=<to be added once webhook is configured>
- ENV (frontend/.env):
  - REACT_APP_STRIPE_PUBLISHABLE_KEY=<set in env, do not hardcode>
- Endpoints:
  - POST /api/payments/intent { invoice_id } -> returns client_secret
  - GET /api/payments/transactions -> server lists latest payment_intents/charges and maps to invoices
  - POST /api/stripe/webhook -> validate signature, update invoice/payment

Data Models (Mongo collections – all IDs are UUID strings):
- users: { id, email, password_hash, name, role, created_at }
- clients: { id, name, email, company, phone, project_ids[], created_at, updated_at }
- projects: { id, title, client_id, status, deadline, total_value, created_at, updated_at }
- invoices: { id, number, client_id, project_id, amount, currency, status, due_date, issued_date, paid_at, stripe_payment_intent_id, created_at, updated_at }
- payments: { id, invoice_id, client_id, amount, currency, status, stripe_charge_id, stripe_payment_intent_id, created_at }
- activity: { id, type, entity_type, entity_id, actor, message, timestamp }

API Surface (all prefixed /api):
- Auth: POST /auth/login, GET /auth/me
- Clients: GET/POST /clients; GET/PATCH/DELETE /clients/{id}
- Projects: GET/POST /projects; GET/PATCH/DELETE /projects/{id}
- Invoices: GET/POST /invoices; GET/PATCH/DELETE /invoices/{id}
- Payments: GET /payments, POST /payments/intent
- Metrics: GET /metrics (revenue, activeProjects, clientsCount, mrr)
- Activity: GET /activity (recent timeline)

Frontend Routing (React Router):
- /login (public)
- / (redirect -> /dashboard)
- /dashboard (protected)
- /projects (protected)
- /clients (protected)
- /invoices (protected)
- /payments (protected)

Dependencies to add (via yarn add):
- Backend: stripe, python-jose, bcrypt (present), python-multipart (present)
- Frontend: recharts, framer-motion, @fontsource/space-grotesk, @fontsource/inter

Testing & QA:
- After MVP: invoke testing agent for both frontend and backend flows
- Compile check (frontend): esbuild src/ --loader:.js=jsx --bundle --outfile=/dev/null
- Logs: tail -n 50 /var/log/supervisor/frontend.*.log /var/log/supervisor/backend.*.log

---

## 6) Next Actions
1) Backend
- Add auth (JWT) endpoints and seed default user
- Create Mongo models/collections and CRUD routes for clients, projects, invoices
- Add metrics and activity endpoints
- Integrate Stripe SDK; implement create intent + transactions list; scaffold webhook endpoint

2) Frontend
- Establish app shell with sidebar/topbar per design tokens; insert logos (1.png horizontal, 5.png icon)
- Implement Login page and AuthContext
- Build pages: Dashboard (stats + charts), Projects, Clients, Invoices, Payments
- Wire API layer with axios, add loading/empty/error states, add data-testid attributes everywhere

3) Tooling & Tests
- Add dependencies (yarn add ...); restart services with supervisorctl if needed
- Run compile checks; review logs; call testing agent for regression suite

---

## 7) Success Criteria
- Authentication: Default user can log in; protected routes enforced; token refresh not required for MVP
- CRUD: Users can create/edit/delete clients, projects, invoices; validations for required fields
- Payments: 
  - Create PaymentIntent from an invoice and complete test-mode payment
  - Transactions list shows Stripe data; invoice status auto-updates to paid on success (via webhook or polling)
- Dashboard: KPIs reflect DB state; revenue and payments charts render data accurately; recent activity updates
- UI/UX: Dark theme per guidelines; tokens applied; hover/focus states; accessible; responsive; subtle animations; gradients within limits
- Testability: data-testid on all interactive/critical UI; lint/compile pass; testing agent scenarios green
- Architecture: All APIs under /api; UUIDs used; tz-aware datetimes; env-driven URLs and keys; no secrets logged; services stable under supervisor
