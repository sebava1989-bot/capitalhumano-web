# StockIA — Diseño del Sistema
**Fecha:** 2026-04-23  
**Tipo:** SaaS B2B multiempresa  
**Stack:** Flutter + Next.js + Node.js + PostgreSQL  

---

## 1. Resumen

StockIA es un SaaS de control de bodega e inventario con inteligencia artificial, orientado a pequeñas y medianas empresas chilenas. Se diferencia por importar facturas electrónicas (DTE XML) automáticamente y, en versiones futuras, por OCR y consultas por voz.

**Planes:**
| Plan | Precio/mes | Usuarios | Productos | Bodegas |
|------|-----------|----------|-----------|---------|
| Free | $0 | 1 | 50 | 1 |
| Starter | $15 USD | 3 | 500 | 1 |
| Pro | $35 USD | 10 | Ilimitado | 3 |
| Enterprise | $80 USD | Ilimitado | Ilimitado | Ilimitado |

---

## 2. Arquitectura

```
App Móvil (Flutter)     Panel Web (Next.js)
       │                       │
       └──────────┬────────────┘
                  │ HTTPS / REST + JWT
        ┌─────────▼─────────┐
        │   API Node.js     │
        │   (Express)       │
        │                   │
        │  ┌─────────────┐  │
        │  │ OCR module  │──► Google Vision (v2)
        │  │ Voz module  │──► Google Speech (v2)
        │  │ IA module   │──► Claude API (v2)
        │  └─────────────┘  │
        └─────────┬─────────┘
                  │
        ┌─────────▼─────────┐
        │   PostgreSQL      │
        │   (multi-tenant)  │
        └───────────────────┘
```

**Multi-tenancy:** row-level con `tenant_id` en todas las tablas.

**Deploy:**
- API → Railway
- Web → Vercel
- DB → Supabase
- Archivos → Cloudinary

**Costos infraestructura MVP:** $0 - $20 USD/mes

---

## 3. Roadmap de versiones

| Versión | Features |
|---------|---------|
| **v1 MVP** | Ingreso manual + DTE XML + inventario tiempo real + alertas + app móvil + panel web |
| **v2** | OCR facturas físicas + consultas por voz + NLP con Claude |
| **v3** | Reportes automáticos PDF/Excel + email + múltiples bodegas avanzado |

---

## 4. Base de Datos

### tenants
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| name | VARCHAR | Nombre empresa |
| rut | VARCHAR | RUT empresa |
| plan | ENUM | free/starter/pro/enterprise |
| email | VARCHAR | Email admin |
| active | BOOLEAN | Estado |
| created_at | TIMESTAMP | |

### users
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants |
| name | VARCHAR | |
| email | VARCHAR | |
| password_hash | VARCHAR | |
| role | ENUM | admin/bodeguero |
| active | BOOLEAN | |

### products
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants |
| name | VARCHAR | |
| sku | VARCHAR | Código interno |
| category | VARCHAR | |
| unit | VARCHAR | kg/unidad/caja/etc |
| min_stock | INTEGER | Umbral alerta |
| active | BOOLEAN | |

### warehouses
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants |
| name | VARCHAR | |
| location | VARCHAR | |
| active | BOOLEAN | |

### stock
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants |
| product_id | UUID | FK → products |
| warehouse_id | UUID | FK → warehouses |
| quantity | DECIMAL | Stock actual |
| updated_at | TIMESTAMP | |

### movements
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants |
| product_id | UUID | FK → products |
| warehouse_id | UUID | FK → warehouses |
| type | ENUM | in/out/transfer |
| quantity | DECIMAL | |
| responsible | VARCHAR | Nombre responsable |
| document_id | UUID | FK → documents (opcional) |
| notes | TEXT | |
| created_by | UUID | FK → users |
| created_at | TIMESTAMP | Inmutable |

### documents
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants |
| type | ENUM | dte_xml/manual |
| supplier | VARCHAR | |
| folio | VARCHAR | Número documento |
| date | DATE | Fecha documento |
| xml_hash | VARCHAR | Hash SHA256 para evitar duplicados |
| processed_at | TIMESTAMP | |

### document_items
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| document_id | UUID | FK → documents |
| product_name | VARCHAR | Nombre en el documento |
| quantity | DECIMAL | |
| unit_price | DECIMAL | |
| matched_product_id | UUID | FK → products (puede ser null) |

---

## 5. APIs

**Base URL:** `https://api.stockia.app/v1`  
**Auth:** Bearer JWT

### Autenticación
```
POST /auth/register     → Crear empresa + admin
POST /auth/login        → JWT token
POST /auth/refresh      → Renovar token
```

### Productos
```
GET    /products
POST   /products
PUT    /products/:id
DELETE /products/:id    → Desactiva, no elimina
```

### Stock
```
GET /stock              → Stock actual completo
GET /stock/alerts       → Productos bajo mínimo
GET /stock/:product_id
```

### Movimientos
```
POST /movements/in      → Entrada manual
POST /movements/out     → Salida manual
GET  /movements         → Historial con filtros
```

### Documentos DTE
```
POST /documents/import-xml      → Subir XML DTE
GET  /documents                 → Listar documentos
GET  /documents/:id/items       → Ver ítems del documento
POST /documents/:id/apply       → Confirmar y aplicar al stock
```

### Bodegas
```
GET  /warehouses
POST /warehouses
POST /warehouses/transfer       → Transferir entre bodegas
```

### Reportes
```
GET /reports/inventory
GET /reports/movements
GET /reports/critical
```

### Admin
```
GET  /users
POST /users             → Invitar usuario
PUT  /users/:id/role
GET  /settings
PUT  /settings
```

### Flujo DTE completo
```
1. Usuario sube XML → POST /documents/import-xml
2. API parsea XML, extrae ítems, guarda con xml_hash (evita duplicados)
3. Sistema sugiere match con productos existentes
4. Usuario confirma → POST /documents/:id/apply
5. Stock actualizado + movement registrado automáticamente
```

---

## 6. Pantallas Principales

### App Móvil (Flutter) — Bodeguero

**Home:** 3 acciones principales (Importar DTE, Registrar Salida, Consulta Voz v2) + alertas de bajo stock + últimos movimientos.

**Importar DTE:** Seleccionar XML → vista previa de ítems detectados → vincular productos no reconocidos → confirmar aplicación al stock.

**Registrar Salida:** Buscar producto → cantidad → responsable → número de guía → confirmar.

### Panel Web (Next.js) — Administrador

**Dashboard:** Métricas clave (total productos, alertas, % stock saludable) + gráfico productos más movidos + tabla movimientos recientes.

**Inventario:** Tabla completa con filtros por categoría, bodega, estado de stock.

**Documentos:** Historial de DTE importados con estado (procesado/pendiente).

**Configuración:** Usuarios, bodegas, alertas, email de reportes.

---

## 7. Seguridad

- JWT con expiración 24h + refresh token 30 días
- Bcrypt para passwords
- Middleware de tenant isolation en cada request
- Rate limiting por IP y por tenant
- Logs de todas las acciones con user_id + timestamp
- Backup automático diario en Supabase

---

## 8. Competidores y Posicionamiento

| Competidor | Precio base | Diferencia |
|-----------|-------------|-----------|
| Bsale | ~$70 USD/mes | POS + facturación, no enfocado en bodega |
| Easy-Stock | Cotización | Sin IA, sin app móvil nativa |
| Defontana | Enterprise | Muy caro para PyMEs |
| **StockIA** | **$15 USD/mes** | IA + DTE automático + app móvil |

**Punto de equilibrio:** 3 clientes Pro ($35/mes) cubren infraestructura completa.
