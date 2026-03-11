import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Configuração do Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use a service role key para admin
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Usuários a serem criados
const usersToCreate = [
  { email: 'lilian@donnanegociacoes.com.br', role: 'secretaria' },
  { email: 'jamaica@donnanegociacoes.com.br', role: 'secretaria' },
  { email: 'thais@donnanegociacoes.com.br', role: 'secretaria' },
  { email: 'preatendimento@donnanegociacoes.com.br', role: 'secretaria' }
]

const defaultPassword = 'Donna.123'

export async function POST() {
  const results = []
  
  console.log('🚀 Iniciando criação de usuários Secretaria com Admin API...')
  
  // Verificar se service role key está disponível
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({
      error: 'SUPABASE_SERVICE_ROLE_KEY não configurada',
      solution: 'Adicione a service role key nas variáveis de ambiente',
      alternative: 'Use a rota /api/setup-users-simple que não precisa de admin'
    }, { status: 500 })
  }
  
  for (const user of usersToCreate) {
    try {
      console.log(`📧 Criando usuário: ${user.email}`)
      
      // 1. Criar usuário no Auth com auto-confirm
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: defaultPassword,
        email_confirm: true, // Auto-confirmar email
        user_metadata: {
          role: user.role
        }
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          // Verificar se usuário já está ativo tentando fazer login
          const { data: loginData, error: loginError } = await supabaseAdmin.auth.signInWithPassword({
            email: user.email,
            password: defaultPassword
          })
          
          if (!loginError && loginData.user) {
            results.push({
              email: user.email,
              status: 'already_active',
              message: 'Usuário já existe e está ativo! Pode fazer login.'
            })
          } else {
            results.push({
              email: user.email,
              status: 'exists_but_inactive',
              message: 'Usuário existe mas está inativo.'
            })
          }
        } else {
          results.push({
            email: user.email,
            status: 'error',
            message: `Erro ao criar usuário: ${authError.message}`
          })
        }
        continue
      }

      if (!authData.user) {
        results.push({
          email: user.email,
          status: 'error',
          message: 'Usuário criado mas não foi possível obter dados'
        })
        continue
      }

      // 2. Criar/Atualizar profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: user.email,
          role: user.role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (profileError) {
        results.push({
          email: user.email,
          status: 'partial',
          message: `Usuário criado no Auth mas erro no profile: ${profileError.message}`
        })
      } else {
        results.push({
          email: user.email,
          status: 'success',
          message: 'Usuário criado com sucesso e já pode fazer login!'
        })
      }

    } catch (error) {
      results.push({
        email: user.email,
        status: 'error',
        message: `Erro inesperado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      })
    }
  }

  // Resumo final
  const success = results.filter(r => r.status === 'success' || r.status === 'already_active').length
  const partial = results.filter(r => r.status === 'partial').length
  const inactive = results.filter(r => r.status === 'exists_but_inactive').length
  const errors = results.filter(r => r.status === 'error').length

  console.log('✅ Processo concluído!')
  console.log(`📊 Sucessos: ${success}, Parciais: ${partial}, Inativos: ${inactive}, Erros: ${errors}`)

  return NextResponse.json({
    message: 'Processo de criação de usuários concluído com Admin API',
    summary: {
      total: usersToCreate.length,
      success,
      partial,
      inactive,
      errors
    },
    details: results,
    instructions: {
      password: defaultPassword,
      note: 'Usuários criados com auto-confirmação de email.',
      loginUrl: 'http://localhost:3000/login',
      nextStep: 'Teste o login com os usuários criados'
    }
  })
}
