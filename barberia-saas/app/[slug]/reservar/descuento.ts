'use server'
import { createClient } from '@/lib/supabase/server'

export interface DescuentoAlianza {
  alianzaId: string
  nombre: string
  descuentoPct: number
  monto: number
  requiereCodigo: boolean
}

export async function calcularDescuentoAlianza(
  barberiaId: string,
  servicioId: string,
  fechaHora: string,
  codigo?: string
): Promise<DescuentoAlianza | null> {
  const supabase = await createClient()

  const { data: alianzas } = await supabase
    .from('alianzas')
    .select('id, nombre, descuento_pct, dias_semana, servicio_ids, requiere_codigo, codigo_acceso')
    .eq('barberia_id', barberiaId)
    .eq('activo', true)
    .not('descuento_pct', 'is', null)

  if (!alianzas?.length) return null

  const diaSemana = new Date(fechaHora).getDay()

  const aplicable = alianzas.find(a => {
    const dias = a.dias_semana as number[] | null
    const servicios = a.servicio_ids as string[] | null

    if (dias && !dias.includes(diaSemana)) return false
    if (servicios && !servicios.includes(servicioId)) return false
    if (a.requiere_codigo) {
      if (!codigo || codigo.trim().toLowerCase() !== (a.codigo_acceso ?? '').trim().toLowerCase()) return false
    }
    return true
  })

  if (!aplicable) return null

  // Obtener precio del servicio para calcular monto
  const { data: servicio } = await supabase
    .from('servicios').select('precio').eq('id', servicioId).maybeSingle()
  const precio = servicio?.precio ?? 0
  const monto = Math.round(precio * (aplicable.descuento_pct as number) / 100)

  return {
    alianzaId: aplicable.id,
    nombre: aplicable.nombre,
    descuentoPct: aplicable.descuento_pct as number,
    monto,
    requiereCodigo: aplicable.requiere_codigo,
  }
}
