import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // No Next.js, variáveis NEXT_PUBLIC_ são injetadas no build e disponíveis no browser
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Verifica se as variáveis estão configuradas (não são placeholders)
  if (!supabaseUrl || !supabaseAnonKey || 
      supabaseUrl === 'https://seu-projeto.supabase.co' || 
      supabaseUrl.includes('seu-projeto') ||
      supabaseAnonKey === 'sua_chave_anonima_aqui' ||
      supabaseAnonKey.includes('sua_chave')) {
    // Retorna null para indicar que não está configurado
    // Isso será tratado nas páginas
    return null as any
  }

  try {
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.error('Erro ao criar cliente Supabase:', error)
    return null as any
  }
}

