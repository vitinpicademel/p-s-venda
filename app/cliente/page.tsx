"use client";

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
} from "lucide-react";
import { useRouter } from "next/navigation";

// Dados fictícios das etapas
const mockSteps = [
  {
    id: "1",
    stepOrder: 1,
    stepName: "Upload do Contrato",
    stepDescription: "Contrato PDF enviado pela imobiliária",
    status: "completed",
    completedAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    stepOrder: 2,
    stepName: "Engenharia do banco",
    stepDescription: "Análise e aprovação do financiamento bancário",
    status: "completed",
    completedAt: "2024-01-20T14:30:00Z",
  },
  {
    id: "3",
    stepOrder: 3,
    stepName: "Assinatura do contrato bancário",
    stepDescription: "Assinatura do contrato de financiamento",
    status: "completed",
    completedAt: "2024-01-25T09:15:00Z",
  },
  {
    id: "4",
    stepOrder: 4,
    stepName: "Recolhimento de ITBI",
    stepDescription: "Pagamento do Imposto sobre Transmissão de Bens Imóveis",
    status: "pending",
    completedAt: null,
  },
  {
    id: "5",
    stepOrder: 5,
    stepName: "Entrada cartório para registro",
    stepDescription: "Registro da escritura no cartório",
    status: "pending",
    completedAt: null,
  },
  {
    id: "6",
    stepOrder: 6,
    stepName: "Processo Finalizado",
    stepDescription: "Entrega das chaves e conclusão do processo",
    status: "pending",
    completedAt: null,
  },
];

const processInfo = {
  clientName: "Maria Silva",
  propertyAddress: "Rua das Flores, 123 - Centro, São Paulo/SP",
  propertyValue: 450000,
  createdAt: "2024-01-15",
};

const getStepIcon = (stepName: string) => {
  const name = stepName.toLowerCase();
  if (name.includes("contrato")) return FileText;
  if (name.includes("engenharia") || name.includes("banco")) return Building2;
  if (name.includes("assinatura")) return FileCheck;
  if (name.includes("itbi")) return Receipt;
  if (name.includes("cartório") || name.includes("registro")) return ScrollText;
  if (name.includes("finalizado")) return Home;
  return FileText;
};

export default function ClientePage() {
  const router = useRouter();

  const handleLogout = () => {
    router.push("/login");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const completedSteps = mockSteps.filter((step) => step.status === "completed").length;
  const totalSteps = mockSteps.length - 1; // Exclui "Processo Finalizado" da contagem
  const progressPercentage = (completedSteps / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50">
      {/* Header */}
      <header className="bg-[#302521] border-b border-[#302521] shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#d4a574] rounded-lg">
                <Home className="h-6 w-6 text-[#302521]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#d4a574]">Donna Imobiliária</h1>
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
        {/* Info Card */}
        <Card className="mb-8 border-slate-200 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl text-slate-800">Informações do Processo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Cliente</p>
                <p className="text-base text-slate-800 font-semibold">{processInfo.clientName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Valor do Imóvel</p>
                <p className="text-base text-[#d4a574] font-bold">
                  {formatCurrency(processInfo.propertyValue)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Endereço do Imóvel</p>
              <p className="text-base text-slate-700">{processInfo.propertyAddress}</p>
            </div>
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
                {mockSteps.map((step, index) => {
                  const Icon = getStepIcon(step.stepName);
                  const isCompleted = step.status === "completed";
                  const isLast = index === mockSteps.length - 1;

                  return (
                    <div key={step.id} className="relative flex gap-4">
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
                                {step.stepName}
                              </h3>
                              <p
                                className={`text-sm ${
                                  isCompleted ? "text-[#302521]" : "text-slate-600"
                                }`}
                              >
                                {step.stepDescription}
                              </p>
                              {isCompleted && step.completedAt && (
                                <p className="text-xs text-[#d4a574] mt-2 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Concluído em {formatDate(step.completedAt)}
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
      </main>
    </div>
  );
}

