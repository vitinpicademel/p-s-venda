"use client"

import { useState } from 'react'

export default function SetupUsersPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCreateUsers = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/setup-users-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao criar usuários')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Setup Usuários - Secretaria
          </h1>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Usuários a serem criados:
            </h2>
            <div className="bg-gray-50 rounded p-4 space-y-2">
              <div className="flex justify-between">
                <span className="font-mono text-sm">lilian@donnanegociacoes.com.br</span>
                <span className="text-sm text-gray-600">Role: secretaria</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-sm">jamaica@donnanegociacoes.com.br</span>
                <span className="text-sm text-gray-600">Role: secretaria</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-sm">thais@donnanegociacoes.com.br</span>
                <span className="text-sm text-gray-600">Role: secretaria</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-sm">preatendimento@donnanegociacoes.com.br</span>
                <span className="text-sm text-gray-600">Role: secretaria</span>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                <strong>Senha padrão:</strong> Donna.123
              </p>
              <p className="text-sm text-yellow-800 mt-1">
                Os usuários devem alterar a senha no primeiro acesso.
              </p>
            </div>
          </div>

          <button
            onClick={handleCreateUsers}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Criando usuários...' : 'Criar Usuários Secretaria'}
          </button>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded">
              <h3 className="text-red-800 font-semibold mb-2">Erro:</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
              <h3 className="text-green-800 font-semibold mb-2">Resultado:</h3>
              
              <div className="mb-4">
                <div className="text-sm text-green-700">
                  <p>Total: {result.summary.total}</p>
                  <p>Sucessos: {result.summary.success}</p>
                  <p>Já existiam: {result.summary.exists}</p>
                  <p>Erros: {result.summary.errors}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-green-800">Detalhes:</h4>
                {result.details.map((detail: any, index: number) => (
                  <div key={index} className="text-sm text-green-700 border-b border-green-200 pb-1">
                    <div className="flex justify-between">
                      <span className="font-mono">{detail.email}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        detail.status === 'success' ? 'bg-green-100 text-green-800' :
                        detail.status === 'exists' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {detail.status}
                      </span>
                    </div>
                    <p className="text-xs mt-1">{detail.message}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded">
                <p className="text-sm text-blue-800">
                  <strong>Próximo passo:</strong> Verifique se os usuários conseguem fazer login com a senha "Donna.123"
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
