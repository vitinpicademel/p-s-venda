"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Home,
  Plus,
  Upload,
  Cloud,
  X,
  HardHat,
  FileSignature,
  Receipt,
  ScrollText,
  KeyRound,
} from "lucide-react";
import { useRouter } from "next/navigation";

// Tipo para cliente
type Client = {
  id: string;
  clientName: string;
  clientEmail: string;
  propertyAddress: string;
  propertyValue: number;
  status: "in_progress" | "completed";
  stepsCompleted: number;
  totalSteps: number;
  createdAt: string;
  contractFilename?: string;
};

// Tipo para etapas
type ProcessStep = {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  completed: boolean;
};

// Dados fictícios iniciais
const initialClients: Client[] = [
  {
    id: "1",
    clientName: "Maria Silva",
    clientEmail: "maria.silva@email.com",
    propertyAddress: "Rua das Flores, 123 - Centro, São Paulo/SP",
    propertyValue: 450000,
    status: "in_progress",
    stepsCompleted: 3,
    totalSteps: 5,
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    clientName: "João Santos",
    clientEmail: "joao.santos@email.com",
    propertyAddress: "Av. Paulista, 1000 - Bela Vista, São Paulo/SP",
    propertyValue: 850000,
    status: "in_progress",
    stepsCompleted: 4,
    totalSteps: 5,
    createdAt: "2024-01-20",
  },
  {
    id: "3",
    clientName: "Ana Costa",
    clientEmail: "ana.costa@email.com",
    propertyAddress: "Rua Augusta, 500 - Consolação, São Paulo/SP",
    propertyValue: 320000,
    status: "in_progress",
    stepsCompleted: 2,
    totalSteps: 5,
    createdAt: "2024-01-25",
  },
];

// Função para criar etapas iniciais baseado no número de etapas concluídas
const createInitialSteps = (stepsCompleted: number): ProcessStep[] => {
  const allSteps: Omit<ProcessStep, "completed">[] = [
    {
      id: "upload",
      name: "Upload do Contrato",
      description: "Contrato PDF enviado pela imobiliária",
      icon: FileText,
    },
    {
      id: "engineering",
      name: "Engenharia do banco",
      description: "Análise e aprovação do financiamento bancário",
      icon: HardHat,
    },
    {
      id: "signature",
      name: "Assinatura do contrato bancário",
      description: "Assinatura do contrato de financiamento",
      icon: FileSignature,
    },
    {
      id: "itbi",
      name: "Recolhimento de ITBI",
      description: "Pagamento do Imposto sobre Transmissão de Bens Imóveis",
      icon: Receipt,
    },
    {
      id: "registry",
      name: "Entrada cartório para registro",
      description: "Registro da escritura no cartório",
      icon: ScrollText,
    },
    {
      id: "delivery",
      name: "Entrega de Chaves",
      description: "Entrega das chaves e conclusão do processo",
      icon: KeyRound,
    },
  ];

  return allSteps.map((step, index) => ({
    ...step,
    completed: index < stepsCompleted + 1, // +1 porque upload sempre está concluído
  }));
};

