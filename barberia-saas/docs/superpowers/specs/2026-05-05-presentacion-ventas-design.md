# Presentación de Ventas — Barbería SaaS

**Fecha:** 2026-05-05
**Formato:** Landing page + guión de presentación en persona / video
**Precio del producto:** $15.000 CLP/mes por barbería
**Target:** Dueños de barberías independientes y cadenas con múltiples locales
**Tono:** Cercano y directo

---

## Enfoque: Historia de transformación

La presentación sigue la estructura **dolor → transformación → solución → precio → CTA**. El hilo conductor es la historia de "Don Rodrigo", un dueño de barbería con quien el cliente potencial se identifica.

---

## Landing Page

### 1. Hero
**Titular:**
> "Don Rodrigo perdía 2 horas al día en WhatsApp. Ahora su barbería se llena sola."

**Subtítulo:**
> Sistema de reservas, clientes y marketing para tu barbería — $15.000/mes.

**CTA primario:** Quiero verlo en acción

---

### 2. El Antes *(identificación con el dolor)*

Tres tarjetas:
- 📱 Reservas por WhatsApp que se pierden o se olvidan
- 📊 Sin idea de qué servicio vende más ni quién es tu mejor cliente
- 😶 Clientes que no vuelven porque nadie los llama

---

### 3. El Después *(la transformación)*

Mismas tres tarjetas, resueltas:
- ✅ Reservas online 24/7 desde el celular del cliente
- ✅ Panel con estadísticas reales de tu negocio
- ✅ Sistema de referidos y descuentos automáticos que fideliza

---

### 4. Así Funciona *(features clave)*

- Reserva en 3 pasos: barbero → servicio → hora
- App admin para el dueño (Flutter mobile)
- Recordatorios automáticos por email 24h antes
- Campañas de descuentos masivos con IA personalizada
- Sistema de referidos con descuento automático al referidor y referido
- Código QR imprimible con link de WhatsApp para el local

*(Sección visual: capturas de pantalla o mockups de la app)*

---

### 5. Precio

> "Todo esto por $15.000 al mes. Sin contrato. Sin letra chica."

---

### 6. CTA Final

> "¿Le das una oportunidad a tu barbería?"

**CTA:** Agendar demo gratuita

---

## Guión de Presentación (en persona / video ~3 min)

### Apertura (0:00 – 0:30)
> "Cuéntame una cosa — ¿cuántos mensajes de WhatsApp recibiste esta semana solo para coordinar horas? ¿10? ¿20? ¿Más?
> Eso es tiempo que no estás cortando pelo. Tiempo que no estás ganando plata."

### La Historia (0:30 – 1:30)
> "Don Rodrigo tiene una barbería en Maipú. Buena clientela, buenos barberos. Pero vivía pegado al celular respondiendo mensajes, y aun así la agenda tenía huecos.
> No sabía cuál de sus servicios dejaba más plata. No sabía quiénes eran sus clientes más fieles. Y cuando un cliente dejaba de venir... simplemente desaparecía.
> Hoy Don Rodrigo abre el panel en el celular, ve la agenda del día, sabe qué servicios están volando y manda descuentos a sus clientes con un clic. Todo desde la app."

### La Solución (1:30 – 2:30)
> "Esto es **barberDesk**. Un sistema completo para tu barbería:
> — Tus clientes reservan online, solos, a cualquier hora.
> — Tú ves todo en un panel: agenda, estadísticas, clientes.
> — El sistema manda recordatorios automáticos para que nadie se olvide.
> — Y cuando quieres llenar la semana, mandas una campaña de descuentos en dos clics."

*(Aquí va la demo en vivo o capturas de pantalla)*

### El Precio (2:30 – 2:50)
> "¿Cuánto cuesta todo esto? Quince mil pesos al mes. Sin contrato, sin letra chica. Si no te sirve, lo cancelas. Pero te apuesto que no vas a querer."

### Cierre (2:50 – 3:00)
> "¿Le damos una oportunidad a tu barbería? Te armo una demo gratis esta semana y lo ves funcionando con tu nombre."

---

## Notas de implementación

- La landing page se construye sobre el stack existente: Next.js 16 + TailwindCSS 4
- Puede vivir en una ruta pública `/` (home) o en un subdominio separado
- Las capturas de pantalla deben tomarse desde la demo: `barberia-saas-gamma.vercel.app/barberia-demo`
- El formulario de "Agendar demo" puede conectarse a un webhook de WhatsApp o email vía Resend
