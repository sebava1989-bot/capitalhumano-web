# FitPulse — Panel Admin (Dueño del Gym)

**Fecha:** 2026-04-16  
**Estado:** Aprobado por usuario

## Resumen

Panel web para el dueño del gimnasio. Acceso vía navegador en `fitpulse-admin.up.railway.app`. Layout sidebar + dashboard (opción A, aprobada).

## Stack

- **Frontend:** Next.js 14 + Tailwind CSS
- **Deploy:** Railway (mismo proyecto que backend)
- **Auth:** Email + contraseña (separado del login de miembros que usa RUT)

## Secciones del Panel

### 1. Dashboard (inicio)
- 4 stat cards: miembros activos, entrenamientos hoy, racha promedio, en riesgo de abandono
- Gráfico de barras: entrenamientos por día (últimos 7 días)
- Top 5 miembros del mes
- Alertas: miembros sin entrenar +7 días + actividad reciente

### 2. Miembros
- Tabla con: nombre, RUT, nivel, puntos, racha, último entreno, estado (activo/inactivo)
- Botón agregar miembro (nombre, RUT, contraseña inicial)
- Botón desactivar miembro
- Búsqueda por nombre o RUT

### 3. Rutinas
- Lista de rutinas del gym
- Crear rutina: nombre, día, ejercicios (nombre, series, reps, descanso)
- Editar / eliminar rutinas

### 4. Ranking
- Tabla del leaderboard del gimnasio (mismo que ve el miembro en la app)
- Filtro: este mes / todo el tiempo

### 5. Reportes
- Asistencia semanal (gráfico de líneas)
- Miembros más activos
- Días con más actividad

### 6. Alertas
- Lista de miembros en riesgo (sin entrenar 7+ días)
- Lista de miembros nuevos esta semana

## Diseño Visual

- Paleta: blanco + naranja FitPulse (`#FF4D00`) + grises Apple
- Sidebar fijo 220px con logo, nav, badge del gym
- Barra superior con nombre del gym y código
- Cards con borde sutil `#e5e7eb`, border-radius 16px
- Tipografía Inter

## Flujo de Auth

1. Dueño entra a URL del panel
2. Login con email + contraseña
3. JWT guardado en localStorage
4. Cada request lleva `Authorization: Bearer <token>`
5. El token identifica el `gym_code` → todas las queries filtran por ese código

## API Endpoints necesarios (backend)

- `POST /api/admin/login` — auth del dueño
- `GET /api/admin/dashboard` — stats del dashboard
- `GET /api/admin/members` — lista de miembros
- `POST /api/admin/members` — crear miembro
- `PATCH /api/admin/members/:id` — actualizar/desactivar
- `GET /api/admin/routines` — rutinas del gym
- `POST /api/admin/routines` — crear rutina
- `PUT /api/admin/routines/:id` — editar rutina
- `DELETE /api/admin/routines/:id` — eliminar rutina
- `GET /api/admin/ranking` — ranking del gym
- `GET /api/admin/reports` — datos de reportes
