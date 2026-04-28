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
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set({ name, value, ...options })
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
    const slug = slugMatch[1]
    const section = slugMatch[2].split('/')[0]

    if (['admin', 'barbero', 'cliente', 'reservar'].includes(section) && !user) {
      const loginUrl = new URL(`/${slug}/login`, request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    if ((section === 'admin' || section === 'barbero') && user) {
      const { data: userData, error } = await supabase
        .from('users')
        .select('rol, barberia_id')
        .eq('id', user.id)
        .single()

      if (error) {
        return NextResponse.redirect(new URL(`/${slug}/reservar`, request.url))
      }

      const isSuperadmin = userData?.rol === 'superadmin'
      const belongsToTenant = userData?.barberia_id != null

      if (section === 'admin') {
        const canAccess = isSuperadmin || (userData?.rol === 'admin' && belongsToTenant)
        if (!canAccess) {
          return NextResponse.redirect(new URL(`/${slug}/cliente`, request.url))
        }
      }

      if (section === 'barbero') {
        const canAccess = isSuperadmin || (
          ['barbero', 'admin'].includes(userData?.rol ?? '') && belongsToTenant
        )
        if (!canAccess) {
          return NextResponse.redirect(new URL(`/${slug}/cliente`, request.url))
        }
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
