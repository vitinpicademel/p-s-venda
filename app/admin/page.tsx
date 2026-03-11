"use client";

import { useState, useEffect } from "react";
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
  FileCheck,
  ClipboardList,
  Barcode,
  ScrollText,
  KeyRound,
  Edit,
  Eye,
  Plus,
  X,
  Search,
  User,
  Building2,
  Home,
  Cloud,
  Upload,
  Download,
  Pencil,
  Save,
  XCircle,
  FolderOpen,
  FileSignature,
  Receipt,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logHelpers } from "@/lib/process-logs";
import { useRouter } from "next/navigation";
import ProcessDocumentsList from "@/components/ProcessDocumentsList";
import ProcessHistory from "@/components/ProcessHistory";

// Configuração das etapas do processo
const stepsConfig = [
  { key: "upload" as const, name: "Upload do Contrato", description: "Contrato PDF enviado pela imobiliária", icon: FileText },
  { key: "solicitacao_engenharia" as const, name: "Solicitação Engenharia", description: "Solicitação de vistoria enviada ao banco", icon: ClipboardList },
  { key: "envio_boleto_cliente" as const, name: "Envio de boleto p/ cliente", description: "Boleto da taxa de avaliação enviado", icon: Barcode },
  { key: "laudo" as const, name: "Laudo", description: "Emissão e validação do laudo de engenharia", icon: FileCheck },
  { key: "signature" as const, name: "Assinatura do contrato bancário", description: "Assinatura do contrato de financiamento", icon: FileSignature },
  { key: "itbi" as const, name: "Recolhimento de ITBI", description: "Pagamento do Imposto sobre Transmissão de Bens Imóveis", icon: Receipt },
  { key: "registry" as const, name: "Entrada cartório para registro", description: "Registro da escritura no cartório", icon: ScrollText },
  { key: "delivery" as const, name: "Entrega de Chaves", description: "Entrega das chaves e conclusão do processo", icon: KeyRound },
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
};

// Tipo para etapas
type ProcessStep = {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  completed: boolean;
};

// Função auxiliar para calcular etapas concluídas
const getStepsCompleted = (statusSteps: Process["status_steps"]): number => {
  const steps = [
    statusSteps.solicitacao_engenharia,
    statusSteps.envio_boleto_cliente,
    statusSteps.laudo,
    statusSteps.signature,
    statusSteps.itbi,
    statusSteps.registry,
  ];
  return steps.filter(Boolean).length;
};


