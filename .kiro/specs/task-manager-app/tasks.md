# Implementation Plan: Task Manager App

## Overview

Full-stack to-do application built with Node.js 20 + Express + TypeScript (backend) and React 18 + Vite + TypeScript (frontend), backed by PostgreSQL via Prisma ORM and deployed on AWS (S3 + CloudFront / Elastic Beanstalk / RDS). Implementation proceeds layer by layer: project scaffold → backend infrastructure → data layer → API modules → frontend → tests → documentation.

---

## Tasks

- [x] 1. Project scaffold and shared tooling
  - [x] 1.1 Initialise monorepo root with `package.json` (workspaces: `frontend`, `backend`), `.gitignore`, and root-level `.env.example` documenting `DATABASE_URL`, `JWT_SECRET`, `PORT`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` with placeholder values and descriptions
    - Create `/package.json` with workspace config
    - Create root `.env.example` with all five variables, each with a non-functional placeholder and a one-line description
    - _Requirements: 10.1, 10.2, 14.5_

  - [x] 1.2 Scaffold backend package (`/backend/package.json`, `tsconfig.json`, `nodemon`/`ts-node` dev setup)
    - Add dependencies: `express`, `jsonwebtoken`, `bcryptjs`, `zod`, `@prisma/client`; dev deps: `typescript`, `@types/*`, `vitest`, `supertest`, `fast-check`, `ts-node`, `nodemon`
    - Configure `tsconfig.json` with strict mode and path aliases
    - _Requirements: 11.1, 11.2, 11.3_

  - [x] 1.3 Configure ESLint for the backend with layer-boundary rules
    - Install `eslint`, `@typescript-eslint/*`, `eslint-plugin-import`
    - Write `.eslintrc.js` rules that fail the lint check when `prisma` is imported in `controllers/` or `services/`, or when Express types (`Request`, `Response`, `NextFunction`, `Router`) are imported in `services/`
    - _Requirements: 11.4_

  - [x] 1.4 Scaffold frontend package with Vite + React 18 + TypeScript + Tailwind CSS
    - Run `npm create vite@latest frontend -- --template react-ts`
    - Install and configure Tailwind CSS (`tailwind.config.ts`, `postcss.config.js`)
    - Install React Router v6, Axios, Recharts
    - _Requirements: 13.1_

- [x] 2. Backend infrastructure — Express app, middlewares, health endpoint
  - [x] 2.1 Implement `envValidator.ts` and `server.ts` entry point
    - `envValidator.ts`: reads `DATABASE_URL`, `JWT_SECRET`, `PORT` from `process.env`; logs a descriptive error naming each missing variable and calls `process.exit(1)` before any port is opened
    - `server.ts`: calls `validateEnv()`, then creates the Express app and starts listening
    - _Requirements: 10.3_

  - [x] 2.2 Implement `app.ts` Express app factory with middleware registration order
    - Register `express.json()`, CORS, routes, `notFoundMiddleware`, `errorMiddleware` (in that order)
    - Export `app` for use in `supertest` integration tests
    - _Requirements: 9.1, 9.5_

  - [x] 2.3 Implement `AppError.ts` custom error class
    - `class AppError extends Error` carrying `statusCode: number`
    - _Requirements: 9.1, 9.2_

  - [x] 2.4 Implement `error.middleware.ts` centralised error handler
    - Handle `AppError`, `ZodError`, Prisma `P2002`, and generic errors
    - Return `{ status, message, timestamp }` on every error path; include `stack` field only in non-production environments
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 2.5 Implement `notFound.middleware.ts` catch-all 404 handler
    - Returns `{ status: 404, message: "Route not found", timestamp }` for any undefined route
    - _Requirements: 9.5_

  - [x] 2.6 Implement health endpoint `GET /api/health`
    - `health.controller.ts` returns HTTP 200 `{ "status": "ok" }` with no authentication required
    - Wire route in `app.ts` before auth middleware
    - _Requirements: 15.5_

  - [ ]* 2.7 Write unit tests for error middleware and notFound middleware
    - Test each error type mapping (`AppError`, `ZodError`, P2002, generic) produces the correct HTTP status and response shape
    - Test non-production `stack` field presence; test production absence
    - Test 404 handler returns correct shape
    - _Requirements: 9.2, 9.3, 9.4, 9.5_

- [x] 3. Prisma setup — schema, migration, seed
  - [x] 3.1 Write Prisma schema (`backend/prisma/schema.prisma`)
    - Define `Role` enum (`USER`, `ADMIN`), `TaskStatus` enum (`pending`, `in_progress`, `done`)
    - Define models: `User` (id, email unique, password, role, createdAt, tasks relation), `Category` (id, name unique, createdAt, tasks relation), `Priority` (id, name unique, createdAt, tasks relation), `Task` (id, title VarChar(120), description VarChar(500)?, status default pending, dueDate?, createdAt, updatedAt, userId FK, categoryId? FK, priorityId? FK)
    - Configure `datasource db` using `env("DATABASE_URL")`
    - _Requirements: 3.1, 3.3, 3.5_

  - [x] 3.2 Generate initial Prisma migration and run it
    - Run `npx prisma migrate dev --name init`
    - Commit migration files under `backend/prisma/migrations/`
    - _Requirements: 3.1_

  - [x] 3.3 Implement seed script (`backend/prisma/seed.ts`)
    - Read `ADMIN_EMAIL` and `ADMIN_PASSWORD` from env; log error and `process.exit(1)` if either is absent
    - Upsert default categories (`Trabajo`, `Personal`, `Estudio`) and priorities (`Alta`, `Media`, `Baja`) using `createMany` with `skipDuplicates: true`
    - Upsert ADMIN user (hash password with bcrypt cost ≥ 10; skip if email already exists)
    - Register seed script in `package.json` under `prisma.seed`
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [ ]* 3.4 Write property test for seed idempotency
    - **Property 17: Seed idempotency for master data**
    - Run seed N times (generated by fast-check `fc.integer({ min: 1, max: 5 })`), assert category count = 3 and priority count = 3 after each run
    - **Validates: Requirements 14.1, 14.2**

- [x] 4. Shared backend utilities and JWT/bcrypt helpers
  - [x] 4.1 Implement `jwt.ts` sign/verify helpers
    - `signToken(payload)` — signs with `JWT_SECRET`, expiry 24 h
    - `verifyToken(token)` — returns decoded payload or throws on invalid/expired
    - _Requirements: 1.1, 2.1, 7.1_

  - [x] 4.2 Implement `bcrypt.ts` hash/compare helpers
    - `hashPassword(plain)` — bcrypt hash with cost factor ≥ 10
    - `comparePassword(plain, hash)` — returns boolean
    - _Requirements: 1.3_

- [x] 5. Auth module — register, login, JWT middleware, role middleware
  - [x] 5.1 Define Zod schemas for auth (`backend/src/schemas/auth.schema.ts`)
    - `registerSchema`: `email` (valid email format, required), `password` (string, min 8 chars, required) — list each failing field by name in the error
    - `loginSchema`: `email` (required), `password` (required)
    - _Requirements: 1.5, 8.1, 8.2_

  - [x] 5.2 Implement `user.repository.ts`
    - `findByEmail(email)`, `createUser({ email, password, role })`, `countUsers()` (to detect first-user)
    - Only layer allowed to import Prisma
    - _Requirements: 1.1, 1.4, 11.3_

  - [x] 5.3 Implement `auth.service.ts`
    - `register`: call `countUsers()`; if 0, assign `ADMIN` else `USER`; check uniqueness (409 on duplicate email); hash password; create user; sign and return JWT
    - `login`: find user by email; generic 401 if not found or password mismatch (same message regardless of which field failed)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2_

  - [x] 5.4 Implement `auth.controller.ts` and auth routes (`backend/src/routes/auth.routes.ts`)
    - `POST /api/auth/register` → `validateMiddleware(registerSchema)` → `authController.register`
    - `POST /api/auth/login` → `validateMiddleware(loginSchema)` → `authController.login`
    - _Requirements: 1.1, 2.1_

  - [x] 5.5 Implement `auth.middleware.ts` JWT validation middleware
    - Extract Bearer token from `Authorization` header
    - Validate three-segment Base64url structure, verify signature against `JWT_SECRET`, confirm `exp` is in the future
    - Attach decoded payload to `req.user`; call `next(new AppError(401, ...))` on any failure
    - Augment `express.d.ts` type declaration for `req.user`
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 5.6 Implement `role.middleware.ts` ADMIN guard
    - Check `req.user.role === 'ADMIN'`; call `next(new AppError(403, 'Insufficient permissions'))` otherwise
    - Apply to all `/api/admin/*` routes
    - _Requirements: 7.4_

  - [x] 5.7 Implement `validate.middleware.ts` Zod validation middleware
    - Parse `req.body` (and `req.query` where applicable) against the provided Zod schema
    - On failure, call `next` with a structured error carrying the field-level `errors` array
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 5.8 Write property tests for auth service
    - **Property 1: Password storage never exposes plain text**
      - `fc.string({ minLength: 1 })` as password input; assert stored hash ≠ plain text
      - **Validates: Requirements 1.3**
    - **Property 2: Registration rejects any invalid input**
      - Generate arbitrary malformed emails and passwords shorter than 8 chars; assert HTTP 400 and no user created
      - **Validates: Requirements 1.5**
    - **Property 3: Login never reveals which field is wrong**
      - Generate arbitrary unrecognised email + password pairs; assert response body is identical whether email or password caused the failure
      - **Validates: Requirements 2.2**

  - [ ]* 5.9 Write property test for JWT middleware
    - **Property 14: JWT validation rejects any malformed or expired token**
    - Generate arbitrary token strings (random base64, expired JWTs); assert HTTP 401 returned and no request payload processed
    - **Validates: Requirements 7.1, 7.2, 7.3**

  - [ ]* 5.10 Write unit tests for auth controller and service
    - Duplicate email → 409; first user → ADMIN; bcrypt hash stored; JWT 24 h expiry; generic 401 on bad credentials
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2_

- [x] 6. Checkpoint — backend scaffold and auth
  - Ensure ESLint passes (no layer violations), `vitest --run` passes all auth and middleware tests, health endpoint returns 200. Ask the user if any questions arise.

- [x] 7. Lookup endpoints — read-only categories and priorities
  - [x] 7.1 Implement `category.repository.ts` and `priority.repository.ts` (findAll, findById, create, update, delete, countTasksUsing)
    - `findAll()` returns all records; `countTasksUsing(id)` counts tasks referencing the entity
    - _Requirements: 6.1, 13.7_

  - [x] 7.2 Implement lookup routes (`GET /api/categories`, `GET /api/priorities`)
    - Protected by `authMiddleware` only (any authenticated role)
    - `lookup.routes.ts` → `maintenance.controller.ts` list actions
    - _Requirements: 13.7_

- [x] 8. Task module — CRUD and filter endpoints
  - [x] 8.1 Define Zod schemas for tasks (`backend/src/schemas/task.schema.ts`)
    - `createTaskSchema`: `title` (1–120 chars, required), `description` (max 500 chars, optional), `dueDate` (ISO date, optional), `categoryId` (UUID, optional), `priorityId` (UUID, optional)
    - `updateTaskSchema`: all fields optional (partial), `status` constrained to `pending | in_progress | done`
    - `taskFilterSchema`: `status` (optional, enum), `start_date` (YYYY-MM-DD, optional), `end_date` (YYYY-MM-DD, optional); validate that both dates are provided together and `start_date ≤ end_date`
    - _Requirements: 3.1, 3.2, 3.5, 3.6, 4.1, 4.2, 4.4_

  - [x] 8.2 Implement `task.repository.ts`
    - `create(data)`, `findById(id)`, `findAllByUser(userId, filters)` (applies status and date-range filters), `update(id, data)`, `deleteById(id)`
    - `findAllByUser` builds a Prisma `where` clause from optional `status`, `start_date`, `end_date` filter args
    - _Requirements: 3.1, 3.4, 3.8, 4.1, 4.2, 4.3_

  - [x] 8.3 Implement `task.service.ts`
    - `createTask`: validate FK existence for `categoryId`/`priorityId` (400 if not found); set `userId` from authenticated user; default status `pending`
    - `getTaskById`: enforce ownership (403 if `task.userId ≠ req.user.sub`)
    - `listTasks`: delegate filter args to repository
    - `updateTask`: enforce ownership; perform partial update (preserve omitted fields)
    - `deleteTask`: enforce ownership; return nothing (204)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 4.1, 4.2, 4.3, 4.4_

  - [x] 8.4 Implement `task.controller.ts` and task routes (`backend/src/routes/task.routes.ts`)
    - Wire `authMiddleware` on all routes; apply appropriate Zod validation middleware per endpoint
    - `GET /api/tasks` → `validateMiddleware(taskFilterSchema)` → `taskController.list`
    - `POST /api/tasks` → `validateMiddleware(createTaskSchema)` → `taskController.create`
    - `GET /api/tasks/:id` → `taskController.getById`
    - `PATCH /api/tasks/:id` → `validateMiddleware(updateTaskSchema)` → `taskController.update`
    - `DELETE /api/tasks/:id` → `taskController.delete`
    - _Requirements: 3.1, 3.4, 3.5, 3.7, 3.8_

  - [ ]* 8.5 Write property tests for task service
    - **Property 4: Task list isolation**
      - Generate two distinct users each with tasks; assert user A's list contains zero of user B's tasks
      - **Validates: Requirements 3.4, 3.7**
    - **Property 5: Partial update preserves omitted fields**
      - Generate arbitrary existing task and arbitrary partial payload; assert omitted fields unchanged
      - **Validates: Requirements 3.5**

  - [ ]* 8.6 Write property tests for task filter
    - **Property 6: Status filter correctness**
      - Generate arbitrary task collections and status filter; assert every response task has the exact requested status
      - **Validates: Requirements 4.1**
    - **Property 7: Date range filter correctness**
      - Generate arbitrary tasks with varying dueDates and valid [start_date, end_date] ranges; assert all response tasks fall within the range
      - **Validates: Requirements 4.2**
    - **Property 8: Combined filter is conjunctive**
      - Generate arbitrary tasks, status, and date range; assert response satisfies both conditions simultaneously
      - **Validates: Requirements 4.3**

  - [ ]* 8.7 Write property test for Zod validation middleware
    - **Property 15: Zod validation blocks mutation on any invalid payload**
    - Use `fc.anything()` to generate arbitrary malformed bodies; assert HTTP 400 with field-level errors and no DB mutation
    - **Validates: Requirements 8.1, 8.2, 8.3**

  - [ ]* 8.8 Write unit/integration tests for task module
    - Ownership 403 across all mutating endpoints; default status `pending`; invalid FK returns 400; filter validation returns 400 with correct field identified
    - _Requirements: 3.2, 3.3, 3.6, 3.7, 4.4_

- [x] 9. Reports module
  - [x] 9.1 Implement `report.repository.ts`
    - `getStatusCounts(userId)`: `groupBy` status, returns `{ pending, in_progress, done }` with 0 for missing groups
    - `getOverdueCount(userId)`: count where `dueDate < today AND status ≠ done`
    - `getUpcomingTasks(userId, today, end)`: find where `dueDate IN [today, end] AND status ≠ done`; return `{ count, tasks: [{ id, title, dueDate }] }`
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 9.2 Implement `report.service.ts`
    - Compose the three repository calls; compute `today` and `today+7` at call time (no hardcoded dates)
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 9.3 Implement `report.controller.ts` and report route (`GET /api/reports`)
    - Protected by `authMiddleware`; returns the full report JSON
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 9.4 Write property tests for report service
    - **Property 9: Report counts are complete and accurate**
      - Generate arbitrary mix of tasks per user; assert exactly three status keys, each count equals actual task count for that status
      - **Validates: Requirements 5.1**
    - **Property 10: Overdue count matches definition**
      - Generate arbitrary tasks with varying `dueDate` and `status`; assert `overdueCount` equals tasks where `dueDate < today AND status ≠ done`
      - **Validates: Requirements 5.2**
    - **Property 11: Upcoming tasks window is correct**
      - Generate arbitrary tasks; assert `upcoming.tasks` contains exactly tasks where `dueDate ∈ [today, today+7]` AND `status ≠ done`, and `count` equals list length
      - **Validates: Requirements 5.3**

  - [ ]* 9.5 Write unit tests for report module
    - Zero tasks → all counts 0; no overdue tasks → `overdueCount` 0; mixed task set returns correct structured response
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 10. Maintenance module — ADMIN CRUD for categories and priorities
  - [x] 10.1 Define Zod schemas for maintenance (`backend/src/schemas/maintenance.schema.ts`)
    - `categorySchema` / `prioritySchema`: `name` (non-empty, non-whitespace-only, max 100 chars, required)
    - _Requirements: 6.6_

  - [x] 10.2 Implement `maintenance.service.ts`
    - `createCategory/Priority`: validate name (400 on blank/too-long); check case-insensitive uniqueness (409 on duplicate); persist
    - `updateCategory/Priority`: same validations; 409 on duplicate name collision with another record
    - `deleteCategory/Priority`: call `countTasksUsing(id)` (409 if > 0)
    - _Requirements: 6.1, 6.3, 6.4, 6.5, 6.6_

  - [x] 10.3 Implement `maintenance.controller.ts` and admin routes
    - `backend/src/routes/admin/category.routes.ts` and `priority.routes.ts`
    - Apply `authMiddleware` + `roleMiddleware` on all `/api/admin/*` routes
    - Wire full CRUD: `GET`, `POST`, `GET /:id`, `PATCH /:id`, `DELETE /:id` for both entities
    - _Requirements: 6.1, 6.2_

  - [ ]* 10.4 Write property tests for maintenance service
    - **Property 12: Maintenance name uniqueness is case-insensitive**
      - Generate arbitrary name strings including Unicode variants; assert creating/updating with case-variant of existing name returns 409 and data is unchanged
      - **Validates: Requirements 6.5**
    - **Property 13: Maintenance entity deletion blocked when in use**
      - Generate category/priority referenced by at least one task; assert DELETE returns 409 and entity remains in DB
      - **Validates: Requirements 6.3, 6.4**

  - [ ]* 10.5 Write unit/integration tests for maintenance module
    - Non-ADMIN → 403; in-use deletion → 409; duplicate name (exact and case-variant) → 409; blank name → 400; name > 100 chars → 400
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 11. Checkpoint — full backend API
  - Run `eslint --ext .ts backend/src`; run `vitest --run` for all backend tests; manually verify each module's happy-path with a REST client. Ask the user if any questions arise.

- [x] 12. Frontend scaffold — routing, Axios, AuthContext
  - [x] 12.1 Set up React Router v6 with `App.tsx`, `ProtectedRoute` wrapper, and page routes
    - Define routes: `/login`, `/register`, `/tasks`, `/reports`, `/maintenance`
    - `ProtectedRoute`: reads from `AuthContext`; redirects unauthenticated users to `/login`
    - `AdminRoute` (extends `ProtectedRoute`): additionally checks role = `ADMIN`; redirects to `/tasks` otherwise
    - _Requirements: 13.1, 13.2_

  - [x] 12.2 Implement `AuthContext.tsx`
    - Store JWT string and decoded payload (`id`, `role`) in React context
    - `login(token)`: decode payload, persist token in `localStorage`, update context state
    - `logout()`: clear `localStorage` and context state
    - Re-hydrate from `localStorage` on mount
    - _Requirements: 2.3, 2.4_

  - [x] 12.3 Implement `api.ts` Axios instance with interceptors
    - Base URL from `import.meta.env.VITE_API_URL`
    - Request interceptor: attach `Authorization: Bearer <token>` from `localStorage`
    - Response interceptor: on HTTP 401, call `logout()` and redirect to `/login`
    - Report service: configure 10 000 ms timeout on the reports Axios call
    - _Requirements: 2.3, 2.4, 5.5_

- [x] 13. Frontend pages and components
  - [x] 13.1 Implement `LoginPage.tsx` and `RegisterPage.tsx`
    - Forms with controlled inputs for email and password
    - On success: call `AuthContext.login(token)`, redirect to `/tasks`
    - On error: display API error message in `Notification` component
    - _Requirements: 13.1, 13.8, 13.9_

  - [x] 13.2 Implement `Navbar.tsx` with role-based Mantenimiento link
    - Show navigation links: Tareas, Reportes; conditionally show Mantenimiento only when `role === 'ADMIN'`
    - Include Cerrar Sesión button calling `AuthContext.logout()`
    - _Requirements: 13.2_

  - [x] 13.3 Implement `Notification.tsx` toast component
    - Non-blocking, auto-dismiss toast; accepts `type` (success | error) and `message`
    - _Requirements: 13.8, 13.9_

  - [x] 13.4 Implement `lookup.service.ts` and seed dropdowns into context or local state
    - `getCategories()` → `GET /api/categories`; `getPriorities()` → `GET /api/priorities`
    - Results used to populate all category/priority `<select>` dropdowns throughout the app
    - _Requirements: 13.3, 13.4, 13.7_

  - [x] 13.5 Implement `TaskForm.tsx` (create and edit mode)
    - Controlled inputs: title, description, dueDate, category `<select>`, priority `<select>`
    - Populate dropdowns from `lookup.service.ts`
    - Edit mode: pre-fill with task's current values including selected category and priority
    - _Requirements: 13.3, 13.4_

  - [x] 13.6 Implement `ConfirmDialog.tsx` delete confirmation modal
    - Renders a modal asking "¿Confirmar eliminación?"; only calls the delete API on user confirmation
    - _Requirements: 13.5_

  - [x] 13.7 Implement `TaskCard.tsx`
    - Displays task fields: title, description, status badge, dueDate, category, priority
    - Edit button opens `TaskForm` in edit mode; delete button opens `ConfirmDialog`
    - _Requirements: 13.4, 13.5_

  - [x] 13.8 Implement `FilterBar.tsx`
    - Status `<select>` with values `pending`, `in_progress`, `done` and a blank/all option
    - Two `<input type="date">` pickers for `start_date` and `end_date`
    - On change: updates parent filter state, triggering re-fetch
    - _Requirements: 13.6_

  - [x] 13.9 Implement `TaskListPage.tsx`
    - Fetch tasks on mount and on filter change using `task.service.ts`
    - Render `FilterBar`, `TaskForm` (create mode at top), list of `TaskCard` components
    - Show `Notification` on successful create/update/delete
    - _Requirements: 13.3, 13.5, 13.6, 13.8, 13.9_

  - [x] 13.10 Implement report components and `ReportsPage.tsx`
    - `ReportChart.tsx`: Recharts bar or pie chart rendering `byStatus` data
    - `ReportCard.tsx`: numeric card displaying `overdueCount`
    - `UpcomingTaskList.tsx`: list of upcoming tasks showing title and dueDate
    - `ReportsPage.tsx`: fetch from `report.service.ts` (10 s timeout); on error render error banner and no partial data; on success render all three components
    - _Requirements: 5.4, 5.5, 13.1_

  - [x] 13.11 Implement `MaintenancePage.tsx` with category and priority management
    - Two sections: Categorías and Prioridades, each with a list, create form, edit form, and delete button with `ConfirmDialog`
    - Call `maintenance.service.ts` for all CRUD operations; show `Notification` on success/error
    - Only reachable via `AdminRoute`
    - _Requirements: 6.1, 6.2, 13.1, 13.8, 13.9_

- [x] 14. Checkpoint — full-stack integration
  - Run frontend dev server against local backend; exercise all pages end-to-end (register → login → create/edit/delete tasks → filter → reports → maintenance as ADMIN). Ask the user if any questions arise.

- [ ] 15. Property-based tests — remaining properties
  - [ ]* 15.1 Write property test for error response shape
    - **Property 16: Error response shape is always consistent**
    - Throw arbitrary values through `error.middleware.ts`; assert every response contains exactly `status` (integer), `message` (non-empty string), `timestamp` (valid ISO 8601); assert no stack trace in production mode
    - **Validates: Requirements 9.2, 9.3**

- [x] 16. README and environment documentation
  - [x] 16.1 Write `README.md` at repository root
    - Architecture section: describe each layer (Frontend → API → Database) with its technology and how adjacent layers communicate
    - AWS section: document S3 + CloudFront, Elastic Beanstalk, RDS PostgreSQL; explain the CloudFront `/api/*` routing behaviour
    - Local setup section: step-by-step commands with observable success indicators for each step (install deps, run migrations, seed, start backend, start frontend)
    - Environment variables section: name, purpose, type/format, required/optional for each variable in `.env.example`
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; they correspond to tests and do not block core functionality.
- The 17 correctness properties from the design document are fully covered by property test sub-tasks 5.8, 5.9, 8.5, 8.6, 8.7, 9.4, 10.4, 15.1, and 3.4.
- All code is written in English; all user-visible UI text (labels, placeholders, notifications, error messages) is in Spanish.
- The strict layer rule (controller → service → repository → DB) is enforced by ESLint from task 1.3 onwards.
- Checkpoints at tasks 6, 11, and 14 provide incremental validation gates.
- Property tests use `fast-check` with `numRuns: 100` as defined in the design; tag each test with `// Feature: task-manager-app, Property <N>: <text>`.
- Implementation log: tasks 1–5 were executed by the Kiro agent. Kiro's monthly credit limit was reached at checkpoint 6, so tasks 6–14 and 16 were completed with Claude Code following this same spec (requirements.md / design.md) and checked against the steering rules. Task 3.2 was re-run against a real PostgreSQL database at that point. Optional test tasks (`*`) remain pending; the API was verified with an end-to-end smoke run covering every requirement's main acceptance criteria.

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "2.4", "2.5", "2.6"] },
    { "id": 2, "tasks": ["2.7", "3.1", "4.1", "4.2"] },
    { "id": 3, "tasks": ["3.2", "5.1", "5.5", "5.6", "5.7"] },
    { "id": 4, "tasks": ["3.3", "5.2"] },
    { "id": 5, "tasks": ["3.4", "5.3", "7.1"] },
    { "id": 6, "tasks": ["5.4", "7.2"] },
    { "id": 7, "tasks": ["5.8", "5.9", "5.10", "8.1"] },
    { "id": 8, "tasks": ["8.2"] },
    { "id": 9, "tasks": ["8.3", "9.1", "10.1"] },
    { "id": 10, "tasks": ["8.4", "9.2", "10.2"] },
    { "id": 11, "tasks": ["8.5", "8.6", "8.7", "8.8", "9.3", "10.3"] },
    { "id": 12, "tasks": ["9.4", "9.5", "10.4", "10.5", "12.1", "12.2", "12.3"] },
    { "id": 13, "tasks": ["13.1", "13.2", "13.3", "13.4"] },
    { "id": 14, "tasks": ["13.5", "13.6", "13.7", "13.8"] },
    { "id": 15, "tasks": ["13.9", "13.10", "13.11"] },
    { "id": 16, "tasks": ["15.1"] },
    { "id": 17, "tasks": ["16.1"] }
  ]
}
```
