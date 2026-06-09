# Servicio Shopify + Redes Sociales — Tu Amigo Digital SpA
**Fecha:** 2026-06-09  
**Estado:** Aprobado para implementación  
**Responsable:** Sebastián Vargas — Tu Amigo Digital SpA

---

## 1. Resumen del servicio

Servicio de creación de tienda online Shopify con diseño personalizado, conectada a Instagram Shop y Facebook Shop. Cobro único por el setup completo. El cliente paga su plan Shopify directamente con Shopify.

**Propuesta de valor:**  
Tienda lista para vender en 7 días, con diseño que refleja la identidad del negocio (no un template genérico), conectada a las redes sociales donde ya está el cliente.

**Público objetivo:** Todo tipo de negocio (emprendedores desde cero y negocios establecidos que aún no venden online).

---

## 2. Modelo de negocio

| Ítem | Detalle |
|------|---------|
| Tipo de cobro | Pago único por proyecto |
| Precio | A definir según alcance final |
| Plan Shopify | El cliente lo contrata y paga directamente con Shopify según tarifa vigente |
| Dominio | El cliente lo gestiona por su cuenta |
| Redes sociales incluidas | Instagram Shopping + Facebook Shop |
| Soporte post-entrega | 7 días por WhatsApp incluidos |

---

## 3. Arquitectura del sistema

El servicio se compone de 3 componentes:

```
┌─────────────────────────────────────────────┐
│  COMPONENTE 1: Página de venta del servicio  │
│  tuamigodigital.cl/shopify                   │
│  → Captura clientes potenciales              │
└────────────────┬────────────────────────────┘
                 │ cliente contrata
┌────────────────▼────────────────────────────┐
│  COMPONENTE 2: Kit de entrega — 3 estilos   │
│  Shopify prediseñados por Tu Amigo Digital   │
│  → Se personaliza con la marca del cliente   │
└────────────────┬────────────────────────────┘
                 │ proceso interno
┌────────────────▼────────────────────────────┐
│  COMPONENTE 3: Kit Operativo Interno         │
│  4 documentos que estandarizan cada entrega  │
└─────────────────────────────────────────────┘
```

---

## 4. Componente 1 — Página de venta (tuamigodigital.cl/shopify)

### Estructura de la página (de arriba hacia abajo)

1. **Hero**
   - Titular: *"Tu tienda online lista para vender en 7 días"*
   - Subtitular: *"Shopify + Instagram Shop + Facebook Shop, con diseño personalizado para tu marca"*
   - CTA primario: botón "Quiero mi tienda →"

2. **Cómo funciona** — 4 pasos
   - Paso 1: Completás el brief (nos contás tu negocio, productos y estilo)
   - Paso 2: Elegís tu estilo (Minimalista, Vibrante o Elegante)
   - Paso 3: Diseñamos y configuramos (con tu logo, colores y productos)
   - Paso 4: Recibís tu tienda lista (conectada a Instagram + Facebook, lista para vender)

3. **Galería de estilos** — 3 cards con preview visual
   - Minimalista, Vibrante, Elegante (ver Componente 2)

4. **Qué incluye el servicio** — 8 ítems
   - Tienda Shopify configurada
   - Diseño personalizado con tu marca
   - Instagram Shop activado
   - Facebook Shop activado
   - Hasta 20 productos cargados
   - Carrito + checkout listo
   - Mini-guía de administración
   - Soporte 7 días post-entrega

5. **Precio único**
   - Monto a definir
   - Aclaración: *"El plan mensual de Shopify se contrata y paga directamente con Shopify según su tarifa vigente"*
   - CTA final: botón WhatsApp verde

