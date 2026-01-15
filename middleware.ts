import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Verifica se as variáveis de ambiente estão configuradas
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Se não houver variáveis de ambiente, permite acesso (evita erro na Vercel)
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next()
  }

  // Cria response inicial
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
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

    // Timeout de 5 segundos para evitar MIDDLEWARE_INVOCATION_TIMEOUT
    const getUserPromise = supabase.auth.getUser()
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), 5000)
    )

    let user = null
    try {
      const result = await Promise.race([getUserPromise, timeoutPromise]) as any
      user = result?.data?.user || null
    } catch (error) {
      // Se der timeout ou erro, continua sem autenticação
      // Isso evita que o middleware trave a aplicação
    }

    // Proteção de Rotas
    const pathname = request.nextUrl.pathname

    // Se NÃO estiver logado e tentar acessar área privada
    if (!user && (pathname.startsWith('/admin') || pathname.startsWith('/cliente'))) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Se JÁ estiver logado e tentar acessar login ou cadastro
    if (user && (pathname === '/login' || pathname === '/signup' || pathname === '/')) {
      // Redireciona baseado no email
      if (user.email?.includes('admin') || user.email?.includes('donna')) {
        return NextResponse.redirect(new URL('/admin', request.url))
      } else {
        return NextResponse.redirect(new URL('/cliente', request.url))
      }
    }

    return response
  } catch (error) {
    // Em caso de erro, permite acesso (evita quebrar o site)
    // O erro será tratado nas páginas individuais
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, fonts, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)',
  ],
}