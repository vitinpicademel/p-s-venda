"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Upload, FileText, Download, X, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { StepDocument } from "@/types/database";

interface Step1UploadProps {
  processId: string;
  isCompleted: boolean;
  onToggle: (completed: boolean) => void;
  disabled?: boolean;
}

export default function Step1Upload({ processId, isCompleted, onToggle, disabled = false }: Step1UploadProps) {
  const [fichaFile, setFichaFile] = useState<File | null>(null);
  const [planilhaFile, setPlanilhaFile] = useState<File | null>(null);
  const [fichaUploaded, setFichaUploaded] = useState<StepDocument | null>(null);
  const [planilhaUploaded, setPlanilhaUploaded] = useState<StepDocument | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState({ ficha: false, planilha: false });
  const [isLoading, setIsLoading] = useState(true);

  // Carregar documentos já existentes
  useEffect(() => {
    loadExistingDocuments();
  }, [processId]);

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
        const ficha = data.find(doc => doc.document_type === 'ficha');
        const planilha = data.find(doc => doc.document_type === 'planilha');
        
        setFichaUploaded(ficha || null);
        setPlanilhaUploaded(planilha || null);

        // Se ambos os arquivos estão uploaded, marca como concluído
        if (ficha && planilha) {
          onToggle(true);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar documentos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (file: File, type: 'ficha' | 'planilha') => {
    if (file.type === "application/pdf" || file.type === "application/vnd.ms-excel" || 
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
      if (type === 'ficha') {
        setFichaFile(file);
      } else {
        setPlanilhaFile(file);
      }
    } else {
      alert(`Por favor, selecione um arquivo PDF (para ficha) ou Excel (para planilha)`);
    }
  };

  const handleDragOver = (e: React.DragEvent, type: 'ficha' | 'planilha') => {
    e.preventDefault();
    setIsDragging(prev => ({ ...prev, [type]: true }));
  };

  const handleDragLeave = (type: 'ficha' | 'planilha') => {
    setIsDragging(prev => ({ ...prev, [type]: false }));
  };

  const handleDrop = (e: React.DragEvent, type: 'ficha' | 'planilha') => {
    e.preventDefault();
    setIsDragging(prev => ({ ...prev, [type]: false }));

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file, type);
    }
  };

  const removeFile = (type: 'ficha' | 'planilha') => {
    if (type === 'ficha') {
      setFichaFile(null);
    } else {
      setPlanilhaFile(null);
    }
  };

  const uploadFile = async (file: File, type: 'ficha' | 'planilha'): Promise<StepDocument | null> => {
    const supabase = createClient();
    if (!supabase) throw new Error("Erro de conexão");

    // Sanitizar nome do arquivo
    const sanitizeFileName = (fileName: string, type: 'ficha' | 'planilha'): string => {
      const lastDotIndex = fileName.lastIndexOf(".");
      const nameWithoutExt = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
      const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : "";

      const normalized = nameWithoutExt.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const sanitized = normalized
        .replace(/[^a-zA-Z0-9]/g, "_")
        .replace(/_{2,}/g, "_")
        .replace(/^_+|_+$/g, "")
        .toLowerCase();

      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);

      return `${type}_${timestamp}_${random}${extension}`;
    };

    const sanitizedFileName = sanitizeFileName(file, type);
    const filePath = `step-documents/${processId}/step1/${sanitizedFileName}`;

    // Upload para storage
    const { error: uploadError } = await supabase.storage
      .from("contracts")
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
        cacheControl: "3600",
      });

    if (uploadError) throw uploadError;

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from("contracts")
      .getPublicUrl(filePath);

    // Salvar no banco
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("step_documents")
      .upsert({
        process_id: processId,
        step_order: 1,
        document_type: type,
        file_url: urlData.publicUrl,
        file_filename: file.name,
        file_path: filePath,
        uploaded_by: user?.id,
      }, {
        onConflict: 'process_id,step_order,document_type'
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  };

  const handleUpload = async () => {
    if (!fichaFile && !planilhaFile) {
      alert("Por favor, selecione pelo menos um arquivo para upload");
      return;
    }

    setIsUploading(true);
    try {
      const uploadPromises = [];
      
      if (fichaFile) {
        uploadPromises.push(uploadFile(fichaFile, 'ficha'));
      }
      
      if (planilhaFile) {
        uploadPromises.push(uploadFile(planilhaFile, 'planilha'));
      }

      const results = await Promise.all(uploadPromises);
      
      // Atualizar estado com os arquivos uploaded
      results.forEach(result => {
        if (result) {
          if (result.document_type === 'ficha') {
            setFichaUploaded(result);
            setFichaFile(null);
          } else if (result.document_type === 'planilha') {
            setPlanilhaUploaded(result);
            setPlanilhaFile(null);
          }
        }
      });

      // Verificar se ambos estão completos
      if (fichaUploaded || results.find(r => r?.document_type === 'ficha')) {
        if (planilhaUploaded || results.find(r => r?.document_type === 'planilha')) {
          onToggle(true);
        }
      }

    } catch (error) {
      console.error("Erro no upload:", error);
      alert("Erro ao fazer upload dos arquivos. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  const downloadFile = async (doc: StepDocument) => {
    try {
      const supabase = createClient();
      if (!supabase) return;

      const { data, error } = await supabase.storage
        .from('contracts')
        .download(doc.file_path);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.file_filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Erro no download:", error);
      alert("Erro ao baixar arquivo. Tente novamente.");
    }
  };

  const isStepCompleted = fichaUploaded && planilhaUploaded;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando...</div>
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
              <CardTitle className="text-lg">1. Ficha de contrato e Planilha de Cálculo</CardTitle>
              <CardDescription>Upload da ficha de contrato e planilha de cálculo</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isStepCompleted && (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            )}
            <Switch
              checked={isStepCompleted}
              onCheckedChange={() => {
                if (!disabled && isStepCompleted) {
                  onToggle(false);
                }
              }}
              disabled={disabled || !isStepCompleted}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload da Ficha */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Ficha de Contrato (PDF)</Label>
          {fichaUploaded ? (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">{fichaUploaded.file_filename}</span>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadFile(fichaUploaded!)}
                  className="h-8"
                >
                  <Download className="h-3 w-3" />
                </Button>
                {!disabled && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setFichaUploaded(null);
                      onToggle(false);
                    }}
                    className="h-8 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                isDragging.ficha 
                  ? 'border-amber-400 bg-amber-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={(e) => handleDragOver(e, 'ficha')}
              onDragLeave={() => handleDragLeave('ficha')}
              onDrop={(e) => handleDrop(e, 'ficha')}
            >
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], 'ficha')}
                className="hidden"
                id="ficha-upload"
                disabled={disabled}
              />
              <label htmlFor="ficha-upload" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  {fichaFile ? fichaFile.name : "Arraste a ficha aqui ou clique para selecionar"}
                </p>
                <p className="text-xs text-gray-500 mt-1">Apenas arquivos PDF</p>
              </label>
              {fichaFile && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    removeFile('ficha');
                  }}
                  className="mt-2"
                >
                  <X className="h-3 w-3 mr-1" />
                  Remover
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Upload da Planilha */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Planilha de Cálculo (Excel)</Label>
          {planilhaUploaded ? (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">{planilhaUploaded.file_filename}</span>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadFile(planilhaUploaded!)}
                  className="h-8"
                >
                  <Download className="h-3 w-3" />
                </Button>
                {!disabled && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setPlanilhaUploaded(null);
                      onToggle(false);
                    }}
                    className="h-8 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                isDragging.planilha 
                  ? 'border-amber-400 bg-amber-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={(e) => handleDragOver(e, 'planilha')}
              onDragLeave={() => handleDragLeave('planilha')}
              onDrop={(e) => handleDrop(e, 'planilha')}
            >
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], 'planilha')}
                className="hidden"
                id="planilha-upload"
                disabled={disabled}
              />
              <label htmlFor="planilha-upload" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  {planilhaFile ? planilhaFile.name : "Arraste a planilha aqui ou clique para selecionar"}
                </p>
                <p className="text-xs text-gray-500 mt-1">Excel (.xlsx, .xls) ou CSV</p>
              </label>
              {planilhaFile && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    removeFile('planilha');
                  }}
                  className="mt-2"
                >
                  <X className="h-3 w-3 mr-1" />
                  Remover
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Botão de Upload */}
        {(fichaFile || planilhaFile) && (
          <div className="flex justify-end">
            <Button
              onClick={handleUpload}
              disabled={isUploading || disabled}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Enviar Arquivo(s)
                </>
              )}
            </Button>
          </div>
        )}

        {/* Status da Etapa */}
        {!isStepCompleted && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <p className="text-sm text-amber-800">
              {fichaUploaded ? "✓ Ficha enviada" : "○ Ficha pendente"} • 
              {planilhaUploaded ? "✓ Planilha enviada" : "○ Planilha pendente"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