export default function AdminPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientSteps, setClientSteps] = useState<Record<string, ProcessStep[]>>({});
  const { toasts, showToast, removeToast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    propertyAddress: "",
    propertyValue: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Inicializa etapas quando um cliente é selecionado
  const handleOpenSheet = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find((c) => c.id === clientId);
    if (client && !clientSteps[clientId]) {
      setClientSteps((prev) => ({
        ...prev,
        [clientId]: createInitialSteps(client.stepsCompleted),
      }));
    }
  };

  const handleStepToggle = (clientId: string, stepId: string) => {
    setClientSteps((prev) => {
      const steps = prev[clientId] || [];
      const updatedSteps = steps.map((step) =>
        step.id === stepId ? { ...step, completed: !step.completed } : step
      );

      // Calcula quantas etapas estão concluídas (excluindo upload e entrega de chaves)
      const completedCount = updatedSteps.filter(
        (step) => step.completed && step.id !== "upload" && step.id !== "delivery"
      ).length;
      const totalCount = updatedSteps.filter(
        (step) => step.id !== "upload" && step.id !== "delivery"
      ).length;

      // Atualiza o cliente
      setClients((prevClients) =>
        prevClients.map((client) => {
          if (client.id === clientId) {
            const newStepsCompleted = completedCount;
            const isCompleted = newStepsCompleted === totalCount;

            // Se todas as etapas intermediárias estão concluídas, marca entrega como concluída
            if (isCompleted && !updatedSteps.find((s) => s.id === "delivery")?.completed) {
              updatedSteps.find((s) => s.id === "delivery")!.completed = true;
            }

            return {
              ...client,
              stepsCompleted: newStepsCompleted,
              status: isCompleted ? "completed" : "in_progress",
            };
          }
          return client;
        })
      );

      // Toast de confirmação
      const step = updatedSteps.find((s) => s.id === stepId);
      showToast({
        title: "Status da etapa atualizado",
        description: `${step?.name} ${step?.completed ? "marcada como concluída" : "marcada como pendente"}`,
        type: "success",
      });

      return {
        ...prev,
        [clientId]: updatedSteps,
      };
    });
  };

  const handleLogout = () => {
    router.push("/login");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    } else {
      showToast({
        title: "Formato inválido",
        description: "Por favor, selecione um arquivo PDF",
        type: "error",
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    } else {
      showToast({
        title: "Formato inválido",
        description: "Por favor, arraste um arquivo PDF",
        type: "error",
      });
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatCurrencyInput = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (!numbers) return "";

    const number = parseInt(numbers, 10) / 100;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    }).format(number);
  };

  const handleCurrencyInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    setFormData((prev) => ({ ...prev, propertyValue: formatted }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clientName || !formData.clientEmail || !formData.propertyAddress || !formData.propertyValue) {
      showToast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos",
        type: "error",
      });
      return;
    }

    if (!selectedFile) {
      showToast({
        title: "Contrato obrigatório",
        description: "Por favor, faça upload do contrato PDF",
        type: "error",
      });
      return;
    }

    setIsUploading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const propertyValue = parseFloat(
      formData.propertyValue.replace(/[^\d,]/g, "").replace(",", ".")
    );

    const newClient: Client = {
      id: Date.now().toString(),
      clientName: formData.clientName,
      clientEmail: formData.clientEmail,
      propertyAddress: formData.propertyAddress,
      propertyValue: propertyValue,
      status: "in_progress",
      stepsCompleted: 1,
      totalSteps: 5,
      createdAt: new Date().toISOString().split("T")[0],
      contractFilename: selectedFile.name,
    };

    setClients((prev) => [newClient, ...prev]);

    setIsDialogOpen(false);
    setFormData({
      clientName: "",
      clientEmail: "",
      propertyAddress: "",
      propertyValue: "",
    });
    setSelectedFile(null);
    setIsUploading(false);

    showToast({
      title: "Contrato enviado com sucesso!",
      description: `Processo criado para ${formData.clientName}`,
      type: "success",
    });
  };

  const getStatusBadge = (status: string, completed: number, total: number) => {
    const percentage = (completed / total) * 100;
    if (percentage === 100) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <CheckCircle2 className="h-3 w-3" />
          Concluído
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-[#302521]">
        <Clock className="h-3 w-3" />
        {completed}/{total} etapas
      </span>
    );
  };

  const selectedClient = selectedClientId
    ? clients.find((c) => c.id === selectedClientId)
    : null;
  const currentSteps = selectedClientId ? clientSteps[selectedClientId] || [] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50">
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <header className="bg-[#302521] border-b border-[#302521] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#d4a574] rounded-lg">
                <Home className="h-6 w-6 text-[#302521]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#d4a574]">Donna Imobiliária</h1>
                <p className="text-sm text-amber-100">Painel Administrativo</p>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Processos em Andamento</h2>
            <p className="text-slate-600">Gerencie os processos de venda dos seus clientes</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#d4a574] hover:bg-[#c49564] text-[#302521] shadow-lg gap-2">
                <Plus className="h-5 w-5" />
                Novo Processo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">Criar Novo Processo</DialogTitle>
                <DialogDescription>
                  Preencha os dados do cliente e faça upload do contrato PDF
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="clientName">Nome do Cliente *</Label>
                    <Input
                      id="clientName"
                      name="clientName"
                      placeholder="Ex: João da Silva"
                      value={formData.clientName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientEmail">Email do Cliente *</Label>
                    <Input
                      id="clientEmail"
                      name="clientEmail"
                      type="email"
                      placeholder="cliente@email.com"
                      value={formData.clientEmail}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="propertyAddress">Endereço do Imóvel *</Label>
                  <Input
                    id="propertyAddress"
                    name="propertyAddress"
                    placeholder="Rua, número - Bairro, Cidade/UF"
                    value={formData.propertyAddress}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="propertyValue">Valor do Imóvel *</Label>
                  <Input
                    id="propertyValue"
                    name="propertyValue"
                    placeholder="R$ 0,00"
                    value={formData.propertyValue}
                    onChange={handleCurrencyInput}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Contrato PDF *</Label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                      relative border-2 border-dashed rounded-lg p-6 transition-colors
                      ${
                        isDragging
                          ? "border-[#d4a574] bg-amber-50"
                          : selectedFile
                          ? "border-green-500 bg-green-50"
                          : "border-slate-300 bg-slate-50 hover:border-[#d4a574] hover:bg-slate-100"
                      }
                    `}
                  >
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {selectedFile ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <FileText className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{selectedFile.name}</p>
                            <p className="text-sm text-slate-500">
                              {(selectedFile.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile();
                          }}
                          className="h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="flex justify-center mb-3">
                          <div className="p-3 bg-amber-100 rounded-full">
                            <Cloud className="h-8 w-8 text-[#d4a574]" />
                          </div>
                        </div>
                        <p className="text-sm font-medium text-slate-700 mb-1">
                          Clique ou arraste o arquivo aqui
                        </p>
                        <p className="text-xs text-slate-500">
                          Apenas arquivos PDF são aceitos
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isUploading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#d4a574] hover:bg-[#c49564] text-[#302521]"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Upload className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Criar Processo
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Card
              key={client.id}
              className="hover:shadow-lg transition-shadow duration-200 border-slate-200"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-slate-800 mb-1">
                      {client.clientName}
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-600">
                      {client.clientEmail}
                    </CardDescription>
                  </div>
                  <FileText className="h-5 w-5 text-[#d4a574]" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Imóvel
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {client.propertyAddress}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Valor
                  </p>
                  <p className="text-lg font-bold text-[#d4a574]">
                    {formatCurrency(client.propertyValue)}
                  </p>
                </div>

                {client.contractFilename && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Contrato
                    </p>
                    <p className="text-sm text-slate-600 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {client.contractFilename}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  {getStatusBadge(client.status, client.stepsCompleted, client.totalSteps)}
                  <span className="text-xs text-slate-500">
                    Criado em {new Date(client.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>

                <Button
                  className="w-full bg-[#d4a574] hover:bg-[#c49564] text-[#302521]"
                  onClick={() => handleOpenSheet(client.id)}
                >
                  Ver Detalhes
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {clients.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                Nenhum processo encontrado
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                Comece criando um novo processo de venda
              </p>
              <Button
                className="bg-[#d4a574] hover:bg-[#c49564] text-[#302521] gap-2"
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Criar Primeiro Processo
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Sheet - Painel Lateral */}
      <Sheet open={selectedClientId !== null} onOpenChange={(open) => !open && setSelectedClientId(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedClient && (
            <>
              <SheetHeader>
                <SheetTitle className="text-2xl text-slate-800">
                  {selectedClient.clientName}
                </SheetTitle>
                <SheetDescription className="text-base text-slate-600">
                  {selectedClient.propertyAddress}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Barra de Progresso */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Progresso Geral</span>
                    <span className="text-sm font-semibold text-[#d4a574]">
                      {selectedClient.stepsCompleted}/{selectedClient.totalSteps} etapas
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-[#d4a574] h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(selectedClient.stepsCompleted / selectedClient.totalSteps) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Checklist de Etapas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800">Etapas do Processo</h3>
                  <div className="space-y-3">
                    {currentSteps.length > 0 ? (
                      currentSteps.map((step) => {
                        const Icon = step.icon;
                        const isDisabled = step.id === "upload"; // Upload sempre concluído

                        return (
                          <div
                            key={step.id}
                            className={`
                              flex items-center justify-between p-4 rounded-lg border transition-all
                              ${
                                step.completed
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
                                    step.completed
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
                                    ${step.completed ? "text-[#302521]" : "text-slate-700"}
                                  `}
                                >
                                  {step.name}
                                </p>
                                <p
                                  className={`
                                    text-sm
                                    ${step.completed ? "text-[#302521]" : "text-slate-500"}
                                  `}
                                >
                                  {step.description}
                                </p>
                              </div>
                            </div>
                            <Switch
                              checked={step.completed}
                              onCheckedChange={() => !isDisabled && handleStepToggle(selectedClient.id, step.id)}
                              disabled={isDisabled}
                            />
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        Carregando etapas...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
