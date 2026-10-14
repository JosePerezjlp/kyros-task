# Requirements Document

## Introduction

Aplicación web full stack de gestión de tareas (To-Do) con arquitectura en capas. Permite a usuarios registrados crear, visualizar, editar y eliminar sus propias tareas, filtrarlas por estado y fecha, y consultar un panel de reportes con resúmenes de actividad. Los usuarios con rol ADMIN disponen además de un módulo de mantenimiento para gestionar los datos maestros (categorías y prioridades). El sistema se despliega en AWS con frontend en S3 + CloudFront, backend en Elastic Beanstalk y base de datos en RDS PostgreSQL.

## Glossary

- **System**: La aplicación web de gestión de tareas en su conjunto.
- **API**: El servidor REST implementado con Node.js 20 + Express + TypeScript.
- **Frontend**: La aplicación React 18 + Vite + TypeScript servida desde S3/CloudFront.
- **Auth_Service**: El servicio de autenticación que emite y valida tokens JWT.
- **Task_Service**: El servicio de lógica de negocio que gestiona el ciclo de vida de las tareas.
- **Report_Service**: El servicio que calcula y devuelve los datos del panel de reportes.
- **Maintenance_Service**: El servicio que gestiona los datos maestros (categorías y prioridades).
- **Repository**: La capa de acceso a datos implementada con Prisma ORM sobre PostgreSQL.
- **JWT**: JSON Web Token utilizado como mecanismo de autenticación sin estado.
- **ADMIN**: Rol de usuario con permisos completos sobre el módulo de mantenimiento.
- **USER**: Rol estándar con acceso únicamente a sus propias tareas.
- **Task**: Entidad principal con los campos: título, descripción, estado, fecha límite, categoría y prioridad.
- **Status**: Estado de una tarea: `pending` (pendiente), `in_progress` (en progreso) o `done` (completada).
- **Overdue_Tasks**: Tareas cuya fecha límite ya pasó y cuyo estado no es `done`.
- **Category**: Dato maestro con un identificador único (`id`) que clasifica una tarea temáticamente; gestionado por el módulo de mantenimiento (rol ADMIN).
- **Priority**: Dato maestro con un identificador único (`id`) que indica la urgencia de una tarea; gestionado por el módulo de mantenimiento (rol ADMIN).

---

## Requirements

### Requirement 1: Registro de usuario

**User Story:** As a visitor, I want to register with email and password, so that I can access the task management application.

#### Acceptance Criteria

1. WHEN a visitor submits a registration form with a unique email and a password, THE Auth_Service SHALL create a new user account with role `USER` and return a JWT valid for 24 hours.
2. IF a visitor submits a registration form with an email already registered, THEN THE Auth_Service SHALL return an HTTP 409 error with a message indicating that the email address is already in use.
3. THE Auth_Service SHALL store passwords as a bcrypt hash with a minimum cost factor of 10; plain-text passwords SHALL never be persisted.
4. WHEN the first user account is created in an empty database, THE Auth_Service SHALL assign the role `ADMIN` to that account.
5. IF a registration request omits the email or the password, contains a malformed email address, or contains a password shorter than 8 characters, THEN THE Auth_Service SHALL return an HTTP 400 error listing each invalid or missing field by name.

---

### Requirement 2: Inicio de sesión

**User Story:** As a registered user, I want to log in with my email and password, so that I can access my tasks securely.

#### Acceptance Criteria

1. WHEN a user submits a registered email address and a matching password, THE Auth_Service SHALL return a JWT containing the user's identifier and role, with an expiry of exactly 24 hours from the moment of issuance.
2. IF a user submits an unrecognized email or an incorrect password, THEN THE Auth_Service SHALL return an HTTP 401 error with a generic message that does not reveal which field was wrong.
3. WHILE a user holds a valid JWT, THE Frontend SHALL include it as a Bearer token in every request to protected API endpoints.
4. WHEN a user's JWT expires or WHEN the API returns an HTTP 401 response due to an invalid or expired JWT, THE Frontend SHALL discard the stored JWT and redirect the user to the login page.

