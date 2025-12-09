import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // 1. Tenta pegar o usuário
  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log('Middleware Check:', request.nextUrl.pathname, user?.email ? 'Logado: ' + user.email : 'Não Logado')

  // 2. Proteção de Rotas
  // Se NÃO estiver logado e tentar acessar área privada (admin ou cliente)
  if (!user && (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/cliente'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Se JÁ estiver logado e tentar acessar login ou cadastro
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup' || request.nextUrl.pathname === '/')) {
    // Redireciona baseado no email
    if (user.email?.includes('admin') || user.email?.includes('donna')) {
      return NextResponse.redirect(new URL('/admin', request.url))
    } else {
      return NextResponse.redirect(new URL('/cliente', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}