import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const slugMatch = pathname.match(/^\/([^/]+)\/(.+)/)

  if (slugMatch) {
    const section = slugMatch[2].split('/')[0]

    if (['admin', 'barbero', 'cliente'].includes(section) && !user) {
      const loginUrl = new URL(`/${slugMatch[1]}/reservar`, request.url)
      loginUrl.searchParams.set('login', 'true')
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (section === 'admin' && user) {
      const { data: userData } = await supabase
        .from('users')
        .select('rol')
        .eq('id', user.id)
        .single()

      if (userData?.rol !== 'admin' && userData?.rol !== 'superadmin') {
        return NextResponse.redirect(new URL(`/${slugMatch[1]}/cliente`, request.url))
      }
    }

    if (section === 'barbero' && user) {
      const { data: userData } = await supabase
        .from('users')
        .select('rol')
        .eq('id', user.id)
        .single()

      if (userData?.rol !== 'barbero' && userData?.rol !== 'admin' && userData?.rol !== 'superadmin') {
        return NextResponse.redirect(new URL(`/${slugMatch[1]}/cliente`, request.url))
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
