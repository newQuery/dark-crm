# nQCrm – Development Plan (Blueprint)

Status: Phase 4 – Detail Pages & Enhanced Features (In Progress)
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
- **NEW**: Dedicated detail pages for all entities with enhanced features (deliverables management, PDF invoice generation)

---

## 2) Objectives
- Implement secure JWT auth with default admin user (admin@nqcrm.com / admin123) ✅
- Provide CRUD APIs and UI for Projects, Clients, Invoices ✅
- Integrate Stripe: create payment intents for invoices, list transactions, handle webhooks, and show payout summaries ✅
- Dashboard KPIs + charts: revenue bar chart, payments line chart, recent activity feed ✅
- Ensure responsive layout (desktop/tablet), polished micro-interactions, and testability via data-testid attributes ✅
- Use UUID identifiers and timezone-aware datetimes throughout ✅
- **NEW**: Provide dedicated detail pages with enhanced functionality for all entities 🔄

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

### Phase 1 – Full MVP Implementation (COMPLETED ✅)
Backend (FastAPI):
- Auth:
  - POST /api/auth/login (JWT issuance), GET /api/auth/me
  - bcrypt password hashing, JWT via python-jose; secure and stateless
  - Seed default admin user (UUID id) if absent
- Data Models (MongoDB, UUIDs, tz-aware datetimes):
  - Client: id, name, email, company, phone, project_ids[], created_at, updated_at
  - Project: id, title, client_id, status, deadline, total_value, deliverables[], created_at, updated_at
  - Invoice: id, number, client_id, project_id, amount, currency, status (paid/pending/overdue), due_date, issued_date, paid_at, stripe_payment_intent_id, created_at, updated_at
  - Payment: id, invoice_id, client_id, amount, currency, status, stripe_charge_id/intent_id, created_at
  - Activity: id, type, entity_type, entity_id, message, actor, timestamp
  - Deliverable: id, name, file_url, uploaded_at
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

### Phase 2 – Webhooks, Real-time, and Activity (COMPLETED ✅)
- Stripe webhooks wiring (secure signature verification)
- Activity feed events on CRUD + payment success (append via server)
- Realtime updates:
  - MVP: client polls activity/metrics every 10–20s
  - Enhancement: FastAPI WebSocket endpoint for push updates (activity + invoice state)

### Phase 3 – Full CRUD Actions & Entity Management (COMPLETED ✅)
Add complete action buttons for all entities:
- View detail dialogs/pages
- Edit/Update functionality with pre-filled forms
- Delete actions with confirmation dialogs
- Action buttons in all tables (Projects, Clients, Invoices, Payments)

### Phase 4 – Detail Pages & Enhanced Features (IN PROGRESS 🔄)

**Completed:**
- ✅ Backend: Deliverables management API endpoints
  - POST /api/projects/{id}/deliverables (add deliverable)
  - GET /api/projects/{id}/deliverables (list deliverables)
  - DELETE /api/projects/{id}/deliverables/{deliverable_id} (remove deliverable)
- ✅ Backend: PDF invoice generation with reportlab
  - GET /api/invoices/{id}/pdf (download professional PDF with logo)
- ✅ Backend: reportlab and pillow dependencies added to requirements.txt
- ✅ Frontend: ProjectDetail page fully implemented
  - View project information (client, value, deadline, status)
  - Add/list/remove deliverables with file URLs
  - Download deliverables functionality
  - Breadcrumb navigation back to Projects list
- ✅ Frontend: InvoiceDetail page fully implemented
  - View invoice information (number, amount, dates, status)
  - Display client and project links
  - PDF download button with loading state
  - Stripe payment intent ID display
  - Breadcrumb navigation back to Invoices list
- ✅ Frontend: ClientDetail page created
  - View client contact information (email, phone, company)
  - Display associated projects with links
  - Breadcrumb navigation back to Clients list
- ✅ Frontend: PaymentDetail page created
  - View payment information (amount, currency, date)
  - Display client link
  - Show Stripe transaction IDs
  - Breadcrumb navigation back to Payments list
- ✅ Frontend: Projects.jsx refactored to navigate to detail pages (View button uses navigate)
- ✅ Frontend: Clients.jsx refactored to navigate to detail pages (View button uses navigate)
- ✅ Frontend: App.js routing configured for all detail pages (/projects/:id, /clients/:id, /invoices/:id, /payments/:id)

**In Progress:**
- 🔄 Refactor Invoices.jsx to navigate to detail pages instead of opening view dialog
- 🔄 Refactor Payments.jsx to navigate to detail pages instead of opening view dialog

**Remaining Tasks:**
- Test deliverables upload/list/delete functionality end-to-end
- Test PDF invoice generation and download
- Test all detail pages navigation and display
- Comprehensive testing via testing agent
- UI polish and accessibility review

### Phase 5 – Testing & Polish (UPCOMING)
- Testing agent run for end-to-end flows and API checks
- UI refinements per design; accessibility checks; performance passes
- Error boundary components + robust empty/loading visuals
- Verify all data-testid attributes are present
- Frontend compile check with esbuild
- Service logs review

