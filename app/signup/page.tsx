"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, AlertCircle, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ToastContainer, useToast } from "@/components/ui/toast";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toasts, showToast, removeToast } = useToast();

  const getSupabaseClient = () => {
    if (typeof window === 'undefined') return null;
    try {
      return createClient();
    } catch (error) {
      console.error("Erro ao criar cliente Supabase:", error);
      return null;
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const supabase = getSupabaseClient();
    if (!supabase) {
      // Detecta se está rodando na Vercel ou localmente
      const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
      const errorMsg = isVercel
        ? "⚠️ Supabase não configurado na Vercel! Configure as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no painel da Vercel (Settings → Environment Variables). Veja o arquivo CONFIGURAR_VERCEL.md para instruções detalhadas."
        : "⚠️ Supabase não configurado! Configure o arquivo .env.local com os valores reais do seu projeto Supabase (Settings → API). Depois REINICIE o servidor (Ctrl+C e npm run dev). Veja o arquivo COMO_CONFIGURAR_ENV.md para instruções detalhadas.";
      setError(errorMsg);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'client',
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message || "Erro ao criar conta. Verifique suas credenciais.");
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // Verifica se o email precisa ser confirmado
        if (data.user.email_confirmed_at === null) {
          showToast({
            title: "Conta criada!",
            description: "Verifique seu email para confirmar a conta. Ou desabilite a confirmação no Supabase (Authentication → Settings).",
            type: "warning",
          });
        } else {
          showToast({
            title: "Conta criada com sucesso!",
            description: "Redirecionando para login...",
            type: "success",
          });
        }

        // Aguarda um pouco e redireciona para login
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (err: any) {
      console.error("Erro ao criar conta:", err);
      setError(err?.message || "Erro ao criar conta. Verifique se o Supabase está configurado corretamente.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 p-4 relative overflow-hidden">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-50 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <Card className="w-full max-w-md relative z-10 shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="space-y-4 text-center pb-6">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-[#302521] rounded-2xl shadow-lg">
              <Home className="h-8 w-8 text-[#d4a574]" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-[#302521]">
            Donna Negociações Imobiliárias
          </CardTitle>
          <CardDescription className="text-base text-slate-600">
            Crie sua conta para acompanhar seu processo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-slate-700 font-medium">
                Nome Completo
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Seu nome completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-11 border-slate-200 focus:border-[#d4a574] focus:ring-[#d4a574]"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 border-slate-200 focus:border-[#d4a574] focus:ring-[#d4a574]"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-slate-500">
                Use o mesmo email informado pela imobiliária
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-medium">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 border-slate-200 focus:border-[#d4a574] focus:ring-[#d4a574]"
                required
                minLength={6}
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-[#d4a574] hover:bg-[#c49564] text-[#302521] font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? "Criando conta..." : "Criar Conta"}
            </Button>

            <div className="pt-4 border-t border-slate-200">
              <p className="text-xs text-center text-slate-500">
                Já tem uma conta?{" "}
                <Link href="/login" className="text-[#d4a574] hover:underline font-medium">
                  Fazer login
                </Link>
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-sm text-slate-600 hover:text-[#302521] transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}

