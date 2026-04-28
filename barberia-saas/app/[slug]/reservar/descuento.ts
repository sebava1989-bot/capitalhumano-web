'use server'
import { createClient } from '@/lib/supabase/server'

export interface DescuentoAlianza {
  alianzaId: string
  nombre: string
  descuentoPct: number
  monto: number
  requiereCodigo: boolean
  maxUsosPorCliente: number | null
}

export async function calcularDescuentoAlianza(
  barberiaId: string,
  servicioId: string,
  fechaHora: string,
  codigo?: string,
  clienteId?: string
): Promise<DescuentoAlianza | null> {
  const supabase = await createClient()

  const { data: alianzas } = await supabase
    .from('alianzas')
    .select('id, nombre, descuento_pct, dias_semana, servicio_ids, requiere_codigo, codigo_acceso, max_usos_por_cliente')
    .eq('barberia_id', barberiaId)
    .eq('activo', true)
    .not('descuento_pct', 'is', null)

  if (!alianzas?.length) return null

  const diaSemana = new Date(fechaHora).getDay()

  type AlianzaRow = NonNullable<typeof alianzas>[0]

  function cumpleRestriccionesDiasServicio(a: AlianzaRow) {
    const dias = a.dias_semana as number[] | null
    const servicios = a.servicio_ids as string[] | null
    if (dias && !dias.includes(diaSemana)) return false
    if (servicios && !servicios.includes(servicioId)) return false
    return true
  }

  let aplicable: AlianzaRow | null = null

  // 1. Prioridad: alianzas asignadas manualmente por el admin (bypass de código)
  if (clienteId) {
    const { data: asignaciones } = await supabase
      .from('alianza_clientes')
      .select('alianza_id')
      .eq('cliente_id', clienteId)

    if (asignaciones?.length) {
      const idsAsignados = new Set(asignaciones.map(a => a.alianza_id as string))
      aplicable = alianzas.find(a => idsAsignados.has(a.id) && cumpleRestriccionesDiasServicio(a)) ?? null
    }
  }

  // 2. Fallback: alianza por código o automática (sin código requerido)
  if (!aplicable) {
    aplicable = alianzas.find(a => {
      if (!cumpleRestriccionesDiasServicio(a)) return false
      if (a.requiere_codigo) {
        if (!codigo || codigo.trim().toLowerCase() !== (a.codigo_acceso ?? '').trim().toLowerCase()) return false
      }
      return true
    }) ?? null
  }

  if (!aplicable) return null

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
    maxUsosPorCliente: (aplicable as { max_usos_por_cliente?: number | null }).max_usos_por_cliente ?? null,
  }
}
