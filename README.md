# Gestor de Tareas — Prueba Técnica Especialista Kiro

Aplicación full stack de gestión de tareas (To-Do) con arquitectura en capas, construida con **Kiro** (spec-driven development) y desplegada en **AWS**.

- **URL en producción:** https://d2zifhbm8ulr4.cloudfront.net
- **Cuenta de prueba:** regístrate desde la propia app. El usuario ADMIN, que da acceso a Mantenimiento, lo crea el seed; sus credenciales se entregan aparte.

## Videos de la entrega

| Video | Enlace |
|---|---|
| Video 1: Demo en producción (parte 1) | [Ver en Google Drive](https://drive.google.com/file/d/1YzhXITFaF0Wu4rFj-Sl3AF5XYreFqCbO/view?usp=drive_link) |
| Video 1: Demo en producción (parte 2) | [Ver en Google Drive](https://drive.google.com/file/d/1ci50Gsk-ejoMbkqatqlVkjL1aSyRZATe/view?usp=drive_link) |
| Video 2: Código, arquitectura y uso de Kiro | [Ver en Google Drive](https://drive.google.com/file/d/130WrcSgD40oVs0RWS0dZQ_DmOOE9NA2G/view?usp=drive_link) |

## Funcionalidades

| Requisito de la prueba | Implementación |
|---|---|
| Alta, edición, baja y listado de tareas | Página **Tareas**: formulario de crear/editar, tarjetas con editar y eliminar (con confirmación) |
| Título, descripción, estado, fecha límite | Estados `pendiente / en progreso / completada`; fecha límite opcional; además categoría y prioridad |
| Filtro por estado y por fecha | Barra de filtros: estado + rango de fechas límite (desde/hasta), combinables |
| Registro e inicio de sesión | Email + contraseña (bcrypt), sesión con JWT de 24 h |
| Reporte | Página **Reportes**: gráfico por estado (Recharts), tareas vencidas y próximas a vencer (7 días) |
| Módulo de mantenimiento | Página **Mantenimiento** (solo ADMIN): alta, edición y baja de categorías y prioridades |

Reglas de negocio destacadas:
- Cada usuario solo ve y modifica sus propias tareas (403 si intenta acceder a una ajena).
- El primer usuario registrado es ADMIN; el seed crea además un ADMIN configurable.
- No se puede eliminar una categoría o prioridad asignada a alguna tarea (409).
- Los nombres de categorías y prioridades son únicos sin distinguir mayúsculas.
- Una tarea está **vencida** si su fecha límite ya pasó y no está completada.

## Arquitectura en capas

```mermaid
graph TB
    U[Navegador] -->|HTTPS| CF[CloudFront<br/>una única URL pública]
    CF -->|/*| S3[S3<br/>React SPA]
    CF -->|/api/*| EB[Elastic Beanstalk<br/>API Node.js / Express]
    subgraph API [Capa de lógica de negocio]
        R[routes + middlewares<br/>JWT · roles · Zod] --> C[controllers]
        C --> S[services<br/>reglas de negocio]
        S --> REP[repositories<br/>Prisma]
    end
    EB --- R
    REP -->|red privada VPC| RDS[(RDS PostgreSQL)]
```

| Capa | Tecnología | Responsabilidad | Servicio AWS |
|---|---|---|---|
| **Presentación** | React 18, Vite, TypeScript, Tailwind CSS, React Router, Axios, Recharts | Interfaz de usuario: formularios, listados, filtros, gráficos y control de acceso por rol en la navegación | **S3** (archivos estáticos) + **CloudFront** (HTTPS, CDN, enrutamiento) |
| **Lógica de negocio (API REST)** | Node.js 20+ (Node.js 22 en producción), Express, TypeScript, Zod, JWT, bcrypt | Autenticación, autorización, validación de entradas y reglas de negocio | **Elastic Beanstalk** (plataforma Node.js 20) |
| **Datos** | PostgreSQL 17, Prisma ORM (migraciones + seed) | Persistencia relacional de usuarios, tareas, categorías y prioridades | **RDS for PostgreSQL** (no accesible públicamente) |

### Capas dentro del backend

```
routes → controllers → services → repositories → base de datos
```

- **routes / middlewares:** definen los endpoints y aplican, en orden, autenticación JWT, control de rol ADMIN y validación con Zod.
- **controllers:** traducen HTTP ↔ servicio. No contienen reglas de negocio ni acceden a la base de datos.
- **services:** reglas de negocio (propiedad de tareas, unicidad, bloqueo de borrado en uso, cálculo de reportes). No importan Express.
- **repositories:** única capa que usa Prisma.

La separación no es solo una convención: **ESLint falla** si un controller o service importa Prisma, o si un service importa Express (`backend/.eslintrc.js`).

### Flujo de una petición en producción

1. El navegador abre `https://<dominio>.cloudfront.net`.
2. CloudFront sirve la SPA desde S3. Una *CloudFront Function* reescribe las rutas del frontend (`/tasks`, `/reports`…) a `/index.html`, para que React Router funcione al recargar la página sin afectar a la API.
3. Las llamadas a `/api/*` se reenvían a Elastic Beanstalk, sin caché y conservando la cabecera `Authorization`.
4. La API valida el JWT y los datos, aplica las reglas y consulta RDS a través de la red privada de la VPC.

Como frontend y API comparten el mismo dominio, no hay problemas de CORS ni de contenido mixto HTTP/HTTPS.

## Decisiones técnicas

| Decisión | Motivo |
|---|---|
| **Spec-driven con Kiro** (requirements → design → tasks) | Los requisitos se escribieron en formato EARS con criterios de aceptación verificables; el diseño y el plan de tareas se derivan de ellos y quedan versionados en `.kiro/specs/`. |
| **Steering files** (`.kiro/steering/`) | Fijan el producto, el stack y la regla de capas para que todo el código generado siga las mismas convenciones. |
| **PostgreSQL + Prisma** | Los datos son relacionales (tarea → usuario, categoría, prioridad) y necesitan integridad referencial; Prisma aporta tipado y migraciones versionadas. |
| **JWT sin estado** | La API no guarda sesiones, así que puede escalar horizontalmente en Elastic Beanstalk sin almacenamiento compartido. |
| **Zod en middleware** | Toda entrada se valida antes de llegar al controller; los errores devuelven la lista de campos inválidos. |
| **Manejo centralizado de errores** | Todas las respuestas de error tienen la forma `{ status, message, timestamp }`; en producción no se exponen trazas. |
| **CloudFront con dos orígenes** | Una sola URL HTTPS para todo, sin CORS y con certificado gestionado por AWS. |
| **Elastic Beanstalk** | Despliegue de Node.js gestionado (instancias, health checks, logs, variables de entorno) sin administrar servidores. |
| **Migraciones y seed al arrancar** | Cada despliegue deja el esquema al día (`prisma migrate deploy`) y garantiza los datos maestros sin pasos manuales; el seed es idempotente. |
| **CloudFront Function para el SPA** | Las *custom error responses* de CloudFront afectan a toda la distribución y convertirían los 404 de la API en HTML. La función reescribe solo las rutas del frontend. |
| **RDS privado** | La base de datos solo acepta conexiones desde el grupo de seguridad del backend. |
| **Fechas límite como día calendario (UTC)** | La fecha límite es un día, no un instante; se guarda como medianoche UTC y se compara por día, para evitar desfases por zona horaria. |

## API REST

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/health` | Público |
| POST | `/api/auth/register`, `/api/auth/login` | Público |
| GET, POST | `/api/tasks` (filtros: `status`, `start_date`, `end_date`) | Usuario autenticado |
| GET, PATCH, DELETE | `/api/tasks/:id` | Dueño de la tarea |
| GET | `/api/reports` | Usuario autenticado |
| GET | `/api/categories`, `/api/priorities` | Usuario autenticado (desplegables) |
| GET, POST, GET/:id, PATCH/:id, DELETE/:id | `/api/admin/categories`, `/api/admin/priorities` | Solo ADMIN |

El detalle completo (formatos de respuesta, códigos de error y modelo de datos) está en [`.kiro/specs/task-manager-app/design.md`](.kiro/specs/task-manager-app/design.md).

## Ejecución local

Requisitos: Node.js 20+, PostgreSQL en ejecución.

| Paso | Comando | Señal de éxito |
|---|---|---|
| 1. Instalar dependencias | `npm install` (en la raíz) | Termina sin errores |
| 2. Configurar variables | Copiar `.env.example` a `backend/.env` y completar los valores | — |
| 3. Crear las tablas | `cd backend && npx prisma migrate deploy` | `All migrations have been successfully applied` |
| 4. Datos iniciales | `npx prisma db seed` | `[seed] ADMIN user created: …` |
| 5. Arrancar la API | `npm run dev` (en `backend/`) | `[server] Listening on port 3000` |
| 6. Arrancar el frontend | `npm run dev` (en `frontend/`) | Vite muestra `http://localhost:5173` |

En desarrollo, Vite reenvía `/api` a `http://localhost:3000`, igual que hace CloudFront en producción.

### Variables de entorno

| Variable | Obligatoria | Formato | Uso |
|---|---|---|---|
| `DATABASE_URL` | Sí | `postgresql://USER:PASS@HOST:5432/DB` | Conexión de Prisma a PostgreSQL |
| `JWT_SECRET` | Sí | Texto largo aleatorio | Firma y verificación de los JWT |
| `PORT` | Sí | Número | Puerto de la API (Elastic Beanstalk usa 8080) |
| `ADMIN_EMAIL` | Para el seed | Email | Usuario ADMIN inicial |
| `ADMIN_PASSWORD` | Para el seed | Texto (mín. 8) | Contraseña del ADMIN inicial |
| `NODE_ENV` | No | `production` / `development` | En producción oculta las trazas de error |
| `CORS_ORIGIN` | No | Orígenes separados por comas | Solo si el frontend se sirve desde otro dominio |

La API se niega a arrancar, e indica qué variable falta, si no están definidas las obligatorias.

## Despliegue en AWS

Región: **us-east-2 (Ohio)**. Todo el tráfico entra por una única URL HTTPS de CloudFront.

| Capa | Servicio AWS | Recurso | Configuración |
|---|---|---|---|
| Presentación | **Amazon S3** | `kyros-frontend-<cuenta>` | Bucket privado (Block Public Access activo); solo CloudFront puede leerlo mediante Origin Access Control |
| Presentación | **Amazon CloudFront** | `d2zifhbm8ulr4.cloudfront.net` | Comportamiento por defecto → S3 (caché optimizada, HTTPS obligatorio, CloudFront Function `kyros-spa-rewrite` para las rutas del SPA). Comportamiento `/api/*` → Elastic Beanstalk (sin caché, reenvía todas las cabeceras excepto `Host`, todos los métodos HTTP) |
| Lógica de negocio | **AWS Elastic Beanstalk** | App `kyros-task-manager`, entorno `kyros-api-prod` | Node.js 22 en Amazon Linux 2023, instancia única `t3.micro`, health check en `/api/health`, variables de entorno como propiedades del entorno. Al arrancar ejecuta `prisma migrate deploy`, el seed (idempotente) y la API |
| Datos | **Amazon RDS for PostgreSQL** | `kyros-db` | PostgreSQL 17, `db.t4g.micro`, 20 GB gp3 cifrados, backups diarios, **sin acceso público**; su grupo de seguridad solo admite el puerto 5432 desde el grupo de seguridad de la API. Conexión con TLS (`sslmode=require`) |
| Soporte | **IAM** | Roles `aws-elasticbeanstalk-ec2-role` y `aws-elasticbeanstalk-service-role`; usuario `kyros-deployer` para la CLI | — |
| Soporte | **Amazon S3** | `kyros-deploy-<cuenta>` | Paquetes de versiones del backend |

### Cómo se despliega

Los scripts de `infra/` usan la AWS CLI con el perfil `kyros`:

```powershell
# Backend: compila, empaqueta (dist + prisma + Procfile), sube a S3 y publica una nueva versión en Elastic Beanstalk
powershell -File infra/deploy-backend.ps1

# Frontend: compila el SPA, sincroniza con S3 (assets con caché larga, index.html sin caché) e invalida CloudFront
powershell -File infra/deploy-frontend.ps1 -DistributionId E2O0LHJRANRZTX
```

Los secretos de producción (contraseña de RDS, `JWT_SECRET` y credenciales del ADMIN) se generaron aleatoriamente. Están en `infra/.secrets.env`, excluido de Git, y en las propiedades del entorno de Elastic Beanstalk. Nunca están en el código.

### Verificación

La misma prueba end-to-end que se usó en local se ejecutó contra la URL de CloudFront: 30 de 30 comprobaciones correctas. Cubre registro, login, CRUD, filtros, reportes, permisos (401/403), validaciones (400), conflictos (409) y mantenimiento.

### Mejoras posibles para un entorno real

- Restringir el puerto 80 de la instancia al *prefix list* de orígenes de CloudFront, para que la API solo sea accesible a través de CloudFront.
- Validar el certificado de RDS con el bundle de CA de AWS, en lugar de solo cifrar la conexión.
- Guardar los secretos en AWS Secrets Manager.
- Usar un entorno con balanceador y autoscaling, Multi-AZ en RDS y un dominio propio con certificado de ACM.
- Pipeline de CI/CD (GitHub Actions) que ejecute lint, build y los scripts de despliegue.

## Uso de Kiro en este proyecto

- **Steering** (`.kiro/steering/`): `product.md` (producto y reglas de negocio), `tech.md` (stack y despliegue) y `structure.md` (estructura y regla de capas).
- **Spec** (`.kiro/specs/task-manager-app/`):
  - `requirements.md`: 15 requisitos con historias de usuario y criterios de aceptación EARS. Se refinó en varias iteraciones: se corrigió una contradicción entre categorías como texto libre y datos maestros, y se añadieron interfaz, seed y despliegue.
  - `design.md`: arquitectura, endpoints, modelo Prisma, manejo de errores y 17 propiedades de corrección.
  - `tasks.md`: plan de implementación en 16 tareas con checkpoints.
- **Ejecución:** las tareas 1 a 5 (estructura del proyecto, infraestructura Express, Prisma y autenticación) las implementó el agente de Kiro. Al agotarse los créditos del plan gratuito en el checkpoint 6, el resto de tareas se completó con Claude Code siguiendo el mismo spec. Queda registrado en `tasks.md`.
- **Pendiente (opcional en el plan):** los tests automatizados marcados con `*`. La API se verificó con una prueba end-to-end que recorre los criterios de aceptación principales: autenticación, CRUD, filtros, reportes, permisos y mantenimiento.
