/**
 * Crea una nueva barbería con su admin en Supabase.
 *
 * Uso:
 *   BARBERIA_NOMBRE="Cortes Estilo" BARBERIA_CODIGO="STYLE2024" ADMIN_PASSWORD="Pass1234!" \
 *   npx ts-node --esm scripts/crear-barberia.ts
 *
 * Requiere variables de entorno:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const nombre = process.env.BARBERIA_NOMBRE
const codigo = process.env.BARBERIA_CODIGO?.toUpperCase().trim()
const password = process.env.ADMIN_PASSWORD

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
if (!nombre || !codigo || !password) {
  console.error('❌ Faltan BARBERIA_NOMBRE, BARBERIA_CODIGO o ADMIN_PASSWORD')
  process.exit(1)
}
if (!/^[A-Z0-9]{4,12}$/.test(codigo)) {
  console.error('❌ BARBERIA_CODIGO debe ser 4-12 caracteres alfanuméricos en mayúsculas (ej: STYLE2024)')
  process.exit(1)
}
if (password.length < 8) {
  console.error('❌ ADMIN_PASSWORD debe tener al menos 8 caracteres')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const slug = codigo.toLowerCase()
const email = `${slug}@barberia.local`

async function main() {
  console.log(`\n🏪 Creando barbería: ${nombre} (código: ${codigo})\n`)

  // 1. Insertar en barberias
  const { data: barberia, error: barberiaError } = await supabase
    .from('barberias')
    .insert({ nombre, codigo, slug, activo: true })
    .select('id')
    .single()

  if (barberiaError) {
    if (barberiaError.message.includes('duplicate') || barberiaError.message.includes('unique')) {
      console.error(`❌ Ya existe una barbería con código "${codigo}" o slug "${slug}"`)
    } else {
      console.error('❌ Error creando barbería:', barberiaError.message)
    }
    process.exit(1)
  }

  console.log(`✅ Barbería creada: ${barberia.id}`)

  // 2. Crear usuario en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    console.error('❌ Error creando usuario auth:', authError.message)
    // Revertir barbería
    await supabase.from('barberias').delete().eq('id', barberia.id)
    process.exit(1)
  }

  const userId = authData.user.id
  console.log(`✅ Usuario auth creado: ${userId}`)

  // 3. Crear perfil en users
  const { error: userError } = await supabase
    .from('users')
    .insert({ id: userId, email, rol: 'admin', barberia_id: barberia.id })

  if (userError) {
    console.error('❌ Error creando perfil users:', userError.message)
    await supabase.auth.admin.deleteUser(userId)
    await supabase.from('barberias').delete().eq('id', barberia.id)
    process.exit(1)
  }

  console.log(`✅ Perfil admin creado\n`)
  console.log('─'.repeat(40))
  console.log(`🏪 Barbería:    ${nombre}`)
  console.log(`🔑 Código:      ${codigo}`)
  console.log(`🔒 Contraseña:  ${password}`)
  console.log(`🌐 URL admin:   /admin-login`)
  console.log(`🌐 Landing:     /${slug}`)
  console.log('─'.repeat(40))
  console.log('\n✅ Listo. El admin puede ingresar en /admin-login con el código y contraseña.\n')
}

main().catch(err => {
  console.error('❌ Error inesperado:', err)
  process.exit(1)
})
