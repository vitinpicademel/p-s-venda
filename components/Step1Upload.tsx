"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Upload, FileText, Download, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { StepDocument } from "@/types/database";
import { useToast } from "@/components/ui/toast";

type DocType = 'ficha' | 'planilha' | 'termo';

interface Step1UploadProps {
  processId: string;
  isCompleted: boolean;
  onToggle: (completed: boolean) => void;
  disabled?: boolean;
}

export default function Step1Upload({ processId, isCompleted, onToggle, disabled = false }: Step1UploadProps) {
  const { showToast } = useToast();

  const [files, setFiles] = useState<Record<DocType, File | null>>({ ficha: null, planilha: null, termo: null });
  const [uploaded, setUploaded] = useState<Record<DocType, StepDocument | null>>({ ficha: null, planilha: null, termo: null });
  // Track which doc types are currently uploading
  const [uploading, setUploading] = useState<Set<DocType>>(new Set());
  const [isDragging, setIsDragging] = useState<Record<DocType, boolean>>({ ficha: false, planilha: false, termo: false });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadExistingDocuments(); }, [processId]);

  const loadExistingDocuments = async () => {
    const supabase = createClient();
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from("step_documents")
        .select("*")
        .eq("process_id", processId)
        .eq("step_order", 1);

      if (error) throw error;

      if (data) {
        const result: Record<DocType, StepDocument | null> = { ficha: null, planilha: null, termo: null };
        for (const doc of data as StepDocument[]) {
          if (doc.document_type === 'ficha' || doc.document_type === 'planilha' || doc.document_type === 'termo') {
            result[doc.document_type] = doc;
          }
        }
        setUploaded(result);
        if (result.ficha && result.planilha) onToggle(true);
      }
    } catch (err) {
      console.error("[Step1Upload] Erro ao carregar:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const setFile = (type: DocType, file: File | null) =>
    setFiles(prev => ({ ...prev, [type]: file }));

  const handleDragOver = (e: React.DragEvent, type: DocType) => {
    e.preventDefault();
    setIsDragging(prev => ({ ...prev, [type]: true }));
  };
  const handleDragLeave = (type: DocType) =>
    setIsDragging(prev => ({ ...prev, [type]: false }));
  const handleDrop = (e: React.DragEvent, type: DocType) => {
    e.preventDefault();
    setIsDragging(prev => ({ ...prev, [type]: false }));
    const f = e.dataTransfer.files[0];
    if (f) setFile(type, f);
  };

  const uploadSingle = async (file: File, type: DocType): Promise<StepDocument> => {
    const supabase = createClient();
    if (!supabase) throw new Error("Supabase client não disponível");

    const ext = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : '';
    const filePath = `step-documents/${processId}/step1/${type}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;

    // Upload to storage
    const { error: storageError } = await supabase.storage
      .from("contracts")
      .upload(filePath, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
    if (storageError) throw storageError;

    const { data: urlData } = supabase.storage.from("contracts").getPublicUrl(filePath);
    const { data: { user } } = await supabase.auth.getUser();

    // Check for existing record
    const { data: existing } = await supabase
      .from("step_documents")
      .select("id")
      .eq("process_id", processId)
      .eq("step_order", 1)
      .eq("document_type", type)
      .maybeSingle();

    let result: StepDocument;
    if (existing?.id) {
      const { data, error } = await supabase
        .from("step_documents")
        .update({ file_url: urlData.publicUrl, file_filename: file.name, file_path: filePath, uploaded_by: user?.id ?? null })
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from("step_documents")
        .insert({ process_id: processId, step_order: 1, document_type: type, file_url: urlData.publicUrl, file_filename: file.name, file_path: filePath, uploaded_by: user?.id ?? null })
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    return result;
  };

  // Upload each file independently with per-file loading indicator
  const handleUploadType = async (type: DocType) => {
    const file = files[type];
    if (!file) return;

    setUploading(prev => new Set(prev).add(type));
    try {
      const result = await uploadSingle(file, type);

      // Optimistic local state update — no re-fetch needed
      setUploaded(prev => {
        const next = { ...prev, [type]: result };
        if (next.ficha && next.planilha) onToggle(true);
        return next;
      });
      setFiles(prev => ({ ...prev, [type]: null }));

      showToast({ title: "Arquivo enviado com sucesso!", type: "success" });
    } catch (err: any) {
      console.error(`[Step1Upload] Erro no upload de ${type}:`, err);
      showToast({ title: "Falha ao enviar arquivo", description: err?.message ?? "Verifique o console.", type: "error" });
    } finally {
      setUploading(prev => { const s = new Set(prev); s.delete(type); return s; });
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
    } catch (err: any) {
      showToast({ title: "Erro ao baixar arquivo", description: err?.message, type: "error" });
    }
  };

  const removeUploaded = (type: DocType) => {
    setUploaded(prev => ({ ...prev, [type]: null }));
    if (type === 'ficha' || type === 'planilha') onToggle(false);
  };

  const isStepCompleted = !!(uploaded.ficha && uploaded.planilha);

  // ── Single document slot ───────────────────────────────────────────────────
  const DocSlot = ({
    type, label, accept, hint, id,
  }: { type: DocType; label: string; accept: string; hint: string; id: string }) => {
    const isUp = uploading.has(type);
    const file = files[type];
    const doc = uploaded[type];

    if (isUp) {
      return (
        <div className="flex items-center gap-3 p-4 border-2 border-dashed border-amber-300 bg-amber-50 rounded-lg">
          <Loader2 className="h-5 w-5 text-amber-600 animate-spin shrink-0" />
          <span className="text-sm text-amber-700 font-medium">Enviando arquivo...</span>
        </div>
      );
    }

    if (doc) {
      return (
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
              <Button size="sm" variant="outline" onClick={() => removeUploaded(type)} className="h-8 text-red-600 border-red-200 hover:bg-red-50">
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      );
    }

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
          type="file" accept={accept} id={id} disabled={disabled}
          className="hidden"
          onChange={(e) => e.target.files?.[0] && setFile(type, e.target.files[0])}
        />
        {file ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
            <div className="flex justify-center gap-2">
              <Button size="sm" onClick={() => handleUploadType(type)} disabled={disabled} className="bg-amber-600 hover:bg-amber-700 text-white">
                <Upload className="h-3 w-3 mr-1" /> Enviar
              </Button>
              <Button size="sm" variant="outline" onClick={() => setFile(type, null)}>
                <X className="h-3 w-3 mr-1" /> Remover
              </Button>
            </div>
          </div>
        ) : (
          <label htmlFor={id} className={disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}>
            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600">{hint}</p>
            <p className="text-xs text-gray-500 mt-1">{type === 'ficha' ? 'Apenas PDF' : 'Excel, CSV ou PDF'}</p>
          </label>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          <span className="text-sm text-slate-500">Carregando documentos...</span>
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
              checked={isStepCompleted}
              onCheckedChange={() => { if (!disabled && isStepCompleted) onToggle(false); }}
              disabled={disabled || !isStepCompleted}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Ficha de Contrato (PDF)</Label>
          <DocSlot type="ficha" label="Ficha de Contrato" accept=".pdf" hint="Arraste a ficha aqui ou clique para selecionar" id="ficha-upload" />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Planilha de Cálculo</Label>
          <DocSlot type="planilha" label="Planilha de Cálculo" accept=".xlsx,.xls,.csv,.pdf,application/pdf" hint="Arraste a planilha aqui ou clique para selecionar" id="planilha-upload" />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Termo de Comissão <span className="text-xs text-gray-400 font-normal">(opcional)</span></Label>
          <DocSlot type="termo" label="Termo de Comissão" accept=".xlsx,.xls,.csv,.pdf,application/pdf" hint="Arraste o termo aqui ou clique para selecionar" id="termo-upload" />
        </div>

        {!isStepCompleted && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">
              {uploaded.ficha ? "✓ Ficha enviada" : "○ Ficha pendente"} •{" "}
              {uploaded.planilha ? "✓ Planilha enviada" : "○ Planilha pendente"} •{" "}
              {uploaded.termo ? "✓ Termo enviado" : "○ Termo pendente"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
