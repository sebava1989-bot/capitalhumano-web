# Servicio Shopify + Redes Sociales — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear el sistema completo del servicio Shopify de Tu Amigo Digital: página de venta pública + 4 documentos del kit operativo interno.

**Architecture:** Una página de venta `shopify.html` integrada al sitio existente (mismo nav/estilo Apple), más 4 archivos HTML en `kits/` que funcionan como documentos imprimibles/compartibles. Sin frameworks ni dependencias externas — HTML + CSS puro siguiendo el patrón de `capitalhumano.html`.

**Tech Stack:** HTML5, CSS3 (variables CSS del sitio: `--blue: #0071e3`, `--text: #1d1d1f`, `--bg-gray: #f5f5f7`), Inter (Google Fonts), sin JS excepto smooth scroll.

---

## Mapa de archivos

| Archivo | Acción | Responsabilidad |
|---------|--------|-----------------|
| `index.html` | Modificar | Agregar card del servicio Shopify en sección #servicios |
| `shopify.html` | Crear | Página de venta pública del servicio |
| `kits/brief-cliente.html` | Crear | Formulario que se envía al cliente antes de empezar |
| `kits/checklist-shopify.html` | Crear | Checklist interno de setup Shopify |
| `kits/checklist-redes.html` | Crear | Checklist interno Instagram + Facebook |
| `kits/protocolo-entrega.html` | Crear | Documento de entrega al cliente al finalizar |

---

## Task 1: Enlazar el servicio desde index.html