### Phase 6 – Advanced Features (FUTURE)
- 2FA (time-based OTP) for admin user
- Export/Import CSVs for invoices and clients
- Multi-user roles & permissions
- File upload for deliverables (currently URL-based)
- Invoice templates customization

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
- projects: { id, title, client_id, status, deadline, total_value, deliverables[], created_at, updated_at }
  - deliverables: [{ id, name, file_url, uploaded_at }]
- invoices: { id, number, client_id, project_id, amount, currency, status, due_date, issued_date, paid_at, stripe_payment_intent_id, created_at, updated_at }
- payments: { id, invoice_id, client_id, amount, currency, status, stripe_charge_id, stripe_payment_intent_id, created_at }
- activity: { id, type, entity_type, entity_id, actor, message, timestamp }

API Surface (all prefixed /api):
- Auth: POST /auth/login, GET /auth/me
- Clients: GET/POST /clients; GET/PATCH/DELETE /clients/{id}
- Projects: GET/POST /projects; GET/PATCH/DELETE /projects/{id}
  - POST /projects/{id}/deliverables (add deliverable)
  - GET /projects/{id}/deliverables (list deliverables)
  - DELETE /projects/{id}/deliverables/{deliverable_id} (remove deliverable)
- Invoices: GET/POST /invoices; GET/PATCH/DELETE /invoices/{id}
  - GET /invoices/{id}/pdf (download PDF)
- Payments: GET /payments, POST /payments/intent
- Metrics: GET /metrics (revenue, activeProjects, clientsCount, mrr)
- Activity: GET /activity (recent timeline)

Frontend Routing (React Router):
- /login (public)
- / (redirect -> /dashboard)
- /dashboard (protected)
- /projects (protected)
- /projects/:id (protected) - Project detail page
- /clients (protected)
- /clients/:id (protected) - Client detail page
- /invoices (protected)
- /invoices/:id (protected) - Invoice detail page
- /payments (protected)
- /payments/:id (protected) - Payment detail page

Dependencies:
- Backend: stripe, python-jose, bcrypt, python-multipart, websockets, reportlab, pillow
- Frontend: recharts, framer-motion, @fontsource/space-grotesk, @fontsource/inter, react-router-dom

Testing & QA:
- After implementation: invoke testing agent for both frontend and backend flows
- Compile check (frontend): esbuild src/ --loader:.js=jsx --bundle --outfile=/dev/null
- Logs: tail -n 50 /var/log/supervisor/frontend.*.log /var/log/supervisor/backend.*.log

---

## 6) Current Phase 4 Tasks (Priority Order)

**Immediate (Sprint 1):**
1. Refactor Invoices.jsx View button to navigate to /invoices/:id instead of opening dialog
2. Remove View Dialog from Invoices.jsx (keep Edit and Delete dialogs)
3. Refactor Payments.jsx View button to navigate to /payments/:id instead of opening dialog
4. Remove View Dialog from Payments.jsx

**Testing (Sprint 2):**
5. Test ProjectDetail page deliverables functionality (add, list, delete)
6. Test InvoiceDetail page PDF download
7. Test all navigation flows (list -> detail -> back to list)
8. Verify all detail pages display correct data
9. Run comprehensive testing via testing agent

**Polish (Sprint 3):**
10. Frontend compile check with esbuild
11. Review service logs for errors
12. Accessibility audit on detail pages
13. Verify all data-testid attributes present
14. UI/UX polish based on testing feedback

---

## 7) Success Criteria

**Phase 1-3 (Completed):**
- ✅ Authentication: Default user can log in; protected routes enforced
- ✅ CRUD: Users can create/edit/delete clients, projects, invoices
- ✅ Payments: Create PaymentIntent, transactions list, webhook integration
- ✅ Dashboard: KPIs, charts, activity feed working
- ✅ UI/UX: Dark theme, design tokens, responsive, accessible
- ✅ Architecture: /api prefix, UUIDs, tz-aware datetimes, env-driven config

**Phase 4 (In Progress):**
- ✅ Backend deliverables API endpoints functional
- ✅ Backend PDF generation working
- ✅ ProjectDetail page with deliverables management
- ✅ InvoiceDetail page with PDF download
- ✅ ClientDetail and PaymentDetail pages created
- 🔄 All CRUD pages navigate to detail pages (not dialogs)
- ⏳ All detail pages tested and verified
- ⏳ Testing agent validation passed
- ⏳ No console errors, all services stable

**Definition of Done for Phase 4:**
- All View buttons navigate to dedicated detail pages
- No view dialogs remain in CRUD pages (only Edit/Delete dialogs)
- All detail pages display complete entity information
- ProjectDetail deliverables CRUD works end-to-end
- InvoiceDetail PDF download works with proper formatting and logo
- All navigation (breadcrumbs, links) works correctly
- Testing agent reports no critical issues
- Frontend compiles without errors
- All interactive elements have data-testid attributes
