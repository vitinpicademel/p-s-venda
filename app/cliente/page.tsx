"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Clock,
  FileText,
  Building2,
  FileCheck,
  Receipt,
  ScrollText,
  Home,
  LogOut,
  Download,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ToastContainer, useToast } from "@/components/ui/toast";

type Process = {
  id: string;
  client_name: string;
  client_email: string;
  property_address: string | null;
  property_value: number | null;
  contract_url: string | null;
  contract_filename: string | null;
  status_steps: {
    upload: boolean;
    engineering: boolean;
    signature: boolean;
    itbi: boolean;
    registry: boolean;
    delivery: boolean;
  };
  status: "in_progress" | "completed";
  created_at: string;
};

const getStepIcon = (stepName: string) => {
  const name = stepName.toLowerCase();
  if (name.includes("contrato")) return FileText;
  if (name.includes("engenharia") || name.includes("banco")) return Building2;
  if (name.includes("assinatura")) return FileCheck;
  if (name.includes("itbi")) return Receipt;
  if (name.includes("cartório") || name.includes("registro")) return ScrollText;
  if (name.includes("finalizado") || name.includes("entrega")) return Home;
  return FileText;
};

export default function ClientePage() {
  const router = useRouter();
  const [process, setProcess] = useState<Process | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toasts, showToast, removeToast } = useToast();

  const getSupabaseClient = () => {
    if (typeof window === 'undefined') return null;
    return createClient();
  };

  useEffect(() => {
    fetchProcess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProcess = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      setIsLoading(true);
      
      // Busca o usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        router.push("/login");
        return;
      }

      // Busca processo pelo email do cliente
      const { data, error } = await supabase
        .from("processes")
        .select("*")
        .eq("client_email", user.email)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProcess(data as Process);
      }
    } catch (error) {
      console.error("Erro ao buscar processo:", error);
      showToast({
        title: "Erro ao carregar processo",
        description: "Tente recarregar a página",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push("/login");
  };

  const downloadContract = async () => {
    if (!process?.contract_url || !process?.contract_filename) {
      showToast({
        title: "Contrato não disponível",
        description: "O contrato ainda não foi enviado.",
        type: "error",
      });
      return;
    }

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        showToast({
          title: "Erro de conexão",
          description: "Não foi possível conectar ao sistema.",
          type: "error",
        });
        return;
      }

      // Extrair o path do URL público (formato: https://[project].supabase.co/storage/v1/object/public/contracts/[path])
      const urlParts = process.contract_url.split('/contracts/');
      if (urlParts.length < 2) {
        showToast({
          title: "Erro no formato do arquivo",
          description: "Não foi possível identificar o caminho do contrato.",
          type: "error",
        });
        return;
      }

      const filePath = urlParts[1];

      // Baixa o arquivo como 'blob' do Supabase
      const { data, error } = await supabase.storage
        .from('contracts')
        .download(filePath);

      if (error) throw error;

      // Cria um link temporário para forçar o download no navegador
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', process.contract_filename);
      document.body.appendChild(link);
      link.click();

      // Limpa o link e o objeto da memória
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (err: any) {
      console.error('Erro no download do contrato:', err);
      showToast({
        title: "Erro no download",
        description: "Não foi possível baixar o contrato. Tente novamente.",
        type: "error",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const stepsConfig = [
    { key: "upload" as const, name: "Upload do Contrato", description: "Contrato PDF enviado pela imobiliária", icon: FileText },
    { key: "engineering" as const, name: "Engenharia do banco", description: "Análise e aprovação do financiamento bancário", icon: Building2 },
    { key: "signature" as const, name: "Assinatura do contrato bancário", description: "Assinatura do contrato de financiamento", icon: FileCheck },
    { key: "itbi" as const, name: "Recolhimento de ITBI", description: "Pagamento do Imposto sobre Transmissão de Bens Imóveis", icon: Receipt },
    { key: "registry" as const, name: "Entrada cartório para registro", description: "Registro da escritura no cartório", icon: ScrollText },
    { key: "delivery" as const, name: "Processo Finalizado", description: "Entrega das chaves e conclusão do processo", icon: Home },
  ];

  const completedSteps = process
    ? [
        process.status_steps.engineering,
        process.status_steps.signature,
        process.status_steps.itbi,
        process.status_steps.registry,
      ].filter(Boolean).length
    : 0;
  const totalSteps = 4;
  const progressPercentage = process ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <header className="bg-[#302521] border-b border-[#302521] shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#d4a574] rounded-lg">
                <Home className="h-6 w-6 text-[#302521]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#d4a574]">Donna Negociações Imobiliárias</h1>
                <p className="text-sm text-amber-100">Acompanhamento do Processo</p>
              </div>
            </div>
            <Button onClick={handleLogout} variant="outline" className="gap-2 border-[#d4a574] text-[#d4a574] hover:bg-[#d4a574] hover:text-[#302521]">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4a574] mx-auto mb-4"></div>
              <p className="text-slate-500">Carregando seu processo...</p>
            </CardContent>
          </Card>
        ) : !process ? (
          /* Empty State */
          <Card className="text-center py-12 border-slate-200 shadow-md">
            <CardContent>
              <div className="p-4 bg-amber-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <FileText className="h-10 w-10 text-[#d4a574]" />
              </div>
              <h3 className="text-2xl font-semibold text-[#302521] mb-3">
                Nenhum processo encontrado
              </h3>
              <p className="text-base text-slate-600 mb-2">
                Não encontramos nenhum processo para este email.
              </p>
              <p className="text-sm text-slate-500 mb-6">
                Entre em contato com a Donna Negociações Imobiliárias para mais informações.
              </p>
              <Button
                onClick={handleLogout}
                className="bg-[#d4a574] hover:bg-[#c49564] text-[#302521]"
              >
                Sair
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Info Card */}
            <Card className="mb-8 border-slate-200 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl text-slate-800">Informações do Processo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Cliente</p>
                    <p className="text-base text-slate-800 font-semibold">{process.client_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Valor do Imóvel</p>
                    <p className="text-base text-[#d4a574] font-bold">
                      {process.property_value ? formatCurrency(process.property_value) : "Não informado"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Endereço do Imóvel</p>
                  <p className="text-base text-slate-700">{process.property_address || "Não informado"}</p>
                </div>
                {process.contract_filename && (
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Contrato</p>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-600" />
                      <p className="text-sm text-slate-700 flex-1 truncate">{process.contract_filename}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={downloadContract}
                        className="gap-2 flex-shrink-0"
                      >
                        <Download className="h-3 w-3" />
                        Baixar
                      </Button>
                    </div>
                  </div>
                )}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Progresso Geral</span>
                    <span className="text-sm font-semibold text-[#d4a574]">
                      {completedSteps}/{totalSteps} etapas concluídas
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-[#d4a574] h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="border-slate-200 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl text-slate-800">Linha do Tempo do Processo</CardTitle>
                <CardDescription>Acompanhe o status de cada etapa até a entrega das chaves</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200" />

                  {/* Steps */}
                  <div className="space-y-6">
                    {stepsConfig.map((stepConfig, index) => {
                      const Icon = stepConfig.icon;
                      const isCompleted = process.status_steps[stepConfig.key];
                      const isLast = index === stepsConfig.length - 1;

                      return (
                        <div key={stepConfig.key} className="relative flex gap-4">
                          {/* Icon Circle */}
                          <div
                            className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200 ${
                              isCompleted
                                ? "bg-[#d4a574] border-[#d4a574] text-[#302521] shadow-lg"
                                : "bg-white border-slate-300 text-slate-400"
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="h-6 w-6" />
                            ) : (
                              <Icon className="h-5 w-5" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 pb-6">
                            <div
                              className={`p-4 rounded-lg border transition-all duration-200 ${
                                isCompleted
                                  ? "bg-amber-50 border-[#d4a574] shadow-sm"
                                  : "bg-slate-50 border-slate-200"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <h3
                                    className={`font-semibold mb-1 ${
                                      isCompleted ? "text-[#302521]" : "text-slate-700"
                                    }`}
                                  >
                                    {stepConfig.name}
                                  </h3>
                                  <p
                                    className={`text-sm ${
                                      isCompleted ? "text-[#302521]" : "text-slate-600"
                                    }`}
                                  >
                                    {stepConfig.description}
                                  </p>
                                  {isCompleted && (
                                    <p className="text-xs text-[#d4a574] mt-2 flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      Etapa concluída
                                    </p>
                                  )}
                                  {!isCompleted && (
                                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      Aguardando conclusão
                                    </p>
                                  )}
                                </div>
                                {isCompleted && (
                                  <CheckCircle2 className="h-5 w-5 text-[#d4a574] flex-shrink-0" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
