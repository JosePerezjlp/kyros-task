# Estructura del proyecto (arquitectura en capas)

/frontend                 -> Capa de presentación (React)
  /src/pages              -> Vistas (Login, Registro, Tareas, Reportes, Mantenimiento)
  /src/components         -> Componentes reutilizables
  /src/services           -> Llamadas HTTP a la API
  /src/context            -> Estado de autenticación

/backend                  -> Capa de lógica de negocio
  /src/routes             -> Definición de endpoints
  /src/controllers        -> Reciben la petición HTTP y responden
  /src/services           -> Reglas de negocio (no conocen Express)
  /src/repositories       -> Acceso a datos con Prisma (única capa que toca la BD)
  /src/middlewares        -> Auth JWT, roles, validación, errores
  /prisma                 -> schema.prisma, migraciones y seed

/docs                     -> Documentación de arquitectura y despliegue
README.md                 -> Arquitectura, decisiones técnicas, servicios AWS, cómo ejecutar

## Regla de capas
controller -> service -> repository -> base de datos.
Ninguna capa salta a otra que no sea la inmediatamente inferior.