---

### Requirement 3: Gestión de tareas (CRUD)

**User Story:** As a logged-in user, I want to create, view, edit, and delete my tasks, so that I can manage my personal workload.

#### Acceptance Criteria

1. WHEN an authenticated user submits a new task with a title between 1 and 120 characters and a description of at most 500 characters, THE Task_Service SHALL create the task, associate it with the authenticated user, and return the created task with HTTP 201; `categoryId` and `priorityId` are optional fields on task creation and SHALL be omitted or set to null when not provided.
2. IF an authenticated user submits a new task with no title or a title longer than 120 characters, or a description longer than 500 characters, THEN THE Task_Service SHALL return an HTTP 400 error indicating which field constraint was violated. IF a provided `categoryId` does not correspond to an existing Category, or a provided `priorityId` does not correspond to an existing Priority, THEN THE Task_Service SHALL return an HTTP 400 error identifying the non-existent reference.
3. THE Task_Service SHALL assign the default status `pending` to every newly created task.
4. WHEN an authenticated user requests the task list, THE Task_Service SHALL return only the tasks owned by that user.
5. WHEN an authenticated user updates a task, THE Task_Service SHALL allow modifying only the fields provided in the request — preserving all omitted fields unchanged — from the following editable fields: title (1–120 characters), description (at most 500 characters), status (one of `pending`, `in_progress`, or `done`), due date, categoryId (optional, must reference an existing Category), and priorityId (optional, must reference an existing Priority); the task owner association SHALL remain unchanged.
6. IF an authenticated user submits an update with a title that is empty or exceeds 120 characters, a description exceeding 500 characters, or a status value outside `pending`, `in_progress`, or `done`, THEN THE Task_Service SHALL return an HTTP 400 error indicating which field constraint was violated without modifying the task. IF a provided `categoryId` or `priorityId` does not reference an existing entity, THEN THE Task_Service SHALL return an HTTP 400 error without modifying the task.
7. IF an authenticated user attempts to read, update, or delete a task owned by another user, THEN THE Task_Service SHALL return an HTTP 403 error.
8. WHEN an authenticated user deletes a task, THE Task_Service SHALL permanently remove it and return HTTP 204.

---

### Requirement 4: Filtrado de tareas

**User Story:** As a logged-in user, I want to filter my tasks by status and by date range, so that I can focus on what matters at any given moment.

#### Acceptance Criteria

1. WHEN an authenticated user requests the task list with a `status` query parameter, THE Task_Service SHALL return only the tasks of that user whose status exactly matches one of the accepted values: `pending`, `in_progress`, or `done` (case-sensitive).
2. WHEN an authenticated user requests the task list with both `start_date` and `end_date` query parameters in ISO 8601 date format (YYYY-MM-DD), THE Task_Service SHALL return only the tasks of that user whose due date falls within the inclusive range `[start_date, end_date]`.
3. WHEN an authenticated user applies both `status` and a date range simultaneously, THE Task_Service SHALL return only the tasks that satisfy both filters at the same time.
4. IF a filter parameter contains an unrecognized `status` value, a date value not in YYYY-MM-DD format, only one of `start_date` or `end_date` is provided, or `start_date` is later than `end_date`, THEN THE Task_Service SHALL return an error response indicating which parameter is invalid and the reason for rejection, without returning any task data.

---

### Requirement 5: Panel de reportes

**User Story:** As a logged-in user, I want to see a summary panel of my tasks, so that I can quickly assess the state of my work.

#### Acceptance Criteria

