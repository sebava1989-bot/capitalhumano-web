# Video — Sección Apps Showcase

**Fecha:** 2026-05-06  
**Proyecto:** video-argentina (Remotion)  
**Tipo:** Modificación de composiciones existentes + nuevo componente

---

## Objetivo

Agregar una sección "Nuestras Apps" en ambas versiones del video (Short 17s y Long 33s) que muestre las 6 apps de Tu Amigo Digital SpA con un grid animado de 2 columnas.

---

## Apps a mostrar

| App | Emoji | Tagline |
|-----|-------|---------|
| LensLingo | 📷 | Traducción por cámara |
| Alma AI | 🤝 | Tu compañero emocional |
| CapitalHumano | 👥 | Gestión de RR.HH. |
| barberDesk | ✂️ | Sistema para barberías |
| FitPulse | 💪 | Fitness para gimnasios |
| KetoSmart | 🥑 | Dieta keto inteligente |

---

## Nuevo componente

`video-argentina/src/components/AppShowcase.tsx`

- Props: `startFrame: number`
- Header "Nuestras Apps" aparece con TextReveal en startFrame
- Grid 2 columnas × 3 filas, stagger de 6 frames por card
- Cada card: emoji (fontSize 48) + nombre (fontSize 30, #fff, fontWeight 700) + tagline (fontSize 20, #74ACDF)
- Cards con background rgba(255,255,255,0.05), border celeste, borderRadius 16
- Cada card: slide up + fade in via spring

---

## Cambios Short.tsx (450 → 510 frames = 17s)

| Frames | Escena | Cambio |
|--------|--------|--------|
| 0–150 | Título + Mapa | Sin cambio |
| 150–270 | Argentina reveal | Sin cambio |
| 270–345 | Servicios | Comprimido (era 270–360) |
| 345–435 | **AppShowcase** | NUEVO |
| 435–510 | Logo final | Desplazado |

- `durationInFrames`: 450 → 510
- ServiceCards: `startFrame=272` (sin cambio), render guard → `frame >= 270 && frame < 350`
- AppShowcase: `startFrame=347`, render guard → `frame >= 345 && frame < 440`
- LogoFinal: `startFrame=437`, render guard → `frame >= 435`

---

## Cambios Long.tsx (900 → 990 frames = 33s)

| Frames | Escena | Cambio |
|--------|--------|--------|
| 0–600 | Intro → Servicios | Sin cambio |
| 600–690 | **AppShowcase** | NUEVO |
| 690–840 | Tagline | Desplazado (+90) |
| 840–930 | Contacto | Desplazado (+90) |
| 930–990 | Logo final | Desplazado (+90) |

- `durationInFrames`: 900 → 990
- AppShowcase: `startFrame=602`, render guard → `frame >= 600 && frame < 695`
- taglineOpacity range: [745,770] → [835,860], render guard `frame >= 685 && frame < 865`
- WordReveal tagline: `startFrame=695` (era 605)
- contactOpacity range: [830,855] → [920,945], render guard `frame >= 835 && frame < 950`
- contacto render guard: `frame >= 835 && frame < 950`
- LogoFinal: `startFrame=935`, render guard → `frame >= 930`

---

## Composiciones Root.tsx

- `ShortVertical`: 450 → 510 frames
- `ShortHorizontal`: 450 → 510 frames
- `LongVertical`: 900 → 990 frames
- `LongHorizontal`: 900 → 990 frames

---

## Scripts package.json

Sin cambio — apuntan a `src/index.ts` que no cambia.

---

## Criterio de éxito

- Las 6 apps se ven claramente en el grid
- Las transiciones entre servicios → apps → logo son fluidas
- Los 4 videos re-renderizan sin errores