export default function AdminPage() {
  const router = useRouter();
  const [processes, setProcesses] = useState<Process[]>([]);
  const [filteredProcesses, setFilteredProcesses] = useState<Process[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [isReadOnlyView, setIsReadOnlyView] = useState(false);
  const [isEditingProcess, setIsEditingProcess] = useState(false);
  const [editFormData, setEditFormData] = useState({
    client_name: "",
    property_address: "",
  });
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
  const [observationsText, setObservationsText] = useState("");
  const [isSavingObservations, setIsSavingObservations] = useState(false);
  const [saveObservationsStatus, setSaveObservationsStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Buscar processos do Supabase
  useEffect(() => {
    fetchProcesses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleOpenSheet = (processId: string, readOnly: boolean = false) => {
    setSelectedProcessId(processId);
    setIsEditingProcess(false);
    setIsReadOnlyView(readOnly);
    // Inicializa os dados de edição com os valores atuais
    const process = processes.find((p) => p.id === processId);
    if (process) {
      setEditFormData({
        client_name: process.client_name,
        property_address: process.property_address || "",
      });
      setObservationsText(process.observations || "");
      setSaveObservationsStatus("idle");
    }
  };

  const downloadContract = async (contractUrl: string | null, contractFilename: string | null) => {
    if (!contractUrl || !contractFilename) {
      showToast({
        title: "Contrato não disponível",
        description: "O contrato não foi encontrado.",
        type: "error",
      });
      return;
    }

    try {
      const supabase = createClient();
      if (!supabase) {
        showToast({
          title: "Erro de conexão",
          description: "Não foi possível conectar ao sistema.",
          type: "error",
        });
        return;
      }

      // Extrair o path do URL público (formato: https://[project].supabase.co/storage/v1/object/public/contracts/[path])
      const urlParts = contractUrl.split('/contracts/');
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
      link.setAttribute('download', contractFilename);
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

  const handleSaveObservations = async () => {
    if (!selectedProcessId || isReadOnlyView) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const text = observationsText.trim();
    const current = processes.find((p) => p.id === selectedProcessId);
    if (current && (current.observations || "") === text) return;
    try {
      setIsSavingObservations(true);
      setSaveObservationsStatus("saving");
      const { error } = await supabase
        .from("processes")
        .update({ observations: text || null })
        .eq("id", selectedProcessId);
      setIsSavingObservations(false);
      if (error) {
        setSaveObservationsStatus("error");
        showToast({
          title: "Erro ao salvar observações",
          description: error.message || "Tente novamente",
          type: "error",
        });
        return;
      }
      setSaveObservationsStatus("saved");
      setProcesses((prev) =>
        prev.map((p) =>
          p.id === selectedProcessId ? { ...p, observations: text || null } : p
        )
      );
      setFilteredProcesses((prev) =>
        prev.map((p) =>
          p.id === selectedProcessId ? { ...p, observations: text || null } : p
        )
      );
    } catch (err: any) {
      setIsSavingObservations(false);
      setSaveObservationsStatus("error");
      showToast({
        title: "Erro ao salvar observações",
        description: err?.message || "Tente novamente",
        type: "error",
      });
    }
  };

  const handleStartEdit = () => {
    if (isReadOnlyView) return;
    setIsEditingProcess(true);
  };

  const handleCancelEdit = () => {
    const process = processes.find((p) => p.id === selectedProcessId);
    if (process) {
      setEditFormData({
        client_name: process.client_name,
        property_address: process.property_address || "",
      });
    }
    setIsEditingProcess(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedProcessId) return;

    const supabase = getSupabaseClient();
    if (!supabase) {
      showToast({
        title: "Erro",
        description: "Não foi possível conectar ao banco de dados",
        type: "error",
      });
      return;
    }

    // Validação
    if (!editFormData.client_name.trim()) {
      showToast({
        title: "Campo obrigatório",
        description: "O nome do cliente é obrigatório",
        type: "error",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("processes")
        .update({
          client_name: editFormData.client_name.trim(),
          property_address: editFormData.property_address.trim() || null,
        })
        .eq("id", selectedProcessId);

      if (error) throw error;

      // Registrar log de atualização do processo
      const client = createClient();
      const { data: { user } } = await client.auth.getUser();
      if (user) {
        const process = processes.find(p => p.id === selectedProcessId);
        if (process) {
          if (process.client_name !== editFormData.client_name.trim()) {
            if (user && user.id) {
              await logHelpers.processUpdated(
                selectedProcessId,
                user.id,
                'client_name',
                process.client_name,
                editFormData.client_name.trim()
              );
            }
          }
          if (process.property_address !== editFormData.property_address.trim()) {
            if (user && user.id) {
              await logHelpers.processUpdated(
                selectedProcessId,
                user.id,
                'property_address',
                process.property_address || undefined,
                editFormData.property_address.trim() || undefined
              );
            }
          }
        }
      }

      // Atualiza estado local
      setProcesses((prev) =>
        prev.map((p) =>
          p.id === selectedProcessId
            ? {
                ...p,
                client_name: editFormData.client_name.trim(),
                property_address: editFormData.property_address.trim() || null,
              }
            : p
        )
      );

      setFilteredProcesses((prev) =>
        prev.map((p) =>
          p.id === selectedProcessId
            ? {
                ...p,
                client_name: editFormData.client_name.trim(),
                property_address: editFormData.property_address.trim() || null,
              }
            : p
        )
      );

      setIsEditingProcess(false);
      showToast({
        title: "Processo atualizado",
        description: "Nome e endereço foram atualizados com sucesso",
        type: "success",
      });
    } catch (error: any) {
      console.error("Erro ao atualizar processo:", error);
      showToast({
        title: "Erro ao atualizar",
        description: error?.message || "Não foi possível atualizar o processo",
        type: "error",
      });
    }
  };

  const handleStepToggle = async (processId: string, stepKey: keyof Process["status_steps"]) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      showToast({
        title: "Erro",
        description: "Não foi possível conectar ao banco de dados",
        type: "error",
      });
      return;
    }

    // 1. Recupera o processo atual do state local
    const process = processes.find((p) => p.id === processId);
    if (!process) {
      console.error("Processo não encontrado:", processId);
      return;
    }

    // 2. Cria uma cópia do objeto status_steps atual
    const currentSteps = { ...process.status_steps };
    
    // 3. Salva o estado anterior para reverter em caso de erro (Optimistic UI)
    const previousSteps = { ...process.status_steps };
    const previousStatus = process.status;

    // 4. Modifica apenas a etapa clicada
    const novoValor = !currentSteps[stepKey];
    currentSteps[stepKey] = novoValor;

    // 5. Se todas as etapas intermediárias estão concluídas, marca entrega como concluída
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

    // 6. Calcula status geral
    const status = allIntermediateCompleted ? "completed" : "in_progress";

    // 7. OPTIMISTIC UI: Atualiza a tela imediatamente (antes de esperar o banco)
    setProcesses((prev) =>
      prev.map((p) =>
        p.id === processId
          ? { ...p, status_steps: currentSteps, status }
          : p
      )
    );

    // Atualiza também o filteredProcesses se necessário
    setFilteredProcesses((prev) =>
      prev.map((p) =>
        p.id === processId
          ? { ...p, status_steps: currentSteps, status }
          : p
      )
    );

    try {
      // 8. Envia o update para o Supabase atualizando APENAS a coluna status_steps (JSONB completo)
      const { error } = await supabase
        .from("processes")
        .update({
          status_steps: currentSteps, // Atualiza o JSON inteiro
          status, // Atualiza o status geral
        })
        .eq("id", processId);

      if (error) {
        console.error("Erro ao atualizar etapa no Supabase:", error);
        throw error;
      }

      // Registrar log de toggle de etapa
      const client = createClient();
      const { data: { user } } = await client.auth.getUser();
      if (user) {
        const stepConfig = stepsConfig.find(step => step.key === stepKey);
        const stepName = stepConfig ? stepConfig.name : stepKey;
        await logHelpers.stepToggled(
          processId,
          user.id,
          stepName,
          novoValor
        );
      }

      // 9. Sucesso: Mostra toast de confirmação
      showToast({
        title: "Status da etapa atualizado",
        description: `Etapa "${stepKey}" ${novoValor ? "marcada como concluída" : "marcada como pendente"}`,
        type: "success",
      });
    } catch (error: any) {
      console.error("Erro ao atualizar etapa:", error);
      
      // 10. REVERTE o estado em caso de erro (rollback do Optimistic UI)
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

      // Mostra erro específico
      const errorMessage = error?.message || "Erro desconhecido ao atualizar etapa";
      showToast({
        title: "Erro ao atualizar etapa",
        description: errorMessage.includes("PGRST204") 
          ? "Coluna não encontrada. Verifique se o schema está correto."
          : errorMessage,
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

    setIsUploading(true);

    const supabase = getSupabaseClient();
    if (!supabase) {
      showToast({
        title: "Erro de configuração",
        description: "Recarregue a página",
        type: "error",
      });
      setIsUploading(false);
      return;
    }

    try {
      // Upload do arquivo para Supabase Storage (se houver)
      let contractUrl = null;
      let contractFilename = null;
      let contractFilePath = null;

      if (selectedFile) {
        // Função auxiliar para sanitizar nome do arquivo
        const sanitizeFileName = (fileName: string): string => {
          const lastDotIndex = fileName.lastIndexOf(".");
          const nameWithoutExt = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
          const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : "";

          const normalized = nameWithoutExt.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const sanitized = normalized
            .replace(/[^a-zA-Z0-9]/g, "_")
            .replace(/_{2,}/g, "_")
            .replace(/^_+|_+$/g, "")
            .toLowerCase();

          const finalName = sanitized || "contrato";
          const timestamp = Date.now();
          const random = Math.random().toString(36).substring(2, 8);

          return `${finalName}_${timestamp}_${random}${extension}`;
        };

        const sanitizePath = (folder: string, fileName: string): string => {
          const cleanFolder = folder
            .replace(/[^a-zA-Z0-9_-]/g, "_")
            .replace(/_{2,}/g, "_")
            .replace(/^_+|_+$/g, "");

          return `${cleanFolder}/${fileName}`
            .replace(/\/+/g, "/")
            .replace(/^\/+|\/+$/g, "");
        };

        // Sanitizar nome e path
        const sanitizedFileName = sanitizeFileName(selectedFile.name);
        const filePath = sanitizePath("contracts", sanitizedFileName);
        contractFilePath = filePath;

        // DEBUG: Logs antes do upload
        console.log("📤 DEBUG UPLOAD CONTRATO - Informações do Arquivo:", {
          nomeOriginal: selectedFile.name,
          nomeSanitizado: sanitizedFileName,
          tamanhoArquivo: `${(selectedFile.size / 1024).toFixed(2)} KB`,
          tipoMIME: selectedFile.type,
          pathSanitizado: filePath,
          bucket: "contracts",
        });

        const { error: uploadError } = await supabase.storage
          .from("contracts")
          .upload(filePath, selectedFile, {
            upsert: true,
            contentType: selectedFile.type || "application/pdf",
            cacheControl: "3600",
          });

        if (uploadError) {
          console.error("❌ Erro no upload do contrato:", uploadError);
          console.error("❌ Detalhes do erro:", {
            message: uploadError.message,
            statusCode: (uploadError as any).statusCode,
            error: (uploadError as any).error,
          });
          // Continua mesmo se o upload falhar
        } else {
          const { data: urlData } = supabase.storage
            .from("contracts")
            .getPublicUrl(filePath);
          contractUrl = urlData.publicUrl;
          contractFilename = selectedFile.name;
          console.log("✅ Upload do contrato bem-sucedido:", {
            path: filePath,
            url: contractUrl,
          });
        }
      }

      // Converte valor: remove formatação (R$, pontos, espaços) e converte vírgula para ponto
      const cleanValue = formData.propertyValue
        .replace(/[^\d,]/g, "") // Remove tudo exceto dígitos e vírgula
        .replace(",", "."); // Converte vírgula para ponto
      const propertyValue = parseFloat(cleanValue);
      
      // Validação: verifica se o valor é um número válido
      if (isNaN(propertyValue) || propertyValue <= 0) {
        throw new Error("Valor do imóvel inválido. Por favor, insira um valor válido.");
      }

      // Cria processo no Supabase
      const { data, error } = await supabase
        .from("processes")
        .insert({
          client_name: formData.clientName,
          client_email: formData.clientEmail,
          property_address: formData.propertyAddress,
          property_value: propertyValue,
          contract_url: contractUrl,
          contract_filename: contractFilename,
          status_steps: {
            upload: true,
            solicitacao_engenharia: false,
            envio_boleto_cliente: false,
            laudo: false,
            signature: false,
            itbi: false,
            registry: false,
            delivery: false,
          },
          status: "in_progress",
        })
        .select()
        .single();

      if (error) throw error;

      // Registrar log de criação de processo
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await logHelpers.processCreated(
          data.id,
          user.id,
          formData.clientName
        );
        
        // Se houver contrato, registrar log também
        if (contractUrl && contractFilename) {
          await logHelpers.contractUploaded(
            data.id,
            user.id,
            contractFilename
          );
        }
      }

      // Se houver contrato inicial, salvar também na tabela process_documents
      if (data && contractUrl && contractFilename && contractFilePath) {
        // Salvar contrato inicial na tabela process_documents com doc_type: 'contrato_inicial'
        // IMPORTANTE: person_type é obrigatório no schema, mas não é usado para contrato_inicial
        const { error: docError } = await supabase
          .from("process_documents")
          .insert({
            process_id: data.id,
            person_type: "comprador", // Campo obrigatório, mas não usado para contrato_inicial
            doc_type: "contrato_inicial",
            estado_civil: "solteiro", // Campo obrigatório
            documents: {
              documentacao_completa_filename: contractFilename,
              bucket: "contracts",
              file_path: contractFilePath,
              doc_type: "contrato_inicial",
            },
          });

        if (docError) {
          console.error("Erro ao salvar contrato inicial em process_documents:", docError);
          // Não falha o processo se isso der erro, apenas loga
        }
      }

      // Atualiza lista local
      if (data) {
        setProcesses((prev) => [data as Process, ...prev]);
        setFilteredProcesses((prev) => [data as Process, ...prev]);
      }

      setIsDialogOpen(false);
      setFormData({
        clientName: "",
        clientEmail: "",
        propertyAddress: "",
        propertyValue: "",
      });
      setSelectedFile(null);

      showToast({
        title: "Contrato enviado com sucesso!",
        description: `Processo criado para ${formData.clientName}`,
        type: "success",
      });
    } catch (error: any) {
      console.error("Erro ao criar processo:", error);
      showToast({
        title: "Erro ao criar processo",
        description: error.message || "Tente novamente",
        type: "error",
      });
    } finally {
      setIsUploading(false);
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 overflow-hidden">
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
                <h1 className="text-2xl font-bold text-[#d4a574]">Donna Negociações Imobiliárias</h1>
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
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
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
        </div>

        {/* Barra de Busca */}
        <div className="mb-6">
          <div className="relative">
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

        {/* Seção Superior - Kanban Executivo Premium */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-light tracking-wider text-stone-700 uppercase">Visão Geral</h2>
            <div className="text-xs font-medium tracking-widest text-stone-500">Fluxo de Processos</div>
          </div>
          
          <div className="overflow-x-auto noble-scroll">
            <div className="grid grid-cols-8 gap-8 min-w-[1600px] max-h-[320px]">
              {[
                { key: "upload", name: "Upload", slaDays: 1 },
                { key: "solicitacao_engenharia", name: "Engenharia", slaDays: 2 },
                { key: "envio_boleto_cliente", name: "Boleto", slaDays: 1 },
                { key: "laudo", name: "Laudo", slaDays: 5 },
                { key: "signature", name: "Assinatura", slaDays: 3 },
                { key: "itbi", name: "ITBI", slaDays: 7 },
                { key: "registry", name: "Cartório", slaDays: 10 },
                { key: "delivery", name: "Entrega", slaDays: 2 },
              ].map((column) => {
                // LÓGICA CRÍTICA: Encontrar primeira etapa pendente
                const columnProcesses = filteredProcesses.filter(process => {
                  const stepOrder = [
                    "upload", "solicitacao_engenharia", "envio_boleto_cliente", 
                    "laudo", "signature", "itbi", "registry", "delivery"
                  ];
                  
                  // Se todas estiverem concluídas, vai para entrega
                  if (process.status_steps.delivery) return column.key === "delivery";
                  
                  // Encontra primeira etapa pendente
                  for (const stepKey of stepOrder) {
                    if (!process.status_steps[stepKey as keyof Process["status_steps"]]) {
                      return stepKey === column.key;
                    }
                  }
                  return column.key === "delivery";
                });

                // LÓGICA SLA: Calcular dias corridos e verificar atraso
                const getDaysInCurrentStep = (process: Process) => {
                  const currentStep = column.key;
                  
                  if (currentStep === "upload") {
                    return Math.floor((Date.now() - new Date(process.created_at).getTime()) / (1000 * 60 * 60 * 24));
                  }
                  
                  return Math.floor((Date.now() - new Date(process.created_at).getTime()) / (1000 * 60 * 60 * 24));
                };

                const overdueCount = columnProcesses.filter(p => {
                  const daysInStep = getDaysInCurrentStep(p);
                  return daysInStep > column.slaDays;
                }).length;
                
                return (
                  <div key={column.key} className={`min-h-0 flex flex-col ${
                    column.key !== 'delivery' ? 'border-r border-stone-200 pr-4' : 'pl-4'
                  }`}>
                    {/* Header Executivo */}
                    <div className="pb-3 mb-3 border-b border-stone-100 flex-shrink-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold tracking-widest uppercase text-stone-600">
                          {column.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          {overdueCount > 0 && (
                            <div className="flex items-center text-red-800">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              <span className="text-xs font-medium">{overdueCount}</span>
                            </div>
                          )}
                          <span className="px-2 py-0.5 bg-stone-50 rounded-full text-xs font-medium text-stone-600">
                            {columnProcesses.length}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center text-xs text-stone-400">
                        <Clock className="h-3 w-3 mr-1" />
                        {column.slaDays}d
                      </div>
                    </div>

                    {/* Lista de Processos - CARDS DE LUXO COM SCROLL NUCLEAR */}
                    <div className="flex-1 space-y-3 overflow-y-auto noble-scroll">
                      {columnProcesses.map((process) => {
                        const daysInStep = getDaysInCurrentStep(process);
                        const isOverdue = daysInStep > column.slaDays;
                        
                        return (
                          <div
                            key={process.id}
                            title={process.client_name} // Tooltip nativo com nome completo
                            className={`group cursor-pointer rounded-lg shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-2px_rgba(0,0,0,0.08)] transition-all duration-300 p-4 ${
                              isOverdue 
                                ? 'bg-red-100 text-red-900 border border-red-300' // Card todo vermelho suave
                                : 'bg-white text-stone-800 border border-stone-200' // Card padrão
                            }`}
                            onClick={() => handleOpenSheet(process.id, false)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0 pr-3">
                                {/* Nome do Cliente com quebra inteligente e tipografia refinada */}
                                <p className="text-xs font-medium leading-tight line-clamp-2">
                                  {process.client_name}
                                </p>
                              </div>
                              {isOverdue && (
                                <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 opacity-70 mt-0.5" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                      
                      {columnProcesses.length === 0 && (
                        <div className="text-center py-6">
                          <div className="w-8 h-0.5 bg-stone-200 mx-auto mb-3"></div>
                          <p className="text-xs text-stone-400">Vazio</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Divisória Elegante */}
        <div className="relative my-16">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 bg-white text-xs font-medium tracking-widest uppercase text-stone-400">
              Detalhamento dos Processos
            </span>
          </div>
        </div>

        {/* Seção Inferior - Lista Detalhada */}
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4">Detalhamento dos Processos</h2>
          
          {/* Cards Grid - COMPONENTE ANTIGO RESTAURADO */}
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-slate-500">Carregando processos...</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredProcesses.map((process) => {
                const stepsCompleted = getStepsCompleted(process.status_steps);
                const totalSteps = 6; // solicitacao_engenharia, envio_boleto_cliente, laudo, signature, itbi, registry
                
                return (
                  <Card
                    key={process.id}
                    className="hover:shadow-lg transition-shadow duration-200 border-slate-200"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-slate-800 mb-1">
                            {process.client_name}
                          </CardTitle>
                          <CardDescription className="text-sm text-slate-600">
                            {process.client_email}
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
                          {process.property_address || "Não informado"}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                          Valor
                        </p>
                        <p className="text-lg font-bold text-[#d4a574]">
                          {process.property_value ? formatCurrency(process.property_value) : "Não informado"}
                        </p>
                      </div>

                      {process.contract_filename && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                            Contrato
                          </p>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-600 flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              {process.contract_filename}
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => process.contract_url && downloadContract(process.contract_url, process.contract_filename)}
                              className="gap-2 flex-shrink-0"
                            >
                              <Download className="h-3 w-3" />
                              Baixar
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        {getStatusBadge(process.status, stepsCompleted, totalSteps)}
                        <span className="text-xs text-slate-500">
                          Criado em {new Date(process.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          className="w-full bg-[#d4a574] hover:bg-[#c49564] text-[#302521] gap-2"
                          onClick={() => handleOpenSheet(process.id, false)}
                        >
                          <Pencil className="h-4 w-4" />
                          Editar Processo
                        </Button>
                        <Button
                          className="w-full gap-2"
                          variant="outline"
                          onClick={() => handleOpenSheet(process.id, true)}
                        >
                          <Eye className="h-4 w-4" />
                          Ver Status
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Empty State */}
        {!isLoading && filteredProcesses.length === 0 && (
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

            const stepsCompleted = getStepsCompleted(selectedProcess.status_steps);
            const totalSteps = 6;

            return (
              <>
                <SheetHeader className="flex-none">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {isEditingProcess ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-client-name" className="text-sm font-medium">
                              Nome do Cliente *
                            </Label>
                            <Input
                              id="edit-client-name"
                              value={editFormData.client_name}
                              onChange={(e) =>
                                setEditFormData((prev) => ({
                                  ...prev,
                                  client_name: e.target.value,
                                }))
                              }
                              className="text-lg font-semibold"
                              placeholder="Nome do cliente"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-property-address" className="text-sm font-medium">
                              Endereço do Imóvel
                            </Label>
                            <Input
                              id="edit-property-address"
                              value={editFormData.property_address}
                              onChange={(e) =>
                                setEditFormData((prev) => ({
                                  ...prev,
                                  property_address: e.target.value,
                                }))
                              }
                              className="text-base"
                              placeholder="Endereço do imóvel"
                            />
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button
                              onClick={handleSaveEdit}
                              className="flex-1 bg-[#d4a574] hover:bg-[#c49564] text-[#302521] gap-2"
                            >
                              <Save className="h-4 w-4" />
                              Salvar
                            </Button>
                            <Button
                              onClick={handleCancelEdit}
                              variant="outline"
                              className="flex-1 gap-2"
                            >
                              <XCircle className="h-4 w-4" />
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <SheetTitle className="text-2xl text-slate-800 flex items-center justify-between">
                            <span>{selectedProcess.client_name}</span>
                            <div className="flex items-center gap-2">
                              {isReadOnlyView && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                  Modo Visualização
                                </span>
                              )}
                              {!isReadOnlyView && (
                                <Button
                                  onClick={handleStartEdit}
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-[#d4a574] hover:text-[#c49564] hover:bg-amber-50"
                                  title="Editar nome e endereço"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </SheetTitle>
                          <SheetDescription className="text-base text-slate-600">
                            {selectedProcess.property_address || "Endereço não informado"}
                          </SheetDescription>
                        </>
                      )}
                    </div>
                  </div>
                </SheetHeader>

                <div className="flex-1 min-h-0 overflow-y-auto mt-6 space-y-6 pr-2">
                  {/* Barra de Progresso */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">Progresso Geral</span>
                      <span className="text-sm font-semibold text-[#d4a574]">
                        {stepsCompleted}/{totalSteps} etapas
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-[#d4a574] h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(stepsCompleted / totalSteps) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-slate-800">Observações Gerais</h3>
                    <textarea
                      value={observationsText}
                      onChange={(e) => setObservationsText(e.target.value)}
                      disabled={isReadOnlyView}
                      rows={4}
                      className="w-full p-3 border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d4a574]"
                      placeholder="Escreva observações internas sobre este processo..."
                    />
                    <div className="flex items-center justify-end mt-2">
                      <Button
                        onClick={handleSaveObservations}
                        disabled={isReadOnlyView || isSavingObservations}
                        className="bg-[#d4a574] hover:bg-[#c49564] text-[#302521]"
                      >
                        {isSavingObservations ? "Salvando..." : "Salvar Observação"}
                      </Button>
                    </div>
                    <div className="text-xs text-slate-500 h-4 mt-1">
                      {saveObservationsStatus === "saved" ? "Observação salva com sucesso!" : saveObservationsStatus === "error" ? "Erro ao salvar" : ""}
                    </div>
                  </div>

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
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-5 w-5 text-[#d4a574]" />
                      <h3 className="text-lg font-semibold text-slate-800">Documentos</h3>
                    </div>
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
