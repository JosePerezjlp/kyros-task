# Stack técnico

## Frontend (capa de presentación)
- React 18 + Vite + TypeScript
- React Router, Axios
- Recharts para gráficos del panel de reportes
- Estilos: Tailwind CSS

## Backend (capa de lógica de negocio / API)
- Node.js 20+ (Node.js 22 en Elastic Beanstalk) + Express + TypeScript
- API REST bajo el prefijo /api
- Autenticación JWT (bcrypt para hash de contraseñas)
- Validación de entradas con Zod
- Manejo centralizado de errores

## Datos (capa de persistencia)
- PostgreSQL
- Prisma ORM (migraciones y seed)

## Despliegue (AWS)
- Frontend: S3 + CloudFront
- Backend: AWS Elastic Beanstalk (Node.js)
- Base de datos: Amazon RDS for PostgreSQL
- CloudFront enruta /api/* hacia el backend, así todo queda bajo una única URL HTTPS.
- Configuración por variables de entorno (DATABASE_URL, JWT_SECRET, PORT). Nunca credenciales en el código.
- Scripts de despliegue en /infra (AWS CLI, perfil "kyros", región us-east-2).

## Convenciones
- Código en inglés; textos de la interfaz en español.
- Variables de entorno documentadas en .env.example.