**Files:**
- Modify: `index.html` (sección #servicios — agregar card Shopify)

- [ ] **Step 1: Leer la sección de servicios del index**

Abrir `index.html` y localizar la sección `id="servicios"`. Identificar el patrón HTML de las cards de servicio existentes para replicarlo.

- [ ] **Step 2: Agregar la card del servicio Shopify**

Dentro de la grilla de servicios (`#servicios`), agregar una nueva card siguiendo el patrón existente:

```html
<a href="shopify.html" class="service-card">
  <div class="service-icon">🛒</div>
  <h3 class="service-title">Tienda Shopify + Redes</h3>
  <p class="service-desc">Tu tienda online lista en 7 días, conectada a Instagram y Facebook, con diseño personalizado para tu marca.</p>
  <span class="service-link">Ver servicio →</span>
</a>
```

> Nota: si el patrón de cards usa `<div>` en lugar de `<a>`, adaptar según lo que existe. Lo importante es que sea clickeable y lleve a `shopify.html`.

- [ ] **Step 3: Verificar en el navegador**

Abrir `index.html` en el navegador. La nueva card debe aparecer en la sección de servicios y al hacer clic debe navegar a `shopify.html` (aún no existe — browser mostrará 404, eso es esperado en este paso).

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: agregar card servicio Shopify en sección servicios"
```

---

## Task 2: Crear shopify.html — estructura base + Hero

**Files:**
- Create: `shopify.html`

- [ ] **Step 1: Crear el archivo con head, estilos base y nav**

Crear `shopify.html` con el mismo patrón que `capitalhumano.html`: estilos inline en `<head>` usando las variables CSS del sitio, nav con back arrow.

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tienda Shopify + Redes Sociales — Tu Amigo Digital</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --blue: #0071e3;
      --blue-dark: #0051a2;
      --text: #1d1d1f;
      --muted: #6e6e73;
      --border: #d2d2d7;
      --bg-gray: #f5f5f7;
      --radius: 18px;
    }

    html { scroll-behavior: smooth; }
    body { font-family: 'Inter', -apple-system, 'Helvetica Neue', sans-serif; color: var(--text); background: #fff; line-height: 1.6; overflow-x: hidden; }

    /* NAV */
    .nav { position: sticky; top: 0; z-index: 100; background: rgba(255,255,255,0.82); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-bottom: 1px solid rgba(0,0,0,0.08); height: 44px; }
    .nav-inner { max-width: 980px; margin: 0 auto; height: 100%; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; }
    .nav-back { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--blue); text-decoration: none; font-weight: 500; }
    .nav-logo { font-size: 15px; font-weight: 700; color: var(--text); }
    .nav-badge { background: #34c759; color: #fff; font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 10px; }

    /* HERO */
    .hero { background: #000; text-align: center; padding: 100px 24px 80px; position: relative; overflow: hidden; }
    .hero::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 0%, rgba(0,113,227,0.25) 0%, transparent 65%); }
    .hero-tag { display: inline-block; background: rgba(0,113,227,0.18); border: 1px solid rgba(0,113,227,0.35); color: #60a5fa; font-size: 12px; font-weight: 600; padding: 6px 16px; border-radius: 20px; letter-spacing: 0.5px; margin-bottom: 24px; position: relative; }
    .hero h1 { font-size: clamp(36px, 6vw, 72px); font-weight: 800; color: #fff; line-height: 1.05; letter-spacing: -2px; margin-bottom: 20px; position: relative; }
    .hero h1 .highlight { background: linear-gradient(135deg, #0071e3, #60a5fa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .hero-sub { font-size: clamp(16px, 2vw, 20px); color: #888; max-width: 560px; margin: 0 auto 36px; position: relative; }
    .btn-primary { display: inline-flex; align-items: center; gap: 8px; background: var(--blue); color: #fff; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 980px; text-decoration: none; transition: background 0.2s; }
    .btn-primary:hover { background: var(--blue-dark); }
  </style>
</head>
<body>

  <!-- NAV -->
  <nav class="nav">
    <div class="nav-inner">
      <a href="index.html" class="nav-back">
        <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 12L6 8l4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Tu Amigo Digital
      </a>
      <span class="nav-logo">Tienda Shopify</span>
      <span class="nav-badge">NUEVO</span>
    </div>
  </nav>

  <!-- HERO -->
  <section class="hero">
    <div class="hero-tag">🛒 Nuevo Servicio</div>
    <h1>Tu tienda online lista<br><span class="highlight">para vender en 7 días</span></h1>
    <p class="hero-sub">Shopify + Instagram Shop + Facebook Shop, con diseño personalizado para tu marca.</p>
    <a href="https://wa.me/56971542893?text=Hola,%20quiero%20información%20sobre%20la%20tienda%20Shopify" target="_blank" class="btn-primary">
      Quiero mi tienda →
    </a>
  </section>

</body>
</html>
```

- [ ] **Step 2: Verificar en el navegador**

Abrir `shopify.html` en el navegador. Debe mostrar nav con back arrow y hero oscuro con gradiente azul. El botón debe abrir WhatsApp al hacer clic.

- [ ] **Step 3: Commit**

```bash
git add shopify.html
git commit -m "feat: shopify.html — estructura base y hero"
```

---

## Task 3: Agregar sección "Cómo funciona" a shopify.html

**Files:**
- Modify: `shopify.html`

- [ ] **Step 1: Agregar estilos de la sección al bloque `<style>`**

Dentro del `<style>` existente en `shopify.html`, agregar al final (antes del cierre `</style>`):

```css
/* CÓMO FUNCIONA */
.section { padding: 80px 24px; }
.section-inner { max-width: 780px; margin: 0 auto; }
.section-label { font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--blue); margin-bottom: 12px; }
.section-title { font-size: clamp(28px, 4vw, 42px); font-weight: 800; letter-spacing: -1px; margin-bottom: 48px; }
.steps { display: flex; flex-direction: column; gap: 16px; }
.step { display: flex; align-items: flex-start; gap: 20px; background: var(--bg-gray); border-radius: var(--radius); padding: 24px; }
.step-num { width: 40px; height: 40px; border-radius: 50%; background: var(--blue); color: #fff; font-size: 16px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.step-num.done { background: #34c759; }
.step-content h3 { font-size: 17px; font-weight: 700; margin-bottom: 4px; }
.step-content p { font-size: 15px; color: var(--muted); }
@media (min-width: 640px) {
  .steps { flex-direction: row; flex-wrap: wrap; }
  .step { flex: 1 1 calc(50% - 8px); }
}
```

- [ ] **Step 2: Agregar el HTML de la sección antes de `</body>`**

```html
  <!-- CÓMO FUNCIONA -->
  <section class="section" style="background: #fff;">
    <div class="section-inner">
      <div class="section-label">El proceso</div>
      <h2 class="section-title">¿Cómo funciona?</h2>
      <div class="steps">
        <div class="step">
          <div class="step-num">1</div>
          <div class="step-content">
            <h3>Completás el brief</h3>
            <p>Nos contás tu negocio, productos, estilo y todo lo que necesitamos para empezar.</p>
          </div>
        </div>
        <div class="step">
          <div class="step-num">2</div>
          <div class="step-content">
            <h3>Elegís tu estilo</h3>
            <p>Minimalista, Vibrante o Elegante — tú decides la personalidad visual de tu tienda.</p>
          </div>
        </div>
        <div class="step">
          <div class="step-num">3</div>
          <div class="step-content">
            <h3>Diseñamos y configuramos</h3>
            <p>Aplicamos tu logo, colores y productos. Conectamos Instagram y Facebook Shop.</p>
          </div>
        </div>
        <div class="step">
          <div class="step-num done">✓</div>
          <div class="step-content">
            <h3>Recibís tu tienda lista</h3>
            <p>Conectada a tus redes sociales y lista para recibir tu primer pedido.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
```

- [ ] **Step 3: Verificar en el navegador**

La sección "Cómo funciona" debe aparecer debajo del hero con los 4 pasos en grid 2x2 en pantallas grandes y columna única en mobile.

- [ ] **Step 4: Commit**

```bash
git add shopify.html
git commit -m "feat: shopify.html — sección cómo funciona 4 pasos"
```

---

## Task 4: Agregar galería de estilos a shopify.html

**Files:**
- Modify: `shopify.html`

- [ ] **Step 1: Agregar estilos de las cards al bloque `<style>`**

```css
/* ESTILOS */
.styles-grid { display: grid; grid-template-columns: 1fr; gap: 24px; }
@media (min-width: 768px) { .styles-grid { grid-template-columns: repeat(3, 1fr); } }
.style-card { border-radius: var(--radius); overflow: hidden; border: 1px solid var(--border); transition: transform 0.2s, box-shadow 0.2s; }
.style-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.1); }
.style-preview { height: 160px; display: flex; align-items: center; justify-content: center; font-size: 40px; }
.style-preview.minimal { background: linear-gradient(135deg, #f8f8f8, #e8e8e8); }
.style-preview.vibrant { background: linear-gradient(135deg, #ff6b35, #ffb347); }
.style-preview.elegant { background: linear-gradient(135deg, #1a0a2e, #4a1a8e); }
.style-body { padding: 20px; }
.style-body h3 { font-size: 18px; font-weight: 700; margin-bottom: 6px; }
.style-body p { font-size: 14px; color: var(--muted); margin-bottom: 12px; }
.style-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.style-tag { font-size: 11px; background: var(--bg-gray); color: var(--muted); padding: 3px 10px; border-radius: 20px; }
```

- [ ] **Step 2: Agregar HTML de la galería antes de `</body>`**

```html
  <!-- GALERÍA DE ESTILOS -->
  <section class="section" style="background: var(--bg-gray);">
    <div class="section-inner" style="max-width: 980px;">
      <div class="section-label">Personalización</div>
      <h2 class="section-title">Elegí tu estilo</h2>
      <div class="styles-grid">

        <div class="style-card">
          <div class="style-preview minimal">⬜</div>
          <div class="style-body">
            <h3>Minimalista</h3>
            <p>Limpio, sofisticado, con el foco puesto en tu producto. Mucho espacio en blanco y tipografía elegante.</p>
            <div class="style-tags">
              <span class="style-tag">Ropa</span>
              <span class="style-tag">Accesorios</span>
              <span class="style-tag">Decoración</span>
              <span class="style-tag">Fotografía</span>
            </div>
          </div>
        </div>

        <div class="style-card">
          <div class="style-preview vibrant">🎨</div>
          <div class="style-body">
            <h3>Vibrante</h3>
            <p>Colores que llaman la atención y generan urgencia de compra. Energético y cercano al cliente.</p>
            <div class="style-tags">
              <span class="style-tag">Comida</span>
              <span class="style-tag">Mascotas</span>
              <span class="style-tag">Belleza</span>
              <span class="style-tag">Artesanías</span>
            </div>
          </div>
        </div>

        <div class="style-card">
          <div class="style-preview elegant">💎</div>
          <div class="style-body">
            <h3>Elegante</h3>
            <p>Tonos oscuros y sofisticados que transmiten exclusividad y justifican precios premium.</p>
            <div class="style-tags">
              <span class="style-tag">Joyería</span>
              <span class="style-tag">Cosméticos</span>
              <span class="style-tag">Vinos</span>
              <span class="style-tag">Spa</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>
```

- [ ] **Step 3: Verificar en el navegador**

Las 3 cards deben mostrarse en columna en mobile y en grid de 3 en desktop. Cada card debe tener hover con sombra.

- [ ] **Step 4: Commit**

```bash
git add shopify.html
git commit -m "feat: shopify.html — galería de 3 estilos Shopify"
```

---

## Task 5: Agregar "Qué incluye" + Precio + CTA final a shopify.html

**Files:**
- Modify: `shopify.html`

- [ ] **Step 1: Agregar estilos al bloque `<style>`**

```css
/* QUÉ INCLUYE */
.includes-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (min-width: 640px) { .includes-grid { grid-template-columns: repeat(4, 1fr); } }
.include-item { background: #fff; border: 1px solid var(--border); border-radius: 14px; padding: 20px 16px; text-align: center; }
.include-icon { font-size: 28px; margin-bottom: 8px; }
.include-text { font-size: 13px; font-weight: 600; color: var(--text); line-height: 1.3; }

/* PRECIO */
.pricing { background: #000; color: #fff; text-align: center; padding: 80px 24px; }
.pricing-label { font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #888; margin-bottom: 12px; }
.pricing-amount { font-size: clamp(48px, 8vw, 80px); font-weight: 900; letter-spacing: -3px; margin-bottom: 8px; }
.pricing-note { font-size: 14px; color: #666; max-width: 480px; margin: 0 auto 36px; line-height: 1.6; }
.btn-whatsapp { display: inline-flex; align-items: center; gap: 10px; background: #25d366; color: #fff; font-size: 17px; font-weight: 700; padding: 16px 36px; border-radius: 980px; text-decoration: none; transition: background 0.2s; }
.btn-whatsapp:hover { background: #1da851; }
.btn-whatsapp svg { width: 22px; height: 22px; }

/* FOOTER */
.page-footer { background: #1d1d1f; color: #888; text-align: center; padding: 32px 24px; font-size: 14px; }
.page-footer a { color: var(--blue); text-decoration: none; }
```

- [ ] **Step 2: Agregar HTML de "Qué incluye" antes de `</body>`**

```html
  <!-- QUÉ INCLUYE -->
  <section class="section" style="background: #fff;">
    <div class="section-inner" style="max-width: 980px;">
      <div class="section-label">El servicio completo</div>
      <h2 class="section-title">¿Qué incluye?</h2>
      <div class="includes-grid">
        <div class="include-item"><div class="include-icon">🛒</div><div class="include-text">Tienda Shopify configurada</div></div>
        <div class="include-item"><div class="include-icon">🎨</div><div class="include-text">Diseño personalizado con tu marca</div></div>
        <div class="include-item"><div class="include-icon">📱</div><div class="include-text">Instagram Shop activado</div></div>
        <div class="include-item"><div class="include-icon">👍</div><div class="include-text">Facebook Shop activado</div></div>
        <div class="include-item"><div class="include-icon">📦</div><div class="include-text">Hasta 20 productos cargados</div></div>
        <div class="include-item"><div class="include-icon">🚀</div><div class="include-text">Carrito + checkout listo</div></div>
        <div class="include-item"><div class="include-icon">📖</div><div class="include-text">Mini-guía de administración</div></div>
        <div class="include-item"><div class="include-icon">🤝</div><div class="include-text">Soporte 7 días post-entrega</div></div>
      </div>
    </div>
  </section>

  <!-- PRECIO + CTA -->
  <section class="pricing">
    <div class="pricing-label">Inversión única</div>
    <div class="pricing-amount">$XXX.000</div>
    <p class="pricing-note">El plan mensual de Shopify se contrata y paga directamente con Shopify según su tarifa vigente.</p>
    <a href="https://wa.me/56971542893?text=Hola,%20quiero%20información%20sobre%20la%20tienda%20Shopify" target="_blank" class="btn-whatsapp">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      Contactar por WhatsApp
    </a>
  </section>

  <!-- FOOTER -->
  <footer class="page-footer">
    <p>© 2026 <a href="index.html">Tu Amigo Digital SpA</a> · contacto@tuamigospa.cl</p>
  </footer>
```

> **Importante:** El precio `$XXX.000` es un placeholder que Sebastián debe reemplazar una vez definido.

- [ ] **Step 3: Verificar en el navegador**

La página completa debe mostrar: hero → cómo funciona → estilos → qué incluye → precio/CTA. Responsive en mobile. El botón WhatsApp debe funcionar.

- [ ] **Step 4: Commit**

```bash
git add shopify.html
git commit -m "feat: shopify.html — sección incluye, precio y CTA completos"
```

---

## Task 6: Crear kits/brief-cliente.html

**Files:**
- Create: `kits/brief-cliente.html`

- [ ] **Step 1: Crear el directorio kits y el archivo**

```bash
mkdir -p kits
```

Crear `kits/brief-cliente.html` — documento imprimible/compartible que se envía al cliente antes de empezar:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Brief del Cliente — Tu Amigo Digital</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; color: #1d1d1f; background: #f5f5f7; padding: 40px 24px; }
    .doc { max-width: 740px; margin: 0 auto; background: #fff; border-radius: 18px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .doc-header { background: #0071e3; color: #fff; padding: 36px 40px; }
    .doc-header .badge { background: rgba(255,255,255,0.2); font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 20px; display: inline-block; margin-bottom: 12px; letter-spacing: 1px; }
    .doc-header h1 { font-size: 28px; font-weight: 800; margin-bottom: 6px; }
    .doc-header p { font-size: 14px; opacity: 0.85; }
    .doc-body { padding: 40px; }
    .section { margin-bottom: 36px; }
    .section-title { font-size: 13px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #0071e3; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #e8f0fd; }
    .field { margin-bottom: 16px; }
    .field label { display: block; font-size: 13px; font-weight: 600; color: #1d1d1f; margin-bottom: 6px; }
    .field .hint { font-size: 12px; color: #6e6e73; margin-bottom: 6px; }
    .field .line { border: none; border-bottom: 1.5px solid #d2d2d7; display: block; width: 100%; padding: 8px 0; font-size: 14px; font-family: inherit; background: transparent; outline: none; }
    .field .line:focus { border-bottom-color: #0071e3; }
    .field .area { border: 1.5px solid #d2d2d7; border-radius: 8px; width: 100%; padding: 10px 12px; font-size: 14px; font-family: inherit; min-height: 80px; resize: vertical; outline: none; }
    .field .area:focus { border-color: #0071e3; }
    .style-options { display: flex; gap: 12px; }
    .style-opt { flex: 1; border: 2px solid #d2d2d7; border-radius: 12px; padding: 14px; text-align: center; cursor: pointer; transition: border-color 0.2s; }
    .style-opt:hover { border-color: #0071e3; }
    .style-opt .emoji { font-size: 24px; margin-bottom: 6px; }
    .style-opt .name { font-size: 13px; font-weight: 700; }
    .style-opt .desc { font-size: 11px; color: #6e6e73; margin-top: 2px; }
    .accesos-list { display: flex; flex-direction: column; gap: 10px; }
    .acceso { display: flex; align-items: center; gap: 10px; background: #f5f5f7; border-radius: 10px; padding: 12px 16px; }
    .acceso-check { width: 20px; height: 20px; border: 2px solid #d2d2d7; border-radius: 4px; flex-shrink: 0; }
    .acceso-text { font-size: 13px; color: #1d1d1f; }
    .doc-footer { background: #f5f5f7; padding: 24px 40px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e5e5e5; }
    .doc-footer p { font-size: 13px; color: #6e6e73; }
    .doc-footer a { color: #0071e3; text-decoration: none; font-weight: 500; }
    @media print {
      body { background: #fff; padding: 0; }
      .doc { box-shadow: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="doc">
    <div class="doc-header">
      <div class="badge">DOCUMENTO 1 DE 4</div>
      <h1>Brief del Cliente</h1>
      <p>Completa este formulario antes de comenzar tu proyecto. Mientras más detalle nos das, mejor quedará tu tienda.</p>
    </div>
    <div class="doc-body">

      <div class="section">
        <div class="section-title">1. Datos del negocio</div>
        <div class="field"><label>Nombre del negocio</label><input class="line" type="text" placeholder="Ej: Florería Valentina" /></div>
        <div class="field"><label>Rubro o categoría</label><input class="line" type="text" placeholder="Ej: Flores y plantas, Ropa femenina, Comida saludable..." /></div>
        <div class="field"><label>Público objetivo</label><div class="hint">¿A quién le vendés? Edad, género, intereses.</div><textarea class="area" placeholder="Ej: Mujeres de 25 a 45 años, interesadas en decoración del hogar y regalos especiales"></textarea></div>
        <div class="field"><label>Descripción del negocio</label><div class="hint">Cuéntanos qué hacés y qué te hace diferente.</div><textarea class="area" placeholder="Ej: Somos una florería familiar con 10 años de experiencia, especializados en arreglos para eventos y envíos a domicilio en Santiago..."></textarea></div>
      </div>

      <div class="section">
        <div class="section-title">2. Estilo visual elegido</div>
        <div class="style-options">
          <div class="style-opt"><div class="emoji">⬜</div><div class="name">Minimalista</div><div class="desc">Limpio y sofisticado</div></div>
          <div class="style-opt"><div class="emoji">🎨</div><div class="name">Vibrante</div><div class="desc">Colorido y energético</div></div>
          <div class="style-opt"><div class="emoji">💎</div><div class="name">Elegante</div><div class="desc">Oscuro y premium</div></div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">3. Identidad visual</div>
        <div class="field"><label>Logo</label><div class="hint">Enviarlo por WhatsApp en formato PNG con fondo transparente (si lo tenés).</div><input class="line" type="text" placeholder="Ej: Te lo envío por WhatsApp / Aún no tengo logo" /></div>
        <div class="field"><label>Colores de marca</label><div class="hint">Si tenés colores definidos, indicá los códigos HEX o descríbelos.</div><input class="line" type="text" placeholder="Ej: Rosa pastel #f8b4c8 y blanco / No tengo colores definidos" /></div>
        <div class="field"><label>Tipografía preferida</label><div class="hint">Opcional — si tenés alguna preferencia de estilo de letra.</div><input class="line" type="text" placeholder="Ej: Algo moderno y sans-serif / Sin preferencia" /></div>
      </div>

      <div class="section">
        <div class="section-title">4. Productos iniciales</div>
        <div class="field"><label>Lista de productos</label><div class="hint">Hasta 20 productos. Por cada uno: nombre, precio, foto y descripción breve. Podés enviarlo como lista o tabla por WhatsApp.</div><textarea class="area" style="min-height:120px" placeholder="Ej:&#10;1. Ramo de rosas rojas — $15.990 — Foto por WS&#10;2. Cactus decorativo — $8.490 — Foto por WS&#10;..."></textarea></div>
      </div>

      <div class="section">
        <div class="section-title">5. Logística y pagos</div>
        <div class="field"><label>Método de pago preferido</label><div class="hint">¿Cómo quieren cobrar? (Webpay, Mercado Pago, transferencia, etc.)</div><input class="line" type="text" placeholder="Ej: Webpay + Mercado Pago" /></div>
        <div class="field"><label>Política de envíos</label><div class="hint">¿Hacen despacho? ¿A qué comunas? ¿Cuánto cuesta? ¿Tienen retiro en tienda?</div><textarea class="area" placeholder="Ej: Despacho a RM $3.000, regiones $5.000. Retiro en Providencia sin costo. 3–5 días hábiles."></textarea></div>
      </div>

      <div class="section">
        <div class="section-title">6. Accesos necesarios</div>
        <p style="font-size:13px;color:#6e6e73;margin-bottom:16px">Antes de empezar, necesitamos que tengas listos estos accesos:</p>
        <div class="accesos-list">
          <div class="acceso"><div class="acceso-check"></div><div class="acceso-text"><strong>Cuenta Shopify creada</strong> — shopify.com/cl (plan a elección)</div></div>
          <div class="acceso"><div class="acceso-check"></div><div class="acceso-text"><strong>Página de Facebook</strong> — con rol de administrador</div></div>
          <div class="acceso"><div class="acceso-check"></div><div class="acceso-text"><strong>Cuenta de Instagram Business</strong> — vinculada a la página Facebook</div></div>
          <div class="acceso"><div class="acceso-check"></div><div class="acceso-text"><strong>Dominio</strong> — si ya tenés uno o querés conectar uno nuevo</div></div>
        </div>
      </div>

    </div>
    <div class="doc-footer">
      <p>Tu Amigo Digital SpA · <a href="mailto:contacto@tuamigospa.cl">contacto@tuamigospa.cl</a></p>
      <p>📱 <a href="https://wa.me/56971542893">+56 9 7154 2893</a></p>
    </div>
  </div>
</body>
</html>
```

- [ ] **Step 2: Verificar en el navegador**

Abrir `kits/brief-cliente.html`. Debe mostrar un documento limpio con 6 secciones, campos de formulario y las 3 opciones de estilo visual. Probar Ctrl+P — debe verse bien para imprimir o guardar como PDF.

- [ ] **Step 3: Commit**

```bash
git add kits/brief-cliente.html
git commit -m "feat: kits/brief-cliente.html — formulario para enviar al cliente"
```

---

## Task 7: Crear kits/checklist-shopify.html

**Files:**
- Create: `kits/checklist-shopify.html`

- [ ] **Step 1: Crear el archivo**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Checklist Setup Shopify — Tu Amigo Digital</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; color: #1d1d1f; background: #f5f5f7; padding: 40px 24px; }
    .doc { max-width: 640px; margin: 0 auto; background: #fff; border-radius: 18px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .doc-header { background: #22c55e; color: #fff; padding: 36px 40px; }
    .doc-header .badge { background: rgba(255,255,255,0.2); font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 20px; display: inline-block; margin-bottom: 12px; letter-spacing: 1px; }
    .doc-header h1 { font-size: 28px; font-weight: 800; margin-bottom: 6px; }
    .doc-header p { font-size: 14px; opacity: 0.9; }
    .doc-body { padding: 40px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 32px; }
    .meta-field { background: #f5f5f7; border-radius: 10px; padding: 12px 16px; }
    .meta-field label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #6e6e73; display: block; margin-bottom: 4px; }
    .meta-field input { border: none; background: transparent; font-size: 14px; font-family: inherit; outline: none; width: 100%; }
    .checklist { display: flex; flex-direction: column; gap: 10px; }
    .item { display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px; border-radius: 12px; border: 1.5px solid #e5e5e5; transition: border-color 0.15s; cursor: pointer; }
    .item:hover { border-color: #22c55e; }
    .item.done { background: #f0fff4; border-color: #22c55e; }
    .item-check { width: 22px; height: 22px; border: 2px solid #d2d2d7; border-radius: 6px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; margin-top: 1px; }
    .item.done .item-check { background: #22c55e; border-color: #22c55e; color: #fff; font-size: 13px; }
    .item-text h4 { font-size: 14px; font-weight: 600; margin-bottom: 2px; }
    .item-text p { font-size: 12px; color: #6e6e73; }
    .doc-footer { background: #f5f5f7; padding: 24px 40px; border-top: 1px solid #e5e5e5; display: flex; justify-content: space-between; font-size: 13px; color: #6e6e73; }
    .doc-footer a { color: #22c55e; text-decoration: none; font-weight: 500; }
    @media print {
      body { background: #fff; padding: 0; }
      .doc { box-shadow: none; border-radius: 0; }
    }
  </style>
  <script>
    function toggleItem(el) {
      el.classList.toggle('done');
      const check = el.querySelector('.item-check');
      check.textContent = el.classList.contains('done') ? '✓' : '';
    }
  </script>
</head>
<body>
  <div class="doc">
    <div class="doc-header">
      <div class="badge">DOCUMENTO 2 DE 4 · USO INTERNO</div>
      <h1>Checklist Setup Shopify</h1>
      <p>Completar en orden. Marcar cada ítem solo cuando esté 100% verificado.</p>
    </div>
    <div class="doc-body">

      <div class="meta">
        <div class="meta-field"><label>Cliente</label><input type="text" placeholder="Nombre del negocio" /></div>
        <div class="meta-field"><label>Estilo elegido</label><input type="text" placeholder="Minimalista / Vibrante / Elegante" /></div>
        <div class="meta-field"><label>Fecha inicio</label><input type="text" placeholder="dd/mm/aaaa" /></div>
        <div class="meta-field"><label>Fecha entrega</label><input type="text" placeholder="dd/mm/aaaa" /></div>
      </div>

      <div class="checklist">
        <div class="item" onclick="toggleItem(this)">
          <div class="item-check"></div>
          <div class="item-text"><h4>Tema instalado y activado</h4><p>Seleccionar el tema correspondiente al estilo elegido desde la tienda de temas de Shopify.</p></div>
        </div>
        <div class="item" onclick="toggleItem(this)">
          <div class="item-check"></div>
          <div class="item-text"><h4>Logo y colores de marca aplicados</h4><p>Subir logo PNG con fondo transparente. Aplicar colores primario y secundario en la configuración del tema.</p></div>
        </div>
        <div class="item" onclick="toggleItem(this)">
          <div class="item-check"></div>
          <div class="item-text"><h4>Banner/hero personalizado</h4><p>Reemplazar imagen de hero con foto del cliente o imagen de marca. Actualizar título y subtítulo del banner.</p></div>
        </div>
        <div class="item" onclick="toggleItem(this)">
          <div class="item-check"></div>
          <div class="item-text"><h4>Productos cargados con fotos y precios</h4><p>Cargar hasta 20 productos según la lista del brief. Cada producto con foto, nombre, precio y descripción.</p></div>
        </div>
        <div class="item" onclick="toggleItem(this)">
          <div class="item-check"></div>
          <div class="item-text"><h4>Carrito y checkout probados</h4><p>Realizar un pedido de prueba completo: agregar al carro → checkout → verificar email de confirmación.</p></div>
        </div>
        <div class="item" onclick="toggleItem(this)">
          <div class="item-check"></div>
          <div class="item-text"><h4>Métodos de pago configurados</h4><p>Activar los medios de pago indicados en el brief (Webpay, Mercado Pago, transferencia, etc.).</p></div>
        </div>
        <div class="item" onclick="toggleItem(this)">
          <div class="item-check"></div>
          <div class="item-text"><h4>Dominio conectado (si aplica)</h4><p>Configurar dominio personalizado del cliente. Verificar que HTTPS esté activo y el redirect funcione.</p></div>
        </div>
        <div class="item" onclick="toggleItem(this)">
          <div class="item-check"></div>
          <div class="item-text"><h4>Política de envíos y devoluciones cargada</h4><p>Cargar la política de despacho indicada en el brief en Configuración → Envío y entrega.</p></div>
        </div>
        <div class="item" onclick="toggleItem(this)">
          <div class="item-check"></div>
          <div class="item-text"><h4>Tienda activada para el público</h4><p>Desactivar contraseña de protección en Configuración → Preferencias. Verificar que la tienda sea accesible sin login.</p></div>
        </div>
      </div>

    </div>
    <div class="doc-footer">
      <p>Tu Amigo Digital SpA</p>
      <p><a href="mailto:contacto@tuamigospa.cl">contacto@tuamigospa.cl</a> · <a href="https://wa.me/56971542893">+56 9 7154 2893</a></p>
    </div>
  </div>
</body>
</html>
```

- [ ] **Step 2: Verificar en el navegador**

Abrir `kits/checklist-shopify.html`. Hacer clic en un ítem — debe ponerse verde con ✓. Los 4 campos de metadatos deben ser editables. Verificar que se vea bien al imprimir (Ctrl+P).

- [ ] **Step 3: Commit**

```bash
git add kits/checklist-shopify.html
git commit -m "feat: kits/checklist-shopify.html — checklist interno setup Shopify"
```

---

## Task 8: Crear kits/checklist-redes.html

**Files:**
- Create: `kits/checklist-redes.html`

- [ ] **Step 1: Crear el archivo**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Checklist Instagram + Facebook — Tu Amigo Digital</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; color: #1d1d1f; background: #f5f5f7; padding: 40px 24px; }
    .doc { max-width: 640px; margin: 0 auto; background: #fff; border-radius: 18px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .doc-header { background: linear-gradient(135deg, #833ab4, #e1306c); color: #fff; padding: 36px 40px; }
    .doc-header .badge { background: rgba(255,255,255,0.2); font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 20px; display: inline-block; margin-bottom: 12px; letter-spacing: 1px; }
    .doc-header h1 { font-size: 28px; font-weight: 800; margin-bottom: 6px; }
    .doc-header p { font-size: 14px; opacity: 0.9; }
    .doc-body { padding: 40px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 32px; }
    .meta-field { background: #f5f5f7; border-radius: 10px; padding: 12px 16px; }
    .meta-field label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #6e6e73; display: block; margin-bottom: 4px; }
    .meta-field input { border: none; background: transparent; font-size: 14px; font-family: inherit; outline: none; width: 100%; }
    .red-section { margin-bottom: 28px; }
    .red-title { display: flex; align-items: center; gap: 10px; font-size: 15px; font-weight: 700; margin-bottom: 12px; padding: 10px 14px; border-radius: 10px; }
    .red-title.ig { background: linear-gradient(135deg, #833ab4, #e1306c); color: #fff; }
    .red-title.fb { background: #1877f2; color: #fff; }
    .checklist { display: flex; flex-direction: column; gap: 10px; }
    .item { display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px; border-radius: 12px; border: 1.5px solid #e5e5e5; cursor: pointer; transition: border-color 0.15s; }
    .item:hover { border-color: #e1306c; }
    .item.done { background: #fdf0f6; border-color: #e1306c; }
    .item.fb-item:hover { border-color: #1877f2; }
    .item.fb-item.done { background: #eff5ff; border-color: #1877f2; }
    .item-check { width: 22px; height: 22px; border: 2px solid #d2d2d7; border-radius: 6px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; margin-top: 1px; }
    .item.done .item-check { background: #e1306c; border-color: #e1306c; color: #fff; font-size: 13px; }
    .item.fb-item.done .item-check { background: #1877f2; border-color: #1877f2; }
    .item-text h4 { font-size: 14px; font-weight: 600; margin-bottom: 2px; }
    .item-text p { font-size: 12px; color: #6e6e73; }
    .doc-footer { background: #f5f5f7; padding: 24px 40px; border-top: 1px solid #e5e5e5; display: flex; justify-content: space-between; font-size: 13px; color: #6e6e73; }
    .doc-footer a { color: #e1306c; text-decoration: none; font-weight: 500; }
    @media print {
      body { background: #fff; padding: 0; }
      .doc { box-shadow: none; border-radius: 0; }
    }
  </style>
  <script>
    function toggleItem(el) {
      el.classList.toggle('done');
      const check = el.querySelector('.item-check');
      check.textContent = el.classList.contains('done') ? '✓' : '';
    }
  </script>
</head>
<body>
  <div class="doc">
    <div class="doc-header">
      <div class="badge">DOCUMENTO 3 DE 4 · USO INTERNO</div>
      <h1>Checklist Instagram + Facebook</h1>
      <p>Conectar la tienda Shopify con Instagram Shopping y Facebook Shop.</p>
    </div>
    <div class="doc-body">

      <div class="meta">
        <div class="meta-field"><label>Cliente</label><input type="text" placeholder="Nombre del negocio" /></div>
        <div class="meta-field"><label>URL Shopify</label><input type="text" placeholder="nombretienda.myshopify.com" /></div>
        <div class="meta-field"><label>Instagram</label><input type="text" placeholder="@usuario" /></div>
        <div class="meta-field"><label>Página Facebook</label><input type="text" placeholder="Nombre de la página" /></div>
      </div>

      <!-- INSTAGRAM -->
      <div class="red-section">
        <div class="red-title ig">📱 Instagram Shopping</div>
        <div class="checklist">
          <div class="item" onclick="toggleItem(this)">
            <div class="item-check"></div>
            <div class="item-text"><h4>Perfil convertido a cuenta Business</h4><p>En Instagram: Configuración → Cuenta → Cambiar a cuenta profesional → Negocio.</p></div>
          </div>
          <div class="item" onclick="toggleItem(this)">
            <div class="item-check"></div>
            <div class="item-text"><h4>Catálogo Shopify vinculado a Instagram</h4><p>En Shopify: Canal de ventas → Instagram → Conectar con cuenta de Facebook Business y sincronizar catálogo.</p></div>
          </div>
          <div class="item" onclick="toggleItem(this)">
            <div class="item-check"></div>
            <div class="item-text"><h4>Instagram Shopping aprobado y activo</h4><p>Esperar aprobación de Meta (puede tomar hasta 48 hs). Verificar en Instagram → Configuración → Compras.</p></div>
          </div>
          <div class="item" onclick="toggleItem(this)">
            <div class="item-check"></div>
            <div class="item-text"><h4>Etiquetas de producto probadas en post</h4><p>Crear un post de prueba y etiquetar un producto. Verificar que el link lleva correctamente a la tienda Shopify.</p></div>
          </div>
        </div>
      </div>

      <!-- FACEBOOK -->
      <div class="red-section">
        <div class="red-title fb">👍 Facebook Shop</div>
        <div class="checklist">
          <div class="item fb-item" onclick="toggleItem(this)">
            <div class="item-check"></div>
            <div class="item-text"><h4>Página Facebook vinculada a Shopify</h4><p>En Shopify: Canal de ventas → Facebook → Conectar con la página de Facebook del cliente.</p></div>
          </div>
          <div class="item fb-item" onclick="toggleItem(this)">
            <div class="item-check"></div>
            <div class="item-text"><h4>Facebook Shop configurado y activo</h4><p>Verificar en Commerce Manager de Meta que la tienda esté activa y visible en la página de Facebook.</p></div>
          </div>
          <div class="item fb-item" onclick="toggleItem(this)">
            <div class="item-check"></div>
            <div class="item-text"><h4>Catálogo sincronizado correctamente</h4><p>En Commerce Manager: verificar que todos los productos aparecen con foto, precio y stock actualizado.</p></div>
          </div>
          <div class="item fb-item" onclick="toggleItem(this)">
            <div class="item-check"></div>
            <div class="item-text"><h4>Pixel Meta instalado en Shopify</h4><p>En Shopify: Canal de ventas → Facebook → Pixel. Verificar con Meta Pixel Helper (extensión Chrome) que el pixel dispara al cargar la tienda.</p></div>
          </div>
        </div>
      </div>

    </div>
    <div class="doc-footer">
      <p>Tu Amigo Digital SpA</p>
      <p><a href="mailto:contacto@tuamigospa.cl">contacto@tuamigospa.cl</a></p>
    </div>
  </div>
</body>
</html>
```

- [ ] **Step 2: Verificar en el navegador**

Abrir `kits/checklist-redes.html`. Los ítems de Instagram deben ponerse rosa al marcar, los de Facebook azul. Verificar que el header tiene el degradado Instagram. Probar impresión.

- [ ] **Step 3: Commit**

```bash
git add kits/checklist-redes.html
git commit -m "feat: kits/checklist-redes.html — checklist Instagram + Facebook Shop"
```

---

## Task 9: Crear kits/protocolo-entrega.html

**Files:**
- Create: `kits/protocolo-entrega.html`

- [ ] **Step 1: Crear el archivo**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Protocolo de Entrega — Tu Amigo Digital</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; color: #1d1d1f; background: #f5f5f7; padding: 40px 24px; }
    .doc { max-width: 740px; margin: 0 auto; background: #fff; border-radius: 18px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .doc-header { background: #a855f7; color: #fff; padding: 36px 40px; }
    .doc-header .badge { background: rgba(255,255,255,0.2); font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 20px; display: inline-block; margin-bottom: 12px; letter-spacing: 1px; }
    .doc-header h1 { font-size: 28px; font-weight: 800; margin-bottom: 6px; }
    .doc-header p { font-size: 14px; opacity: 0.9; }
    .doc-body { padding: 40px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 36px; }
    .meta-field { background: #f5f5f7; border-radius: 10px; padding: 12px 16px; }
    .meta-field label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #6e6e73; display: block; margin-bottom: 4px; }
    .meta-field input { border: none; background: transparent; font-size: 14px; font-family: inherit; outline: none; width: 100%; }
    .section { margin-bottom: 32px; }
    .section-title { font-size: 13px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #a855f7; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #f3e8ff; }
    .field label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; }
    .field .line { border: none; border-bottom: 1.5px solid #d2d2d7; display: block; width: 100%; padding: 8px 0; font-size: 14px; font-family: inherit; background: transparent; outline: none; margin-bottom: 14px; }
    .field .area { border: 1.5px solid #d2d2d7; border-radius: 8px; width: 100%; padding: 10px 12px; font-size: 14px; font-family: inherit; min-height: 70px; resize: vertical; outline: none; margin-bottom: 14px; }
    .recordatorios { display: flex; flex-direction: column; gap: 10px; }
    .recordatorio { display: flex; align-items: flex-start; gap: 12px; background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 12px; padding: 14px 16px; }
    .recordatorio-icon { font-size: 20px; flex-shrink: 0; }
    .recordatorio-text h4 { font-size: 14px; font-weight: 600; margin-bottom: 2px; }
    .recordatorio-text p { font-size: 12px; color: #6e6e73; }
    .soporte-box { background: #faf5ff; border: 2px solid #a855f7; border-radius: 14px; padding: 20px 24px; }
    .soporte-box h3 { font-size: 16px; font-weight: 700; color: #a855f7; margin-bottom: 8px; }
    .soporte-box p { font-size: 14px; color: #6e6e73; margin-bottom: 12px; }
    .soporte-box a { display: inline-flex; align-items: center; gap: 8px; background: #25d366; color: #fff; font-size: 13px; font-weight: 600; padding: 10px 20px; border-radius: 980px; text-decoration: none; }
    .firma-section { margin-top: 8px; }
    .firma-box { border: 1.5px solid #d2d2d7; border-radius: 10px; padding: 20px; text-align: center; min-height: 80px; display: flex; flex-direction: column; justify-content: flex-end; }
    .firma-box .firma-line { border-top: 1.5px solid #d2d2d7; padding-top: 8px; margin-top: 20px; font-size: 12px; color: #6e6e73; }
    .firma-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .doc-footer { background: #1d1d1f; padding: 24px 40px; display: flex; justify-content: space-between; align-items: center; }
    .doc-footer p { font-size: 13px; color: #888; }
    .doc-footer a { color: #a855f7; text-decoration: none; }
    @media print {
      body { background: #fff; padding: 0; }
      .doc { box-shadow: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="doc">
    <div class="doc-header">
      <div class="badge">DOCUMENTO 4 DE 4 · ENTREGA AL CLIENTE</div>
      <h1>Protocolo de Entrega</h1>
      <p>Documento oficial de cierre del proyecto. Se entrega al cliente junto con los accesos.</p>
    </div>
    <div class="doc-body">

      <div class="meta-grid">
        <div class="meta-field"><label>Cliente</label><input type="text" placeholder="Nombre del negocio" /></div>
        <div class="meta-field"><label>Fecha de entrega</label><input type="text" placeholder="dd/mm/aaaa" /></div>
        <div class="meta-field"><label>URL de la tienda</label><input type="text" placeholder="https://sunegocio.com o .myshopify.com" /></div>
        <div class="meta-field"><label>Estilo aplicado</label><input type="text" placeholder="Minimalista / Vibrante / Elegante" /></div>
      </div>

      <div class="section">
        <div class="section-title">1. Accesos entregados</div>
        <div class="field">
          <label>URL del panel de administración</label>
          <input class="line" type="text" placeholder="https://sunegocio.myshopify.com/admin" />
          <label>Email de acceso</label>
          <input class="line" type="text" placeholder="email registrado en Shopify" />
          <label>Notas adicionales de acceso</label>
          <textarea class="area" placeholder="Ej: La contraseña fue enviada por WhatsApp. Instagram ya está conectado con la cuenta @usuario."></textarea>
        </div>
      </div>

      <div class="section">
        <div class="section-title">2. Resumen de lo entregado</div>
        <div class="field">
          <label>Productos cargados</label>
          <input class="line" type="text" placeholder="Ej: 14 productos cargados con foto, precio y descripción" />
          <label>Redes conectadas</label>
          <input class="line" type="text" placeholder="Ej: Instagram Shopping activo + Facebook Shop activo + Pixel Meta instalado" />
          <label>Observaciones</label>
          <textarea class="area" placeholder="Ej: Dominio propio pendiente de conexión por parte del cliente. 3 productos sin foto entregada quedan pendientes."></textarea>
        </div>
      </div>

      <div class="section">
        <div class="section-title">3. Recordatorios importantes</div>
        <div class="recordatorios">
          <div class="recordatorio">
            <div class="recordatorio-icon">💳</div>
            <div class="recordatorio-text"><h4>Mantén tu plan Shopify activo</h4><p>El plan mensual se cobra directamente a tu tarjeta en Shopify. Si vence, tu tienda se desactiva automáticamente.</p></div>
          </div>
          <div class="recordatorio">
            <div class="recordatorio-icon">🔗</div>
            <div class="recordatorio-text"><h4>No desconectes el canal de ventas Meta</h4><p>Si desvinculás Instagram o Facebook de Shopify, el catálogo se desincroniza y debemos reconectarlo desde cero.</p></div>
          </div>
          <div class="recordatorio">
            <div class="recordatorio-icon">📦</div>
            <div class="recordatorio-text"><h4>Actualizá el stock de tus productos</h4><p>Cuando vendas o recibas mercadería, actualizá el stock en Shopify para que las redes muestren la disponibilidad correcta.</p></div>
          </div>
          <div class="recordatorio">
            <div class="recordatorio-icon">📖</div>
            <div class="recordatorio-text"><h4>Mini-guía de administración</h4><p>Recibiste una guía PDF con los pasos básicos: agregar productos, ver pedidos y gestionar el stock.</p></div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">4. Soporte post-entrega</div>
        <div class="soporte-box">
          <h3>7 días de soporte incluidos</h3>
          <p>Hasta el <strong><input type="text" style="border:none;border-bottom:1px solid #a855f7;background:transparent;font-size:14px;font-family:inherit;outline:none;width:120px" placeholder="dd/mm/aaaa" /></strong> podés escribirnos por cualquier duda relacionada con el funcionamiento de tu tienda.</p>
          <a href="https://wa.me/56971542893" target="_blank">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Escribir por WhatsApp
          </a>
        </div>
      </div>

      <div class="section firma-section">
        <div class="section-title">5. Confirmación de conformidad</div>
        <p style="font-size:13px;color:#6e6e73;margin-bottom:16px">El cliente confirma haber recibido el proyecto completo y estar conforme con el trabajo entregado.</p>
        <div class="firma-grid">
          <div class="firma-box"><div class="firma-line">Firma del cliente · Fecha</div></div>
          <div class="firma-box"><div class="firma-line">Tu Amigo Digital SpA · Fecha</div></div>
        </div>
      </div>

    </div>
    <div class="doc-footer">
      <p>© Tu Amigo Digital SpA · <a href="mailto:contacto@tuamigospa.cl">contacto@tuamigospa.cl</a></p>
      <p style="color:#888">+56 9 7154 2893</p>
    </div>
  </div>
</body>
</html>
```

- [ ] **Step 2: Verificar en el navegador**

Abrir `kits/protocolo-entrega.html`. Todos los campos de metadatos deben ser editables. El botón de soporte debe abrir WhatsApp. La sección de firmas debe verse bien al imprimir. Probar Ctrl+P.

- [ ] **Step 3: Commit final**

```bash
git add kits/protocolo-entrega.html
git commit -m "feat: kits/protocolo-entrega.html — documento de cierre del proyecto"
```

---

## Checklist de cobertura del spec

| Requisito del spec | Tarea |
|--------------------|-------|
| Página de venta en tuamigodigital.cl/shopify | Tasks 2–5 |
| Hero con propuesta de valor | Task 2 |
| Sección Cómo funciona (4 pasos) | Task 3 |
| Galería de 3 estilos con preview | Task 4 |
| Qué incluye (8 ítems) | Task 5 |
| Precio único + aclaración Shopify | Task 5 |
| CTA WhatsApp | Tasks 2 y 5 |
| Nav integrado al sitio existente | Task 2 |
| Brief del cliente (6 secciones) | Task 6 |
| Checklist Shopify (9 ítems) | Task 7 |
| Checklist Instagram Shopping (4 ítems) | Task 8 |
| Checklist Facebook Shop (4 ítems) | Task 8 |
| Protocolo de entrega (5 secciones) | Task 9 |
| Card del servicio en index.html | Task 1 |

**Decisiones pendientes del spec (no bloqueantes para implementar):**
- Precio: reemplazar `$XXX.000` en `shopify.html` una vez definido
- Temas Shopify base: a elegir en el momento de configurar la primera tienda real
- Formato de docs: los kits son HTML imprimibles → PDF sin herramientas adicionales
