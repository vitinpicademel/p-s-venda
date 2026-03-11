"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ToastContainer, useToast } from "@/components/ui/toast";
import {
  FileText,
  CheckCircle2,
  Clock,
  LogOut,
  FileCheck,
  ClipboardList,
  Barcode,
  ScrollText,
  KeyRound,
  Edit,
  Eye,
  Search,
  Home,
  AlertTriangle,
  Calendar,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import ProcessDocumentsList from "@/components/ProcessDocumentsList";
import ProcessHistory from "@/components/ProcessHistory";

// Configuração das etapas do processo - EXATAMENTE como solicitado
const stepsConfig = [
  { key: "upload" as const, name: "Upload do Contrato", description: "Contrato PDF enviado pela imobiliária", icon: FileText },
  { key: "solicitacao_engenharia" as const, name: "Solicitação Engenharia", description: "Solicitação de vistoria enviada ao banco", icon: ClipboardList },
  { key: "envio_boleto_cliente" as const, name: "Envio de Boleto", description: "Boleto da taxa de avaliação enviado", icon: Barcode },
  { key: "laudo" as const, name: "Laudo", description: "Emissão e validação do laudo de engenharia", icon: FileCheck },
  { key: "signature" as const, name: "Assinatura Bancária", description: "Assinatura do contrato de financiamento", icon: FileText },
  { key: "itbi" as const, name: "Recolhimento do ITBI", description: "Pagamento do Imposto sobre Transmissão de Bens Imóveis", icon: FileText },
  { key: "registry" as const, name: "Entrada cartório para registro", description: "Registro da escritura no cartório", icon: ScrollText },
  { key: "delivery" as const, name: "Entrega de chaves", description: "Entrega das chaves e conclusão do processo", icon: KeyRound },
];

// Configuração das colunas do Kanban com SLA
const kanbanColumns = [
  { key: "upload", name: "Upload do Contrato", slaDays: 1, color: "bg-blue-50 border-blue-200" },
  { key: "solicitacao_engenharia", name: "Solicitação Engenharia", slaDays: 2, color: "bg-purple-50 border-purple-200" },
  { key: "envio_boleto_cliente", name: "Envio de Boleto", slaDays: 1, color: "bg-orange-50 border-orange-200" },
  { key: "laudo", name: "Laudo", slaDays: 5, color: "bg-green-50 border-green-200" },
  { key: "signature", name: "Assinatura Bancária", slaDays: 3, color: "bg-indigo-50 border-indigo-200" },
  { key: "itbi", name: "Recolhimento do ITBI", slaDays: 7, color: "bg-red-50 border-red-200" },
  { key: "registry", name: "Entrada cartório para registro", slaDays: 10, color: "bg-yellow-50 border-yellow-200" },
  { key: "delivery", name: "Entrega de chaves", slaDays: 2, color: "bg-emerald-50 border-emerald-200" },
];

// Tipo para processo (do Supabase)
type Process = {
  id: string;
  client_name: string;
  client_email: string;
  property_address: string | null;
  property_value: number | null;
  observations: string | null;
  contract_url: string | null;
  contract_filename: string | null;
  status_steps: {
    upload: boolean;
    solicitacao_engenharia: boolean;
    envio_boleto_cliente: boolean;
    laudo: boolean;
    signature: boolean;
    itbi: boolean;
    registry: boolean;
    delivery: boolean;
  };
  status: "in_progress" | "completed";
  created_at: string;
  updated_at: string;
};

export default function KanbanBoard() {
  const router = useRouter();
  const [processes, setProcesses] = useState<Process[]>([]);
  const [filteredProcesses, setFilteredProcesses] = useState<Process[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [isReadOnlyView, setIsReadOnlyView] = useState(false);
  const [isEditingProcess, setIsEditingProcess] = useState(false);
  const [editFormData, setEditFormData] = useState({
    client_name: "",
    property_address: "",
  });
  const [observationsText, setObservationsText] = useState("");
  const [isSavingObservations, setIsSavingObservations] = useState(false);
  const { toasts, showToast, removeToast } = useToast();

  // Buscar processos do Supabase
  useEffect(() => {
    fetchProcesses();
  }, []);

  // Filtrar processos baseado na busca
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProcesses(processes);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = processes.filter(
      (process) =>
        process.client_name.toLowerCase().includes(query) ||
        process.client_email.toLowerCase().includes(query) ||
        (process.property_address?.toLowerCase().includes(query) ?? false)
    );
    setFilteredProcesses(filtered);
  }, [searchQuery, processes]);

  const getSupabaseClient = () => {
    if (typeof window === 'undefined') return null;
    return createClient();
  };

  const fetchProcesses = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("processes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        const normalized = (data as any[]).map((p) => {
          const steps = p.status_steps || {};
          const legacyEngineering = !!steps.engineering;

          return {
            ...p,
            status_steps: {
              upload: !!steps.upload,
              solicitacao_engenharia: steps.solicitacao_engenharia ?? legacyEngineering,
              envio_boleto_cliente: steps.envio_boleto_cliente ?? legacyEngineering,
              laudo: steps.laudo ?? legacyEngineering,
              signature: !!steps.signature,
              itbi: !!steps.itbi,
              registry: !!steps.registry,
              delivery: !!steps.delivery,
            },
          };
        }) as Process[];

        setProcesses(normalized);
        setFilteredProcesses(normalized);
      }
    } catch (error) {
      console.error("Erro ao buscar processos:", error);
      showToast({
        title: "Erro ao carregar processos",
        description: "Tente recarregar a página",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para determinar em qual coluna o processo deve estar
  const getCurrentStep = (statusSteps: Process["status_steps"]) => {
    // Se todas as etapas estão concluídas, está na última coluna
    if (statusSteps.delivery) return "delivery";
    
    // Procura pela primeira etapa que NÃO está concluída
    const stepOrder = [
      "upload",
      "solicitacao_engenharia", 
      "envio_boleto_cliente",
      "laudo",
      "signature",
      "itbi",
      "registry",
      "delivery"
    ];
    
    for (const stepKey of stepOrder) {
      if (!statusSteps[stepKey as keyof Process["status_steps"]]) {
        return stepKey;
      }
    }
    
    // Se todas estiverem concluídas (exceto delivery que já foi verificado)
    return "delivery";
  };

  // Função para calcular dias corridos
  const getDaysInCurrentStep = (process: Process) => {
    const currentStep = getCurrentStep(process.status_steps);
    
    // Para a primeira etapa, usa a data de criação
    if (currentStep === "upload") {
      return Math.floor((Date.now() - new Date(process.created_at).getTime()) / (1000 * 60 * 60 * 24));
    }
    
    // Para outras etapas, precisaríamos da data quando a etapa anterior foi concluída
    // Por enquanto, usa a data de atualização como aproximação
    return Math.floor((Date.now() - new Date(process.updated_at).getTime()) / (1000 * 60 * 60 * 24));
  };

  // Verificar se processo está atrasado
  const isOverdue = (process: Process) => {
    const currentStep = getCurrentStep(process.status_steps);
    const columnConfig = kanbanColumns.find(col => col.key === currentStep);
    if (!columnConfig || columnConfig.slaDays === 0) return false;
    
    const daysInStep = getDaysInCurrentStep(process);
    return daysInStep > columnConfig.slaDays;
  };

  // Agrupar processos por coluna
  const getProcessesByColumn = (columnKey: string) => {
    return filteredProcesses.filter(process => {
      const currentStep = getCurrentStep(process.status_steps);
      return currentStep === columnKey;
    });
  };

  const handleOpenSheet = (processId: string, readOnly: boolean = false) => {
    setSelectedProcessId(processId);
    setIsEditingProcess(false);
    setIsReadOnlyView(readOnly);
    const process = processes.find((p) => p.id === processId);
    if (process) {
      setEditFormData({
        client_name: process.client_name,
        property_address: process.property_address || "",
      });
      setObservationsText(process.observations || "");
    }
  };

  const handleStepToggle = async (processId: string, stepKey: keyof Process["status_steps"]) => {
    const supabase = getSupabaseClient();
    if (!supabase || isReadOnlyView) return;

    const process = processes.find((p) => p.id === processId);
    if (!process) return;

    const currentSteps = { ...process.status_steps };
    const previousSteps = { ...process.status_steps };
    const previousStatus = process.status;

    const novoValor = !currentSteps[stepKey];
    currentSteps[stepKey] = novoValor;

    // Se todas as etapas intermediárias estão concluídas, marca entrega como concluída
    const intermediateSteps = [
      currentSteps.solicitacao_engenharia,
      currentSteps.envio_boleto_cliente,
      currentSteps.laudo,
      currentSteps.signature,
      currentSteps.itbi,
      currentSteps.registry,
    ];
    const allIntermediateCompleted = intermediateSteps.every(Boolean);
    if (allIntermediateCompleted) {
      currentSteps.delivery = true;
    }

    const status = allIntermediateCompleted ? "completed" : "in_progress";

    // Optimistic UI
    setProcesses((prev) =>
      prev.map((p) =>
        p.id === processId
          ? { ...p, status_steps: currentSteps, status }
          : p
      )
    );

    setFilteredProcesses((prev) =>
      prev.map((p) =>
        p.id === processId
          ? { ...p, status_steps: currentSteps, status }
          : p
      )
    );

    try {
      const { error } = await supabase
        .from("processes")
        .update({
          status_steps: currentSteps,
          status,
        })
        .eq("id", processId);

      if (error) throw error;

      showToast({
        title: "Status da etapa atualizado",
        description: `Etapa "${stepKey}" ${novoValor ? "marcada como concluída" : "marcada como pendente"}`,
        type: "success",
      });
    } catch (error: any) {
      // Rollback em caso de erro
      setProcesses((prev) =>
        prev.map((p) =>
          p.id === processId
            ? { ...p, status_steps: previousSteps, status: previousStatus }
            : p
        )
      );

      setFilteredProcesses((prev) =>
        prev.map((p) =>
          p.id === processId
            ? { ...p, status_steps: previousSteps, status: previousStatus }
            : p
        )
      );

      showToast({
        title: "Erro ao atualizar etapa",
        description: error?.message || "Tente novamente",
        type: "error",
      });
    }
  };

  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push("/login");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 overflow-hidden">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <header className="bg-[#302521] border-b border-[#302521] shadow-sm">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#d4a574] rounded-lg">
                <Home className="h-6 w-6 text-[#302521]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#d4a574]">Donna Negociações Imobiliárias</h1>
                <p className="text-sm text-amber-100">Kanban Board - Gestão de Processos</p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="gap-2 border-[#d4a574] text-[#d4a574] hover:bg-[#d4a574] hover:text-[#302521]"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Barra de Busca */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar por nome, email ou endereço..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base border-slate-200 focus:border-[#d4a574] focus:ring-[#d4a574]"
            />
          </div>
        </div>

        {/* Kanban Board */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-500">Carregando processos...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="grid grid-cols-8 gap-4 min-w-[1400px]">
              {kanbanColumns.map((column) => {
                const columnProcesses = getProcessesByColumn(column.key);
                const overdueCount = columnProcesses.filter(p => isOverdue(p)).length;
                
                return (
                  <div key={column.key} className={`${column.color} rounded-lg border min-h-[600px] flex flex-col`}>
                    {/* Header da Coluna */}
                    <div className="p-4 border-b border-current border-opacity-20">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-sm text-slate-800">{column.name}</h3>
                        <div className="flex items-center gap-2">
                          {overdueCount > 0 && (
                            <div className="flex items-center text-red-600">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              <span className="text-xs font-bold">{overdueCount}</span>
                            </div>
                          )}
                          <span className="bg-white bg-opacity-70 px-2 py-1 rounded-full text-xs font-medium text-slate-700">
                            {columnProcesses.length}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center text-xs text-slate-600">
                        <Clock className="h-3 w-3 mr-1" />
                        SLA: {column.slaDays} dias
                      </div>
                    </div>

                    {/* Lista de Processos */}
                    <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                      {columnProcesses.map((process) => {
                        const isProcessOverdue = isOverdue(process);
                        const daysInStep = getDaysInCurrentStep(process);
                        
                        return (
                          <div
                            key={process.id}
                            className="group cursor-pointer hover:bg-white hover:shadow-md rounded-lg p-3 transition-all duration-200"
                            onClick={() => handleOpenSheet(process.id, false)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${
                                  isProcessOverdue 
                                    ? 'text-red-600 font-bold' 
                                    : 'text-slate-900'
                                }`}>
                                  {process.client_name}
                                </p>
                                <div className="flex items-center mt-1 space-x-2">
                                  <span className="text-xs text-slate-500">
                                    {process.property_address?.split(',')[0] || 'Sem endereço'}
                                  </span>
                                  {isProcessOverdue && (
                                    <div className="flex items-center text-red-600">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      <span className="text-xs font-medium">
                                        {daysInStep}d
                                      </span>
                                    </div>
                                  )}
                                  {!isProcessOverdue && column.slaDays > 0 && (
                                    <span className="text-xs text-slate-400">
                                      {daysInStep}d
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Indicadores adicionais */}
                            <div className="flex items-center mt-2 space-x-3 text-xs text-slate-500">
                              {process.property_value && (
                                <div className="flex items-center">
                                  R$ {formatCurrency(process.property_value).split(',')[0]}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      
                      {columnProcesses.length === 0 && (
                        <div className="text-center py-8 text-slate-400">
                          <FileText className="w-6 h-6 mx-auto mb-2 opacity-50" />
                          <p className="text-xs">Nenhum processo</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Sheet - Painel Lateral de Detalhes */}
      <Sheet
        open={selectedProcessId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedProcessId(null);
            setIsReadOnlyView(false);
            setIsEditingProcess(false);
          }
        }}
      >
        <SheetContent className="w-full sm:max-w-lg flex flex-col h-full max-h-screen min-h-0 overflow-hidden">
          {selectedProcessId && (() => {
            const selectedProcess = processes.find((p) => p.id === selectedProcessId);
            if (!selectedProcess) return null;

            const currentStep = getCurrentStep(selectedProcess.status_steps);
            const daysInStep = getDaysInCurrentStep(selectedProcess);
            const isProcessOverdue = isOverdue(selectedProcess);
            const columnConfig = kanbanColumns.find(col => col.key === currentStep);

            return (
              <>
                <SheetHeader className="flex-none">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <SheetTitle className="text-2xl text-slate-800">
                        {selectedProcess.client_name}
                      </SheetTitle>
                      <SheetDescription className="text-base text-slate-600">
                        {selectedProcess.property_address || "Endereço não informado"}
                      </SheetDescription>
                    </div>
                  </div>
                </SheetHeader>

                <div className="flex-1 min-h-0 overflow-y-auto mt-6 space-y-6 pr-2">
                  {/* Status Atual e SLA */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-slate-800">Status Atual</h3>
                        {isProcessOverdue && (
                          <div className="flex items-center text-red-600">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            <span className="text-sm font-bold">ATRASADO</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Etapa:</span>
                          <span className="text-sm font-medium text-slate-900">
                            {columnConfig?.name || currentStep}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Tempo na etapa:</span>
                          <span className={`text-sm font-medium ${
                            isProcessOverdue ? 'text-red-600' : 'text-slate-900'
                          }`}>
                            {daysInStep} dias
                          </span>
                        </div>
                        {columnConfig && columnConfig.slaDays > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">SLA:</span>
                            <span className={`text-sm font-medium ${
                              daysInStep > columnConfig.slaDays ? 'text-red-600' : 'text-slate-900'
                            }`}>
                              {columnConfig.slaDays} dias
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Informações do Processo */}
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-slate-800 mb-3">Informações do Processo</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Email:</span>
                          <span className="text-sm text-slate-900">{selectedProcess.client_email}</span>
                        </div>
                        {selectedProcess.property_value && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">Valor:</span>
                            <span className="text-sm font-medium text-[#d4a574]">
                              {formatCurrency(selectedProcess.property_value)}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Criado em:</span>
                          <span className="text-sm text-slate-900">
                            {new Date(selectedProcess.created_at).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Checklist de Etapas */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800">Etapas do Processo</h3>
                    <div className="space-y-3">
                      {stepsConfig.map((stepConfig) => {
                        const Icon = stepConfig.icon;
                        const isCompleted = selectedProcess.status_steps[stepConfig.key];
                        const isDisabled = stepConfig.key === "upload" || isReadOnlyView;

                        return (
                          <div
                            key={stepConfig.key}
                            className={`
                              flex items-center justify-between p-4 rounded-lg border transition-all
                              ${
                                isCompleted
                                  ? "bg-amber-50 border-[#d4a574]"
                                  : "bg-slate-50 border-slate-200"
                              }
                            `}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div
                                className={`
                                  p-2 rounded-lg
                                  ${
                                    isCompleted
                                      ? "bg-[#d4a574] text-[#302521]"
                                      : "bg-slate-200 text-slate-400"
                                  }
                                `}
                              >
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <p
                                  className={`
                                    font-medium
                                    ${isCompleted ? "text-[#302521]" : "text-slate-700"}
                                  `}
                                >
                                  {stepConfig.name}
                                </p>
                                <p
                                  className={`
                                    text-sm
                                    ${isCompleted ? "text-[#302521]" : "text-slate-500"}
                                  `}
                                >
                                  {stepConfig.description}
                                </p>
                              </div>
                            </div>
                            <Switch
                              checked={isCompleted}
                              onCheckedChange={() => !isDisabled && handleStepToggle(selectedProcess.id, stepConfig.key)}
                              disabled={isDisabled}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Documentos */}
                  <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800">Documentos</h3>
                    <ProcessDocumentsList
                      processId={selectedProcess.id}
                      processClientName={selectedProcess.client_name}
                      isReadOnly={isReadOnlyView}
                    />
                  </div>

                  {/* Histórico de Atividades */}
                  <div className="mt-6">
                    <ProcessHistory processId={selectedProcess.id} />
                  </div>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </div>
  );
}
