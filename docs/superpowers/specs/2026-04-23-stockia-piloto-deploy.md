# StockIA — Piloto Deploy + Demo Agrícola Design Spec

**Fecha:** 2026-04-23  
**Estado:** Aprobado

## Objetivo

Dejar StockIA completamente desplegado en producción con datos demo realistas de un campo agrícola, listo para mostrar a un primer cliente. Incluye panel web admin accesible por URL pública, backend en Railway, base de datos Supabase prod, y APK Flutter instalada en el dispositivo del bodeguero.

---

## Arquitectura

| Componente | Plataforma | URL |
|---|---|---|
| Backend API | Railway | `https://stockia-api.railway.app/v1` |
| Panel web admin | Vercel | `https://stockia-web.vercel.app` |
| Base de datos | Supabase (prod) | connection string de Supabase |
| App bodeguero | APK Android | instalada en Xiaomi 14T |

---

## Flujo de preparación

1. **Supabase prod** — correr `node src/db/migrate.js` apuntando al DB de producción para crear todas las tablas
2. **Railway** — deploy desde repo GitHub, configurar variables de entorno
3. **Vercel** — deploy del panel web, `NEXT_PUBLIC_API_URL` apunta a Railway
4. **Seed demo** — `npm run seed:demo` crea el tenant completo
5. **APK Flutter** — cambiar `baseUrl` a URL de Railway, compilar e instalar

---

## Variables de entorno Railway

```
DATABASE_URL=<supabase prod connection string>
JWT_SECRET=<secret seguro>
NODE_ENV=production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=contacto@tuamigospa.cl
SMTP_PASS=<app-password>
SMTP_FROM=StockIA <contacto@tuamigospa.cl>
```

## Variables de entorno Vercel

```
NEXT_PUBLIC_API_URL=https://stockia-api.railway.app/v1
```

---

## Tenant demo

**Nombre:** AgriDemo SpA  
**Email:** admin@agridemo.cl

### Usuarios

| Email | Contraseña | Rol |
|---|---|---|
| admin@agridemo.cl | Demo2026! | admin |
| bodeguero@agridemo.cl | Demo2026! | bodeguero |

### Bodegas

- Bodega Central (km 12, Ruta 5 Sur)
- Bodega Campo Norte

### Productos (15)

| Nombre | SKU | Unidad | Stock mín | Cantidad inicial |
|---|---|---|---|---|
| Semilla Trigo Invernal | SEM-TRI | saco | 20 | 85 |
| Semilla Maíz Híbrido | SEM-MAI | saco | 15 | 42 |
| Fertilizante NPK 15-15-15 | FER-NPK | saco | 30 | 12 |
| Urea 46% | FER-URE | saco | 25 | 8 |
| Herbicida Glifosato 48% | HER-GLI | litro | 50 | 180 |
| Fungicida Mancozeb | FUN-MAN | kilo | 20 | 55 |
| Insecticida Clorpirifos | INS-CLO | litro | 10 | 28 |
| Aceite Motor Tractor | ACE-MOT | litro | 20 | 60 |
| Combustible Diesel | COM-DIE | litro | 500 | 1200 |
| Manguera de Riego 1" | MAN-RIE | metro | 100 | 450 |
| Alambre Galvanizado 14G | ALA-14G | rollo | 10 | 22 |
| Sacos de Polipropileno | SAC-POL | unidad | 200 | 750 |
| Guantes de Cuero | GUA-CUE | par | 10 | 18 |
| Mascarilla Antipolvo | MAS-POL | unidad | 20 | 35 |
| Bomba de Mochila 16L | BOM-16L | unidad | 2 | 3 |

Nota: Fertilizante NPK (stock 12 < mín 30) y Urea 46% (stock 8 < mín 25) aparecen en alertas críticas desde el primer login.

### Movimientos históricos (~20)

Registrados con fechas de los últimos 7 días usando responsables "Juan Pérez" y "Carlos Soto" para que el reporte PDF tenga datos reales en las secciones de comparativo y top responsables.

Ejemplos:
- Salida Herbicida Glifosato 48% × 20L — Juan Pérez (hace 6 días)
- Salida Combustible Diesel × 300L — Carlos Soto (hace 5 días)
- Entrada Semilla Trigo Invernal × 30 sacos — Juan Pérez (hace 4 días)
- Salida Fertilizante NPK × 18 sacos — Carlos Soto (hace 3 días)
- Salida Urea 46% × 17 sacos — Juan Pérez (hace 2 días)
- (y otros hasta completar ~20)

---

## Archivos nuevos / modificados

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `scripts/seed-demo.js` | Crear | Script idempotente que crea tenant demo completo |
| `package.json` | Modificar | Agrega `"seed:demo": "node scripts/seed-demo.js"` |
| `stockia-app/lib/config/api_config.dart` | Modificar | Cambia baseUrl a URL de Railway |

---

## Script seed — comportamiento

1. Borra tenant con email `admin@agridemo.cl` si existe (idempotente)
2. Crea tenant AgriDemo SpA
3. Crea Bodega Central y Bodega Campo Norte
4. Crea usuario admin y bodeguero con contraseña hasheada bcrypt
5. Llama `importStock()` con los 15 productos → registra entradas iniciales en Bodega Central
6. Registra ~20 movimientos con `db.query` directo usando fechas pasadas (`NOW() - INTERVAL 'N days'`)

El script se corre una vez después del deploy:
```bash
npm run seed:demo
```

---

## APK Flutter

- Modificar `lib/config/api_config.dart`: `baseUrl = 'https://stockia-api.railway.app/v1'`
- Compilar: `flutter build apk --debug`
- Instalar: `adb install build/app/outputs/flutter-apk/app-debug.apk`

---

## Restricciones

- El seed es idempotente: si se corre dos veces borra y recrea el tenant demo
- Las contraseñas demo son fijas (Demo2026!) — no usar en producción real
- El APK es debug; válido para piloto, no para Play Store
- Supabase prod requiere SSL (`rejectUnauthorized: false` ya está configurado en `db/index.js`)
