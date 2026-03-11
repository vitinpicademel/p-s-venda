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
      
      // Criar usuário usando o client normal
      const supabase = createClient()
      
      const { data, error } = await supabase.auth.signUp({
        email: user.email,
        password: defaultPassword,
        options: {
          data: {
            role: user.role
          }
        }
      })

      if (error) {
        if (error.message.includes('already registered')) {
          results.push({
            email: user.email,
            status: 'exists',
            message: 'Usuário já existe. Verifique se tem role secretaria.'
          })
        } else {
          results.push({
            email: user.email,
            status: 'error',
            message: `Erro: ${error.message}`
          })
        }
        continue
      }

      results.push({
        email: user.email,
        status: 'success',
        message: 'Usuário criado com sucesso! Verifique o email para confirmação.'
      })

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
  const exists = results.filter(r => r.status === 'exists').length
  const errors = results.filter(r => r.status === 'error').length

  console.log('✅ Processo concluído!')
  console.log(`📊 Sucessos: ${success}, Já existiam: ${exists}, Erros: ${errors}`)

  return NextResponse.json({
    message: 'Processo de criação de usuários concluído',
    summary: {
      total: usersToCreate.length,
      success,
      exists,
      errors
    },
    details: results,
    instructions: {
      password: defaultPassword,
      note: 'Senha padrão para todos os usuários. Eles devem fazer login e alterar a senha.',
      loginUrl: 'http://localhost:3000/login',
      nextStep: 'Se necessário, atualize manualmente a role na tabela profiles para secretaria'
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
