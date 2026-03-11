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
  
  console.log('🚀 Iniciando criação de usuários Secretaria...')
  
  for (const user of usersToCreate) {
    try {
      console.log(`📧 Criando usuário: ${user.email}`)
      
      // 1. Criar usuário no Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: defaultPassword,
        email_confirm: true, // Auto-confirmar email
        user_metadata: {
          role: user.role
        }
      })

      if (authError) {
        // Se usuário já existe, apenas atualizamos o profile
        if (authError.message.includes('already registered')) {
          console.log(`⚠️ Usuário ${user.email} já existe, atualizando profile...`)
          
          // Buscar usuário existente na tabela profiles
          const { data: existingProfile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email', user.email)
            .single()
          
          if (existingProfile) {
            // Atualizar profile existente
            const { error: profileError } = await supabaseAdmin
              .from('profiles')
              .update({
                role: user.role,
                updated_at: new Date().toISOString()
              })
              .eq('email', user.email)
            
            if (profileError) {
              results.push({
                email: user.email,
                status: 'error',
                message: `Erro ao atualizar profile: ${profileError.message}`
              })
            } else {
              results.push({
                email: user.email,
                status: 'updated',
                message: 'Usuário já existia, profile atualizado com role secretaria'
              })
            }
          } else {
            results.push({
              email: user.email,
              status: 'error',
              message: 'Usuário já existe mas não foi encontrado na tabela profiles'
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
          message: 'Usuário criado com sucesso com role secretaria'
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
  const success = results.filter(r => r.status === 'success').length
  const updated = results.filter(r => r.status === 'updated').length
  const errors = results.filter(r => r.status === 'error' || r.status === 'partial').length

  console.log('✅ Processo concluído!')
  console.log(`📊 Sucessos: ${success}, Atualizados: ${updated}, Erros: ${errors}`)

  return NextResponse.json({
    message: 'Processo de criação de usuários concluído',
    summary: {
      total: usersToCreate.length,
      success,
      updated,
      errors
    },
    details: results,
    instructions: {
      password: defaultPassword,
      note: 'Todos os usuários foram criados com a senha padrão. Eles devem alterar no primeiro acesso.',
      loginUrl: 'http://localhost:3000/login'
    }
  })
}

// Método GET para permitir acesso via navegador
export async function GET() {
  return NextResponse.json({
    message: 'Rota de setup de usuários Secretaria',
    method: 'POST',
    users: usersToCreate.map(u => u.email),
    instructions: {
      howToUse: 'Faça uma requisição POST para esta rota ou acesse via formulário HTML',
      directAccess: 'Você pode acessar diretamente no navegador para executar',
      password: defaultPassword,
      role: 'secretaria'
    }
  })
}