1. WHEN an authenticated user requests the report, THE Report_Service SHALL return the count of the user's tasks grouped by each of the three statuses (`pending`, `in_progress`, `done`), returning a count of 0 for any status with no matching tasks.
2. WHEN an authenticated user requests the report, THE Report_Service SHALL return the count of the user's Overdue_Tasks (tasks whose due date is before the current date and whose status is not `done`).
3. WHEN an authenticated user requests the report, THE Report_Service SHALL return the count and the list of the user's tasks whose due date falls within the range of today through the end of the 7th calendar day from today (inclusive) and whose status is not `done`.
4. WHEN the Frontend receives a successful report response, THE Frontend SHALL render the task-count-by-status data as a bar or pie chart using Recharts, the overdue count as a numeric summary card, and the upcoming tasks as a list with each task's title and due date.
5. IF the Report_Service returns an error or does not respond within 10 seconds, THEN THE Frontend SHALL display an error message indicating the report could not be loaded and SHALL NOT render partial report data.

---

### Requirement 6: Módulo de mantenimiento — Categorías y Prioridades

**User Story:** As an ADMIN user, I want to manage categories and priorities, so that all users have consistent options when creating tasks.

#### Acceptance Criteria

1. WHEN an authenticated user with role `ADMIN` submits a valid create, read, update, or delete request for a category or priority, THE Maintenance_Service SHALL process the request and return a success response.
2. IF an authenticated user without role `ADMIN` attempts to access any maintenance endpoint, THEN THE API SHALL return an HTTP 403 error.
3. IF an ADMIN user attempts to delete a category that is currently assigned to at least one task, THEN THE Maintenance_Service SHALL return an HTTP 409 error with a message indicating that the category is in use.
4. IF an ADMIN user attempts to delete a priority that is currently assigned to at least one task, THEN THE Maintenance_Service SHALL return an HTTP 409 error with a message indicating that the priority is in use.
5. IF an ADMIN user attempts to create or update a category or priority with a name that already exists (case-insensitive) for the same entity type, THEN THE Maintenance_Service SHALL return an HTTP 409 error indicating the duplicate name.
6. IF an ADMIN user submits a create or update request for a category or priority where the name is absent, empty, or consists only of whitespace, or where the name exceeds 100 characters, THEN THE Maintenance_Service SHALL return an HTTP 400 error indicating the invalid name.

---

### Requirement 7: Autenticación y autorización en la API

**User Story:** As a system operator, I want all API endpoints (except registration and login) to require a valid JWT, so that only authenticated users can access resources.

#### Acceptance Criteria

1. WHEN a request reaches any API endpoint other than `POST /api/auth/register` or `POST /api/auth/login`, THE API SHALL validate the Bearer JWT in the `Authorization` header by checking structural integrity (three Base64url-encoded segments), verifying the signature against the configured `JWT_SECRET`, and confirming the `exp` claim is in the future.
2. IF a request to a protected endpoint carries no token or a token that does not conform to the three-segment JWT structure, THEN THE API SHALL return an HTTP 401 error.
3. IF a request to a protected endpoint carries a JWT whose `exp` claim is in the past, THEN THE API SHALL return an HTTP 401 error.
4. IF a request to any `/api/admin/` endpoint is made by a user whose JWT contains a role other than `ADMIN`, THEN THE API SHALL return an HTTP 403 error with a message indicating insufficient permissions.

---

### Requirement 8: Validación de entradas en la API

**User Story:** As a system operator, I want all incoming API payloads to be validated before processing, so that the system rejects malformed data early and maintains data integrity.

#### Acceptance Criteria

1. THE API SHALL validate all incoming request bodies and query parameters against their defined Zod schemas on every request.
2. IF a request body is absent, or a request body or query parameter fails Zod schema validation due to missing required fields or type and constraint violations, THEN THE API SHALL return an HTTP 400 response whose body contains a list of one or more error entries, each specifying the field name and a description of why it failed validation.
3. IF THE API returns an HTTP 400 validation error, THEN THE API SHALL not create, update, or delete any data as a result of that request.

---

