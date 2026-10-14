# Producto: Gestor de Tareas (To-Do)

Aplicación web para que usuarios registrados gestionen sus tareas personales.

## Funcionalidades
- Registro e inicio de sesión (autenticación con email y contraseña).
- CRUD de tareas: título, descripción, estado (pendiente / en progreso / completada), fecha límite, categoría y prioridad.
- Filtros de tareas por estado y por rango de fechas.
- Panel de reportes: cantidad de tareas por estado, tareas vencidas y próximas a vencer (7 días).
- Módulo de mantenimiento (solo rol ADMIN): CRUD de categorías y prioridades (datos maestros).

## Reglas de negocio
- Cada usuario solo ve y modifica sus propias tareas.
- El título es obligatorio (máx. 120 caracteres).
- Una tarea está "vencida" si su fecha límite ya pasó y su estado no es "completada".
- No se puede eliminar una categoría o prioridad que esté en uso por alguna tarea.
- El primer usuario registrado o uno sembrado por seed tiene rol ADMIN.
