import { createClient } from '@/lib/supabase/client'
import { NextResponse } from 'next/server'

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
      
      // Criar usuário usando o client normal com auto-confirm
      const supabase = createClient()
      
      const { data, error } = await supabase.auth.signUp({
        email: user.email,
        password: defaultPassword,
        options: {
          emailRedirectTo: undefined,
          data: {
            role: user.role
          }
        }
      })

      if (error) {
        if (error.message.includes('already registered')) {
          // Tentar fazer login para ver se o usuário já existe e está ativo
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
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
              message: 'Usuário existe mas precisa confirmar email ou redefinir senha.'
            })
          }
        } else {
          results.push({
            email: user.email,
            status: 'error',
            message: `Erro: ${error.message}`
          })
        }
        continue
      }

      // Se chegou aqui, usuário foi criado mas pode precisar de confirmação
      if (data.user && !data.session) {
        results.push({
          email: user.email,
          status: 'created_needs_confirmation',
          message: 'Usuário criado mas precisa confirmar email. Verifique a caixa de spam.'
        })
      } else if (data.session) {
        results.push({
          email: user.email,
          status: 'success',
          message: 'Usuário criado e já pode fazer login!'
        })
      } else {
        results.push({
          email: user.email,
          status: 'created',
          message: 'Usuário criado. Verifique se precisa confirmar email.'
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
  const needsConfirmation = results.filter(r => r.status === 'created_needs_confirmation').length
  const inactive = results.filter(r => r.status === 'exists_but_inactive').length
  const errors = results.filter(r => r.status === 'error').length

  console.log('✅ Processo concluído!')
  console.log(`📊 Ativos: ${success}, Precisam confirmação: ${needsConfirmation}, Inativos: ${inactive}, Erros: ${errors}`)

  return NextResponse.json({
    message: 'Processo de criação de usuários concluído',
    summary: {
      total: usersToCreate.length,
      success,
      needsConfirmation,
      inactive,
      errors
    },
    details: results,
    instructions: {
      password: defaultPassword,
      note: 'Se usuários precisarem confirmar email, eles devem verificar a caixa de entrada e spam.',
      loginUrl: 'http://localhost:3000/login',
      troubleshooting: {
        case1: 'Se diz "não registrado": usuário não foi criado ou precisa confirmação',
        case2: 'Se diz "senha incorreta": usuário foi criado com senha diferente',
        solution: 'Tente executar o script novamente ou verifique o painel do Supabase'
      }
    }
  })
}

// Método GET para informações
export async function GET() {
  return NextResponse.json({
    message: 'Rota de setup de usuários Secretaria',
    method: 'POST',
    users: usersToCreate.map(u => u.email),
    instructions: {
      howToUse: 'Execute POST nesta rota para criar os usuários',
      directAccess: 'Pode acessar via navegador',
      password: defaultPassword,
      role: 'secretaria'
    }
  })
}
