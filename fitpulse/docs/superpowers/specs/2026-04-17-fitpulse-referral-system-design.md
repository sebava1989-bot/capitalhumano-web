# FitPulse — Sistema de Referidos por Redes Sociales

**Fecha:** 2026-04-17  
**Estado:** Aprobado

---

## Objetivo

Permitir que los miembros del gimnasio ganen puntos cuando refieren a nuevos socios. El miembro comparte su código único en redes sociales o WhatsApp. Cuando el admin registra al nuevo socio e ingresa ese código, el referidor recibe puntos automáticamente. El dueño configura cuántos puntos vale cada referido.

---

## Componentes

### 1. Backend (fitpulse-backend)

**Cambios en schema.sql:**

```sql
-- Agregar a tabla members
ALTER TABLE members ADD COLUMN referral_code VARCHAR(20) UNIQUE;
ALTER TABLE members ADD COLUMN referred_by INTEGER REFERENCES members(id);

-- Agregar a tabla gyms
ALTER TABLE gyms ADD COLUMN referral_points INTEGER DEFAULT 300;
```

**Generación del código:** Al crear un miembro, se genera automáticamente como `{gym_code}-{id_con_ceros}` (ej. `GYM01-0042`). Se almacena en la columna `referral_code`.

**Lógica de referido (en `routes/members.js` POST):**
1. Si el body incluye `referral_code`, buscar al miembro con ese código en el mismo `gym_code`
2. Si se encuentra, registrar `referred_by = referidor.id` en el nuevo miembro
3. Sumar `gyms.referral_points` a `members.points` del referidor y recalcular su `level`
4. Todo dentro de la misma transacción de creación del miembro

**Nuevos endpoints:**
- `GET /api/members/me/referral` — devuelve `{ referral_code, referral_count, points_earned_from_referrals }` (requiere auth de miembro)
- `GET /api/admin/referral-points` — devuelve `{ referral_points }` del gym actual (requiere adminAuth)
- `PATCH /api/admin/referral-points` — body `{ referral_points: number }` — actualiza la config del gym (requiere adminAuth)
- `GET /api/admin/referrals` — lista de referidos con quién refirió a quién y puntos entregados (requiere adminAuth)

---

### 2. Admin Panel (fitpulse-admin)

**Modal "Agregar Miembro"** (`app/dashboard/members/page.tsx`):
- Agregar campo opcional "Código de referido" al formulario
- El campo acepta texto libre (ej. `GYM01-0001`)
- Se envía como `referral_code` en el body del POST `/api/members`
- Si el backend devuelve un referidor en la respuesta, mostrar toast: "✅ Carlos Muñoz ganó 300 puntos por este referido"

**Tarjeta de Referidos en Dashboard** (`app/dashboard/page.tsx`):
- Nueva tarjeta en la sección inferior: "Referidos del mes"
- Muestra: total de referidos, puntos entregados, top referidor del mes
- Obtiene datos de `GET /api/admin/referrals`

**Configuración de puntos** (`app/dashboard/page.tsx` o nueva sección en el dashboard):
- Input numérico "Puntos por referido" con botón Guardar
- Llama a `PATCH /api/admin/referral-points`
- Se muestra junto a la tarjeta de referidos

---

### 3. App Flutter (alma-ai o fitpulse flutter)

**Pantalla / sección "Mi código"** en el perfil del miembro:
- Muestra el código único grande y legible (ej. `GYM01-0042`)
- Botón "Copiar código"
- Botón "Compartir" → abre share nativo del SO con mensaje:
  > "¡Únete a PowerGym con mi código GYM01-0042 y ambos ganamos puntos! 💪"
- Contador: "Has referido X socios — ganaste Y puntos"

**Datos:** se obtienen de `GET /api/members/me/referral` al abrir la pantalla.

---

## Flujo completo

```
Miembro A → comparte código GYM01-0042 en Instagram/WhatsApp
       ↓
Persona interesada contacta al gym
       ↓
Admin registra nuevo miembro en el panel
Admin ingresa "GYM01-0042" en campo "Código de referido"
       ↓
Backend: busca miembro con ese código → encuentra a Miembro A
Backend: suma referral_points a Miembro A (ej. 300 pts) en la misma transacción
Backend: registra referred_by en el nuevo miembro
       ↓
Panel muestra toast: "✅ Miembro A ganó 300 puntos"
App de Miembro A actualiza contador de referidos
```

---

## Restricciones

- Un miembro no puede referirse a sí mismo (validar `referidor.id !== nuevo_miembro.id` — imposible en la práctica pero se valida igual)
- El código de referido es case-insensitive en la búsqueda
- Si el código no existe, el miembro se crea igual sin error — solo sin referido
- Los puntos se otorgan una sola vez por miembro creado (no se puede cambiar el `referred_by` después)
- El campo `referral_points` en gyms acepta valores entre 50 y 2000

---

## Tablas afectadas

| Tabla | Cambio |
|-------|--------|
| `members` | + `referral_code VARCHAR(20) UNIQUE`, + `referred_by INTEGER` |
| `gyms` | + `referral_points INTEGER DEFAULT 300` |

No se crea tabla nueva. Las migraciones son `ALTER TABLE` seguros (columnas nullable con default).