### Requirement 9: Manejo centralizado de errores

**User Story:** As a system operator, I want the API to handle all errors in a consistent and centralized way, so that clients always receive structured, predictable error responses.

#### Acceptance Criteria

1. THE API SHALL provide a single Express error-handling middleware that intercepts all unhandled errors thrown by controllers, services, and repositories.
2. WHEN an unhandled error is caught, THE API SHALL return a JSON response containing exactly the fields `status` (integer HTTP status code), `message` (non-empty string describing the error), and `timestamp` (ISO 8601 datetime of when the error occurred).
3. IF an unhandled error occurs in a production environment, THEN THE API SHALL log the full stack trace server-side and return a response with `message` set to a fixed string that does not include stack traces, file paths, or internal variable values.
4. IF an unhandled error occurs in a non-production environment, THEN THE API SHALL include the full stack trace in the `message` or a dedicated `stack` field of the JSON error response.
5. WHEN a request is made to a route not defined in the API, THE API SHALL return a JSON error response with `status` 404 and a `message` indicating the route was not found.

---

### Requirement 10: Seguridad y variables de entorno

**User Story:** As a system operator, I want all sensitive configuration to be managed through environment variables, so that no credentials are ever stored in the source code.

#### Acceptance Criteria

1. THE System SHALL read `DATABASE_URL`, `JWT_SECRET`, and `PORT` exclusively from environment variables; these values SHALL never appear hard-coded in any application source or configuration file committed to version control.
2. THE System SHALL provide a `.env.example` file documenting every required environment variable (at minimum `DATABASE_URL`, `JWT_SECRET`, and `PORT`) with non-empty, non-functional placeholder values and a description of each variable's purpose.
3. IF a required environment variable is absent at startup, THEN THE API SHALL log an error message that identifies the name of the missing variable and exit with a non-zero code before accepting any connections.

---

### Requirement 11: Arquitectura en capas del backend

**User Story:** As a developer, I want the backend to follow a strict layered architecture (controller → service → repository → database), so that each concern is isolated and maintainable independently.

#### Acceptance Criteria

1. THE API SHALL implement a controller layer that receives HTTP requests, delegates business logic to the service layer, and returns HTTP responses; controllers SHALL NOT import or call repository layer modules directly.
2. THE API SHALL implement a service layer that contains all input validation and business rule processing and delegates data access exclusively to the repository layer; services SHALL NOT import Express objects (`Request`, `Response`, `NextFunction`, or `Router`).
3. THE API SHALL implement a repository layer that is the only layer allowed to import and use Prisma; all database queries SHALL be encapsulated in repository functions.
4. IF any code in the controller or service layers attempts to import Prisma directly, or any code in the service layer imports Express objects, THEN the project's linting configuration SHALL fail the lint check.

---

### Requirement 12: Documentación y README

**User Story:** As a developer or operator, I want a comprehensive README file, so that I can understand the architecture, technical decisions, and AWS services used, and know how to run the project locally.

#### Acceptance Criteria

1. THE System SHALL include a `README.md` at the repository root that documents the layered architecture (Frontend → API → Database), with each layer's technology, its role in the data flow, and how it communicates with adjacent layers.
2. THE README SHALL document each AWS service used: S3 + CloudFront for the frontend, Elastic Beanstalk for the backend, and RDS PostgreSQL for the database, explicitly stating that CloudFront routes `/api/*` requests to the backend and all other requests to the S3 bucket.
3. THE README SHALL include step-by-step instructions for running the project locally, where each step specifies the exact command to run and the observable success indicator (e.g., "Run `npx prisma migrate dev` — Prisma prints 'All migrations have been applied'").
4. THE README SHALL document each environment variable in `.env.example` with its name, purpose, expected type or format, and whether it is required or optional.

---

### Requirement 13: Interfaz de usuario (Frontend)

