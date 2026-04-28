'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { crearCampana } from '@/app/[slug]/admin/campanas/actions'
import { toast } from 'sonner'

const TEMPLATE_INACTIVOS = `<h2 style="color:#e8c84a">¡Te echamos de menos!</h2>
<p>Hola {{nombre}}, hace tiempo que no nos visitas.</p>
<p>Reserva esta semana y luce increíble.</p>
<p><a href="https://barberia-saas-gamma.vercel.app" style="color:#e8c84a">Reservar ahora →</a></p>`

const TEMPLATE_NUEVOS = `<h2 style="color:#e8c84a">¡Bienvenido a la familia!</h2>
<p>Hola {{nombre}}, gracias por tu primera visita.</p>
<p>Esperamos haberte dejado con el mejor look.</p>
<p><a href="https://barberia-saas-gamma.vercel.app" style="color:#e8c84a">Reservar de nuevo →</a></p>`

const TEMPLATE_FRECUENTES = `<h2 style="color:#e8c84a">Gracias por ser un cliente frecuente</h2>
<p>Hola {{nombre}}, valoramos tu fidelidad.</p>
<p>¿Ya agendaste tu próxima cita?</p>
<p><a href="https://barberia-saas-gamma.vercel.app" style="color:#e8c84a">Reservar →</a></p>`

const TEMPLATES: Record<string, string> = {
  inactivo: TEMPLATE_INACTIVOS,
  nuevo: TEMPLATE_NUEVOS,
  frecuente: TEMPLATE_FRECUENTES,
  todos: '',
}

export default function NuevaCampanaPage() {
  const params = useParams()
  const router = useRouter()
  const slug = Array.isArray(params.slug) ? params.slug[0] : (params.slug ?? '')

  const [segmento, setSegmento] = useState('todos')
  const [mensajeHtml, setMensajeHtml] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSegmentoChange(s: string) {
    setSegmento(s)
    if (TEMPLATES[s]) setMensajeHtml(TEMPLATES[s])
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set('slug', slug)
    fd.set('mensaje_html', mensajeHtml)
    const result = await crearCampana(fd)
    setLoading(false)
    if (result && 'error' in result) {
      toast.error(result.error)
    } else {
      toast.success('Campaña creada')
      router.push(`/${slug}/admin/campanas`)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Nueva campaña</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
        <div>
          <label className="text-zinc-400 text-xs uppercase tracking-wide block mb-1">Título (interno)</label>
          <input name="titulo" required
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white"
            placeholder="Ej: Recuperación clientes octubre" />
        </div>

        <div>
          <label className="text-zinc-400 text-xs uppercase tracking-wide block mb-1">Asunto del email</label>
          <input name="asunto" required
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white"
            placeholder="Ej: ¡Te echamos de menos en la barbería!" />
        </div>

        <div>
          <label className="text-zinc-400 text-xs uppercase tracking-wide block mb-1">Segmento</label>
          <select
            name="segmento"
            value={segmento}
            onChange={e => handleSegmentoChange(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white"
          >
            <option value="todos">Todos los clientes</option>
            <option value="nuevo">Nuevos (primera visita &lt; 30 días)</option>
            <option value="frecuente">Frecuentes (activos últimos 60 días)</option>
            <option value="inactivo">Inactivos (sin visitas &gt; 60 días)</option>
          </select>
        </div>

        <div>
          <label className="text-zinc-400 text-xs uppercase tracking-wide block mb-1">
            Mensaje HTML <span className="text-zinc-600">— usa {'{{nombre}}'} para personalizar</span>
          </label>
          <textarea
            value={mensajeHtml}
            onChange={e => setMensajeHtml(e.target.value)}
            required
            rows={8}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono text-xs"
            placeholder="<h2>Hola {{nombre}}</h2><p>...</p>"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-yellow-400 text-black font-bold rounded-xl hover:bg-yellow-300 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Guardando…' : 'Guardar borrador'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 bg-zinc-800 text-zinc-400 rounded-xl hover:text-white transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
