"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Upload, FileText, Download, X, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { StepDocument } from "@/types/database";
import { useToast } from "@/components/ui/toast";

interface Step1UploadProps {
  processId: string;
  isCompleted: boolean;
  onToggle: (completed: boolean) => void;
  disabled?: boolean;
}

export default function Step1Upload({ processId, isCompleted, onToggle, disabled = false }: Step1UploadProps) {
  const { showToast } = useToast();

  const [fichaFile, setFichaFile] = useState<File | null>(null);
  const [planilhaFile, setPlanilhaFile] = useState<File | null>(null);
  const [termoFile, setTermoFile] = useState<File | null>(null);
  const [fichaUploaded, setFichaUploaded] = useState<StepDocument | null>(null);
  const [planilhaUploaded, setPlanilhaUploaded] = useState<StepDocument | null>(null);
  const [termoUploaded, setTermoUploaded] = useState<StepDocument | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState({ ficha: false, planilha: false, termo: false });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadExistingDocuments();
  }, [processId]);

  const loadExistingDocuments = async () => {
    const supabase = createClient();
    if (!supabase) return;

    try {
      console.log("[Step1Upload] Carregando documentos do processo:", processId);
      const { data, error } = await supabase
        .from("step_documents")
        .select("*")
        .eq("process_id", processId)
        .eq("step_order", 1);

      if (error) {
        console.error("[Step1Upload] Erro ao carregar documentos:", error);
        throw error;
      }

      console.log("[Step1Upload] Documentos encontrados:", data);

      if (data) {
        const ficha = data.find((doc: StepDocument) => doc.document_type === 'ficha') || null;
        const planilha = data.find((doc: StepDocument) => doc.document_type === 'planilha') || null;
        const termo = data.find((doc: StepDocument) => doc.document_type === 'termo') || null;

        setFichaUploaded(ficha);
        setPlanilhaUploaded(planilha);
        setTermoUploaded(termo);

        // Completo se ficha e planilha estiverem presentes (termo é opcional para processos antigos)
        if (ficha && planilha) {
          onToggle(true);
        }
      }
    } catch (error) {
      console.error("[Step1Upload] Erro ao carregar documentos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (file: File, type: 'ficha' | 'planilha' | 'termo') => {
    if (type === 'ficha') setFichaFile(file);
    else if (type === 'planilha') setPlanilhaFile(file);
    else setTermoFile(file);
  };

  const handleDragOver = (e: React.DragEvent, type: 'ficha' | 'planilha' | 'termo') => {
    e.preventDefault();
    setIsDragging(prev => ({ ...prev, [type]: true }));
  };

  const handleDragLeave = (type: 'ficha' | 'planilha' | 'termo') => {
    setIsDragging(prev => ({ ...prev, [type]: false }));
  };

  const handleDrop = (e: React.DragEvent, type: 'ficha' | 'planilha' | 'termo') => {
    e.preventDefault();
    setIsDragging(prev => ({ ...prev, [type]: false }));
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file, type);
  };

  const removeFile = (type: 'ficha' | 'planilha' | 'termo') => {
    if (type === 'ficha') setFichaFile(null);
    else if (type === 'planilha') setPlanilhaFile(null);
    else setTermoFile(null);
  };

  const uploadFile = async (file: File, type: 'ficha' | 'planilha' | 'termo'): Promise<StepDocument | null> => {
    const supabase = createClient();
    if (!supabase) throw new Error("Supabase client não disponível");

    // 1. Sanitize filename
    const lastDotIndex = file.name.lastIndexOf(".");
    const ext = lastDotIndex > 0 ? file.name.substring(lastDotIndex) : "";
    const base = lastDotIndex > 0 ? file.name.substring(0, lastDotIndex) : file.name;
    const sanitized = base
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .replace(/_{2,}/g, "_")
      .replace(/^_+|_+$/g, "")
      .toLowerCase();
    const filePath = `step-documents/${processId}/step1/${type}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;

    console.log(`[Step1Upload] Iniciando upload para storage: ${filePath}`);

    // 2. Upload to storage
    const { error: storageError } = await supabase.storage
      .from("contracts")
      .upload(filePath, file, { upsert: true, contentType: file.type, cacheControl: "3600" });

    if (storageError) {
      console.error("[Step1Upload] Erro no storage:", storageError);
      throw storageError;
    }

    console.log("[Step1Upload] Upload no storage OK. Obtendo URL pública...");

    // 3. Get public URL
    const { data: urlData } = supabase.storage.from("contracts").getPublicUrl(filePath);
    const publicUrl = urlData.publicUrl;
    console.log("[Step1Upload] URL pública:", publicUrl);

    // 4. Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) console.warn("[Step1Upload] Não foi possível obter usuário:", userError);

    // 5. Check if record already exists (avoid relying on unique constraint)
    const { data: existing, error: selectError } = await supabase
      .from("step_documents")
      .select("id")
      .eq("process_id", processId)
      .eq("step_order", 1)
      .eq("document_type", type)
      .maybeSingle();

    if (selectError) {
      console.error("[Step1Upload] Erro ao verificar registro existente:", selectError);
      throw selectError;
    }

    let result: StepDocument | null = null;

    if (existing?.id) {
      // 6a. UPDATE existing record
      console.log(`[Step1Upload] Registro existente encontrado (id: ${existing.id}). Fazendo UPDATE...`);
      const { data: updated, error: updateError } = await supabase
        .from("step_documents")
        .update({
          file_url: publicUrl,
          file_filename: file.name,
          file_path: filePath,
          uploaded_by: user?.id ?? null,
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (updateError) {
        console.error("[Step1Upload] Erro no UPDATE:", updateError);
        throw updateError;
      }
      console.log("[Step1Upload] UPDATE bem-sucedido:", updated);
      result = updated;
    } else {
      // 6b. INSERT new record
      console.log("[Step1Upload] Nenhum registro existente. Fazendo INSERT...");
      const { data: inserted, error: insertError } = await supabase
        .from("step_documents")
        .insert({
          process_id: processId,
          step_order: 1,
          document_type: type,
          file_url: publicUrl,
          file_filename: file.name,
          file_path: filePath,
          uploaded_by: user?.id ?? null,
        })
        .select()
        .single();

      if (insertError) {
        console.error("[Step1Upload] Erro no INSERT:", insertError);
        throw insertError;
      }
      console.log("[Step1Upload] INSERT bem-sucedido:", inserted);
      result = inserted;
    }

    return result;
  };

  const handleUpload = async () => {
    if (!fichaFile && !planilhaFile && !termoFile) {
      showToast({ title: "Nenhum arquivo selecionado", description: "Selecione pelo menos um arquivo.", type: "error" });
      return;
    }

    setIsUploading(true);
    try {
      const uploads: Promise<StepDocument | null>[] = [];
      if (fichaFile) uploads.push(uploadFile(fichaFile, 'ficha'));
      if (planilhaFile) uploads.push(uploadFile(planilhaFile, 'planilha'));
      if (termoFile) uploads.push(uploadFile(termoFile, 'termo'));

      const results = await Promise.all(uploads);

      let newFicha = fichaUploaded;
      let newPlanilha = planilhaUploaded;
      let newTermo = termoUploaded;

      results.forEach(result => {
        if (!result) return;
        if (result.document_type === 'ficha') { setFichaUploaded(result); setFichaFile(null); newFicha = result; }
        else if (result.document_type === 'planilha') { setPlanilhaUploaded(result); setPlanilhaFile(null); newPlanilha = result; }
        else if (result.document_type === 'termo') { setTermoUploaded(result); setTermoFile(null); newTermo = result; }
      });

      if (newFicha && newPlanilha) {
        onToggle(true);
      }

      showToast({ title: "Arquivo(s) enviado(s) com sucesso!", type: "success" });
    } catch (error: any) {
      console.error("[Step1Upload] Erro no handleUpload:", error);
      showToast({
        title: "Falha ao enviar arquivo",
        description: error?.message ?? "Verifique o console para detalhes.",
        type: "error",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadFile = async (doc: StepDocument) => {
    try {
      const supabase = createClient();
      if (!supabase) return;
      const { data, error } = await supabase.storage.from('contracts').download(doc.file_path);
      if (error) throw error;
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.file_filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("[Step1Upload] Erro no download:", error);
      showToast({ title: "Erro ao baixar arquivo", description: error?.message, type: "error" });
    }
  };

  const isStepCompleted = !!(fichaUploaded && planilhaUploaded);

  // Reusable uploaded-file row
  const UploadedRow = ({ doc, onRemove }: { doc: StepDocument; onRemove: () => void }) => (
    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex items-center gap-2 min-w-0">
        <FileText className="h-4 w-4 text-green-600 shrink-0" />
        <span className="text-sm text-green-800 truncate">{doc.file_filename}</span>
        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
      </div>
      <div className="flex gap-2 shrink-0">
        <Button size="sm" variant="outline" onClick={() => downloadFile(doc)} className="h-8">
          <Download className="h-3 w-3" />
        </Button>
        {!disabled && (
          <Button size="sm" variant="outline" onClick={onRemove} className="h-8 text-red-600 border-red-200 hover:bg-red-50">
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );

  // Reusable drop-zone
  const DropZone = ({
    type, file, uploaded, accept, hint, id,
  }: {
    type: 'ficha' | 'planilha' | 'termo';
    file: File | null;
    uploaded: StepDocument | null;
    accept: string;
    hint: string;
    id: string;
  }) => {
    const onRemove = () => {
      if (type === 'ficha') { setFichaUploaded(null); onToggle(false); }
      else if (type === 'planilha') { setPlanilhaUploaded(null); onToggle(false); }
      else { setTermoUploaded(null); }
    };

    if (uploaded) return <UploadedRow doc={uploaded} onRemove={onRemove} />;

    return (
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          isDragging[type] ? 'border-amber-400 bg-amber-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={(e) => handleDragOver(e, type)}
        onDragLeave={() => handleDragLeave(type)}
        onDrop={(e) => handleDrop(e, type)}
      >
        <input
          type="file"
          accept={accept}
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], type)}
          className="hidden"
          id={id}
          disabled={disabled}
        />
        <label htmlFor={id} className={`${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600">{file ? file.name : hint}</p>
          <p className="text-xs text-gray-500 mt-1">
            {type === 'ficha' ? 'Apenas arquivos PDF' : 'Excel, CSV ou PDF'}
          </p>
        </label>
        {file && (
          <Button
            size="sm" variant="outline"
            onClick={(e) => { e.preventDefault(); removeFile(type); }}
            className="mt-2"
          >
            <X className="h-3 w-3 mr-1" /> Remover
          </Button>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-sm text-gray-500">Carregando documentos...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`transition-all duration-200 ${isStepCompleted ? 'border-green-200 bg-green-50' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isStepCompleted ? 'bg-green-100' : 'bg-amber-100'}`}>
              <FileText className={`h-5 w-5 ${isStepCompleted ? 'text-green-600' : 'text-amber-600'}`} />
            </div>
            <div>
              <CardTitle className="text-lg">1. Documentos da Etapa 1</CardTitle>
              <CardDescription>Ficha de contrato, Planilha de Cálculo e Termo de Comissão</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isStepCompleted && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            <Switch
              checked={!!isStepCompleted}
              onCheckedChange={() => { if (!disabled && isStepCompleted) onToggle(false); }}
              disabled={disabled || !isStepCompleted}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Ficha de Contrato (PDF)</Label>
          <DropZone type="ficha" file={fichaFile} uploaded={fichaUploaded} accept=".pdf" hint="Arraste a ficha aqui ou clique para selecionar" id="ficha-upload" />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Planilha de Cálculo</Label>
          <DropZone type="planilha" file={planilhaFile} uploaded={planilhaUploaded} accept=".xlsx,.xls,.csv,.pdf,application/pdf" hint="Arraste a planilha aqui ou clique para selecionar" id="planilha-upload" />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Termo de Comissão <span className="text-xs text-gray-400 font-normal">(opcional)</span></Label>
          <DropZone type="termo" file={termoFile} uploaded={termoUploaded} accept=".xlsx,.xls,.csv,.pdf,application/pdf" hint="Arraste o termo aqui ou clique para selecionar" id="termo-upload" />
        </div>

        {(fichaFile || planilhaFile || termoFile) && (
          <div className="flex justify-end">
            <Button onClick={handleUpload} disabled={isUploading || disabled} className="bg-amber-600 hover:bg-amber-700">
              {isUploading ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Enviando...</>
              ) : (
                <><Upload className="h-4 w-4 mr-2" />Enviar Arquivo(s)</>
              )}
            </Button>
          </div>
        )}

        {!isStepCompleted && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">
              {fichaUploaded ? "✓ Ficha enviada" : "○ Ficha pendente"} •{" "}
              {planilhaUploaded ? "✓ Planilha enviada" : "○ Planilha pendente"} •{" "}
              {termoUploaded ? "✓ Termo enviado" : "○ Termo pendente"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