**User Story:** As a logged-in user, I want a clear and consistent web interface, so that I can manage my tasks, view reports, and access maintenance tools without friction.

#### Acceptance Criteria

1. THE Frontend SHALL provide the following pages: Login, Registro, Lista de Tareas, Reportes, and Mantenimiento.
2. WHEN an authenticated user with role `USER` is logged in, THE Frontend SHALL display the navigation menu without the Mantenimiento option; WHEN the authenticated user has role `ADMIN`, THE Frontend SHALL display the Mantenimiento option in the navigation menu.
3. WHEN an authenticated user opens the Lista de Tareas page, THE Frontend SHALL display a form to create a new task with input fields for title, description, due date, and dropdown selectors for category and priority populated from the API.
4. WHEN an authenticated user selects to edit a task, THE Frontend SHALL populate the edit form with the task's current values, including the selected category and priority from their respective dropdowns.
5. WHEN an authenticated user clicks the delete button on a task, THE Frontend SHALL display a confirmation dialog before sending the delete request; THE Frontend SHALL only call the delete API endpoint after the user confirms.
6. WHEN an authenticated user is on the Lista de Tareas page, THE Frontend SHALL provide filter controls for status (dropdown with values `pending`, `in_progress`, `done`) and date range (two date pickers for `start_date` and `end_date`).
7. THE Frontend SHALL fetch the list of available categories and priorities from the API using a read-only endpoint accessible to any authenticated user, and SHALL use these lists to populate all category and priority dropdowns throughout the application.
8. WHEN an API call succeeds (create, update, delete), THE Frontend SHALL display a success notification to the user.
9. WHEN an API call returns an error, THE Frontend SHALL display the error message returned by the API in a visible, non-blocking notification.

---

### Requirement 14: Datos iniciales (seed)

**User Story:** As a system operator, I want the database to be seeded with initial master data and an ADMIN user, so that the application is usable immediately after deployment without manual setup.

#### Acceptance Criteria

1. WHEN the seed script is executed, THE System SHALL create the following default categories if they do not already exist: "Trabajo", "Personal", and "Estudio".
2. WHEN the seed script is executed, THE System SHALL create the following default priorities if they do not already exist: "Alta", "Media", and "Baja".
3. WHEN the seed script is executed, THE System SHALL create an ADMIN user with the email address read from the `ADMIN_EMAIL` environment variable and the password read from the `ADMIN_PASSWORD` environment variable, hashed with bcrypt at a minimum cost factor of 10, if no user with that email already exists.
4. IF `ADMIN_EMAIL` or `ADMIN_PASSWORD` is absent when the seed script is executed, THEN THE seed script SHALL log an error identifying the missing variable and exit with a non-zero code without creating any data.
5. THE `.env.example` file SHALL include `ADMIN_EMAIL` and `ADMIN_PASSWORD` as required variables with placeholder values and descriptions.

---

### Requirement 15: Despliegue en AWS

**User Story:** As a system operator, I want the application to be accessible via a single public HTTPS URL, so that users do not need to know about the underlying infrastructure.

#### Acceptance Criteria

1. THE System SHALL be accessible to end users via a single public HTTPS URL provided by AWS CloudFront.
2. WHEN CloudFront receives a request whose path begins with `/api/`, THE CloudFront distribution SHALL forward the request to the backend running on AWS Elastic Beanstalk.
3. WHEN CloudFront receives a request whose path does not begin with `/api/`, THE CloudFront distribution SHALL serve the response from the S3 bucket hosting the compiled frontend assets.
4. THE backend SHALL connect to the database using the `DATABASE_URL` environment variable pointing to an Amazon RDS for PostgreSQL instance; the RDS instance SHALL NOT be publicly accessible.
5. THE API SHALL expose a `GET /api/health` endpoint that returns HTTP 200 with a JSON body `{ "status": "ok" }` without requiring authentication; this endpoint SHALL be used as the health check target for the Elastic Beanstalk environment.