### Integración
- Nueva página HTML en el proyecto `tu-amigo-digital/` existente
- Hereda nav, footer y estilos globales del sitio (estilo Apple: #f5f5f7, azul #0071e3, Inter)
- Archivo: `shopify.html`

---

## 5. Componente 2 — Kit de entrega: 3 estilos Shopify

Tres configuraciones Shopify prediseñadas. Para cada cliente, Tu Amigo Digital elige el tema base correspondiente al estilo y aplica la identidad visual del negocio.

### Estilo 1 — Minimalista

| Atributo | Detalle |
|----------|---------|
| Rubros | Ropa, accesorios, decoración, diseño, fotografía |
| Paleta base | Negro #111, blanco #fff, grises claros + color de marca |
| Tipografía | Sans-serif elegante, cuerpo grande |
| Característica | Mucho espacio en blanco, fotos de producto destacadas, sin ruido visual |
| Transmite | Sofisticación, calidad, foco en el producto |

### Estilo 2 — Vibrante

| Atributo | Detalle |
|----------|---------|
| Rubros | Comida, mascotas, niños, belleza, artesanías, accesorios |
| Paleta base | Naranja #ff6b35, amarillo cálido, rojo + color de marca |
| Tipografía | Sans-serif redondeada, bold |
| Característica | Colores llamativos, botones y badges visibles, energía visual alta |
| Transmite | Cercanía, diversión, urgencia de compra |

### Estilo 3 — Elegante

| Atributo | Detalle |
|----------|---------|
| Rubros | Joyería, cosméticos, ropa premium, vinos, spa, servicios de lujo |
| Paleta base | Negro profundo #0a0a1a, violeta #a855f7, crema claro + color de marca |
| Tipografía | Serif o sans-serif fina, letra espaciada |
| Característica | Tonos oscuros, sensación exclusiva, justifica precios altos |
| Transmite | Lujo, exclusividad, confianza |

### Personalización aplicada en cada estilo
- Logo y colores de marca del cliente
- Fotos de productos y banner principal
- Textos, tagline y descripciones
- Hasta 20 productos con fotos y precios
- Métodos de pago configurados
- Política de envíos del negocio

---

## 6. Componente 3 — Kit Operativo Interno

Cuatro documentos que estandarizan el proceso de entrega de principio a fin.

### Documento 1 — Brief del cliente
*Se envía al cliente antes de comenzar el trabajo.*

Campos:
- Datos del negocio (nombre, rubro, público objetivo, descripción)
- Estilo elegido (Minimalista / Vibrante / Elegante)
- Identidad visual (logo en archivo, colores de marca, tipografía preferida)
- Productos iniciales (nombre, precio, foto y descripción de hasta 20 productos)
- Logística y pagos (método de pago preferido, política de envíos, comunas de despacho)
- Accesos necesarios (cuenta Shopify creada, página Facebook, perfil Instagram Business)

### Documento 2 — Checklist Setup Shopify
*Uso interno de Tu Amigo Digital.*

- [ ] Tema instalado y activado
- [ ] Logo y colores de marca aplicados
- [ ] Banner/hero personalizado
- [ ] Productos cargados con fotos y precios
- [ ] Carrito y checkout probados con pedido de prueba
- [ ] Métodos de pago configurados
- [ ] Dominio conectado (si aplica)
- [ ] Política de envíos y devoluciones cargada
- [ ] Tienda en modo prueba → activar para el público

### Documento 3 — Checklist Instagram + Facebook
*Uso interno de Tu Amigo Digital.*

**Instagram Shopping:**
- [ ] Perfil convertido a cuenta Business
- [ ] Catálogo Shopify vinculado a Instagram
- [ ] Instagram Shopping aprobado y activo
- [ ] Etiquetas de producto probadas en post

**Facebook Shop:**
- [ ] Página Facebook vinculada a Shopify
- [ ] Facebook Shop configurado y activo
- [ ] Catálogo sincronizado correctamente
- [ ] Pixel Meta instalado en Shopify

### Documento 4 — Protocolo de entrega
*Se entrega al cliente al finalizar el proyecto.*

Contenido:
- URL de la tienda + credenciales de acceso al panel admin
- Mini-guía PDF de administración (cómo agregar productos, ver pedidos, gestionar stock)
- Recordatorios importantes (renovar plan Shopify, no desconectar canal de ventas Meta)
- Condiciones del soporte post-entrega (7 días por WhatsApp)
- Confirmación de conformidad del cliente (mensaje escrito o firma)

---

## 7. Flujo completo del servicio

```
Cliente ve la landing
        ↓
Contacta por WhatsApp
        ↓
Tu Amigo Digital envía el Brief (Doc 1)
        ↓
Cliente completa el brief y elige estilo
        ↓
Tu Amigo Digital ejecuta Checklist Shopify (Doc 2)
        ↓
Tu Amigo Digital ejecuta Checklist Redes (Doc 3)
        ↓
Revisión interna → ajustes
        ↓
Entrega con Protocolo (Doc 4)
        ↓
7 días soporte WhatsApp
        ↓
✅ Proyecto cerrado
```

---

## 8. Archivos a crear

| Archivo | Descripción |
|---------|-------------|
| `tu-amigo-digital/shopify.html` | Página de venta del servicio |
| `kits/brief-cliente.pdf` o `brief-cliente.html` | Formulario para el cliente |
| `kits/checklist-shopify.pdf` | Checklist interno setup Shopify |
| `kits/checklist-redes.pdf` | Checklist interno Instagram + Facebook |
| `kits/protocolo-entrega.pdf` | Documento de entrega al cliente |

---

## 9. Lo que NO incluye el servicio (a comunicar claramente)

- El plan mensual de Shopify (lo paga el cliente directamente)
- Registro y pago del dominio
- Fotografía profesional de productos
- Gestión de redes sociales post-entrega
- Campañas de publicidad pagada
- Más de 20 productos en la carga inicial
- Modificaciones después de los 7 días de soporte

---

## 10. Decisiones pendientes

- [ ] Definir el precio único del servicio
- [ ] Elegir los temas base de Shopify para cada estilo
- [ ] Decidir el formato de los documentos del kit (PDF, Google Docs, Notion)
- [ ] Definir si el brief se entrega por formulario web o documento descargable
