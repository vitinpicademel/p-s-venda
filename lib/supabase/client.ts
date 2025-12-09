import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Durante o build, retorna valores dummy se não houver variáveis
  if (!supabaseUrl || !supabaseAnonKey) {
    // Retorna cliente com valores dummy apenas para evitar erro no build
    // Em runtime, as variáveis devem estar configuradas
    return createBrowserClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder-key'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

