"use client";

import { useState, useEffect } from "react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, FileText, X, User, Building2, Cloud } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { DocumentFormData, PersonType } from "@/types/documents";
import { useToast } from "@/components/ui/toast";
import { logHelpers } from "@/lib/process-logs";

const PROCESS_DOCS_BUCKET = "arquivos";

interface ProcessDocumentsFormProps {
  processId: string;
  processClientName: string;
  personType?: PersonType;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ProcessDocumentsForm({
  processId,
  processClientName,
  personType: initialPersonType = "comprador",
  open,
  onClose,
  onSuccess,
}: ProcessDocumentsFormProps) {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [personType, setPersonType] = useState<PersonType | "imovel">(initialPersonType as PersonType | "imovel");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedFiles([]);
      setPersonType(initialPersonType);
    } else {
      setPersonType(initialPersonType);
    }
  }, [open, initialPersonType]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setPersonType(value as PersonType | "imovel");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const validFiles = files.filter(file => {
        if (file.type !== "application/pdf") {
          showToast({
            title: "Formato inválido",
            description: `O arquivo ${file.name} não é um PDF`,
            type: "error",
          });
          return false;
        }

        if (file.size > 100 * 1024 * 1024) {
          showToast({
            title: "Arquivo muito grande",
            description: `O arquivo ${file.name} deve ter no máximo 100MB`,
            type: "error",
          });
          return false;
        }

        return true;
      });

      setSelectedFiles(prev => [...prev, ...validFiles]);
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

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const validFiles = files.filter(file => {
        if (file.type !== "application/pdf") {
          showToast({
            title: "Formato inválido",
            description: `O arquivo ${file.name} não é um PDF`,
            type: "error",
          });
          return false;
        }

        if (file.size > 100 * 1024 * 1024) {
          showToast({
            title: "Arquivo muito grande",
            description: `O arquivo ${file.name} deve ter no máximo 100MB`,
            type: "error",
          });
          return false;
        }

        return true;
      });

      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
  };

  /**
   * Sanitiza o nome do arquivo removendo acentos, caracteres especiais e espaços
   * @param fileName Nome original do arquivo
   * @returns Nome sanitizado com apenas caracteres alfanuméricos, underscore e extensão
   */
  const sanitizeFileName = (fileName: string): string => {
    // Separar nome e extensão
    const lastDotIndex = fileName.lastIndexOf(".");
    const nameWithoutExt = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
    const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : "";

    // Normalizar e remover acentos (NFD = Normalization Form Decomposed)
    const normalized = nameWithoutExt.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Substituir tudo que não for alfanumérico por underscore e converter para lowercase
    const sanitized = normalized
      .replace(/[^a-zA-Z0-9]/g, "_")
      .replace(/_{2,}/g, "_") // Remove underscores duplicados
      .replace(/^_+|_+$/g, "") // Remove underscores no início e fim
      .toLowerCase();

    // Garantir que o nome não esteja vazio
    const finalName = sanitized || "arquivo";

    // Adicionar timestamp para garantir unicidade
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);

    return `${finalName}_${timestamp}_${random}${extension}`;
  };

  /**
   * Sanitiza e valida o caminho do arquivo
   * @param folder Nome da pasta
   * @param fileName Nome do arquivo (já sanitizado)
   * @returns Caminho sanitizado sem barras duplas ou caracteres inválidos
   */
  const sanitizePath = (folder: string, fileName: string): string => {
    // Sanitizar nome da pasta (remover caracteres especiais e barras)
    const cleanFolder = folder
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .replace(/_{2,}/g, "_")
      .replace(/^_+|_+$/g, "");

    // Remover barras duplas e normalizar
    const path = `${cleanFolder}/${fileName}`
      .replace(/\/+/g, "/") // Remove barras duplicadas
      .replace(/^\/+|\/+$/g, ""); // Remove barras no início e fim

    return path;
  };

  const uploadFile = async (file: File, path: string): Promise<{ bucket: string; path: string } | null> => {
    const supabase = createClient();
    if (!supabase) {
      console.error("❌ Cliente Supabase não disponível");
      return null;
    }

    // Verificar autenticação antes do upload
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("❌ Usuário não autenticado:", authError);
      return null;
    }

    // Verificar se é da equipe
    const allowedRoles = ["admin", "secretaria", "financeiro", "administrativo", "gestor"];
    if (!profile?.role || !allowedRoles.includes(profile.role)) {
      console.error("❌ Usuário sem permissão para upload. Role:", profile?.role);
      return null;
    }

    // Sempre sanitizar o nome do arquivo para garantir segurança
    const sanitizedFileName = sanitizeFileName(file.name);
    
    // Extrair pasta do path (tudo exceto o último elemento que é o nome do arquivo)
    const pathParts = path.split("/");
    const folder = pathParts.slice(0, -1).join("/");
    
    // Substituir SEMPRE o nome do arquivo no path pelo nome sanitizado
    // Isso garante que o upload sempre use o nome sanitizado, mesmo se o path
    // foi passado com nome original
    const sanitizedPath = folder ? `${folder}/${sanitizedFileName}` : sanitizedFileName;
    
    // Normalizar path (remover barras duplas, etc)
    const finalPath = sanitizedPath.replace(/\/+/g, "/").replace(/^\/+|\/+$/g, "");

    // DEBUG: Logs completos antes do upload
    console.log("📤 DEBUG UPLOAD - Informações do Arquivo:", {
      nomeOriginal: file.name,
      nomeSanitizado: sanitizedFileName,
      tamanhoArquivo: `${(file.size / 1024).toFixed(2)} KB`,
      tipoMIME: file.type,
      pathOriginal: path,
      pathSanitizado: finalPath,
      bucket: PROCESS_DOCS_BUCKET,
      userId: user.id,
      userEmail: user.email,
      profileRole: profile?.role,
    });

    // Validar tipo de arquivo
    if (!file.type || !file.type.includes("pdf")) {
      console.warn("⚠️ Tipo MIME não é PDF. Usando 'application/pdf' como fallback");
    }

    try {
      const { data, error } = await supabase.storage
        .from(PROCESS_DOCS_BUCKET)
        .upload(finalPath, file, {
          upsert: true, // Permite sobrescrever se existir
          contentType: file.type || "application/pdf", // Força o tipo MIME
          cacheControl: "3600", // Cache de 1 hora
        });

      if (error) {
        console.error("❌ Erro no upload:", error);
        console.error("❌ Detalhes do erro:", {
          message: error.message,
          statusCode: (error as any).statusCode,
          error: (error as any).error,
          name: (error as any).name,
        });
        return null;
      }

      console.log("✅ Upload bem-sucedido:", {
        path: finalPath,
        data: data,
      });

      return { bucket: PROCESS_DOCS_BUCKET, path: finalPath };
    } catch (err: any) {
      console.error("❌ Exceção durante upload:", err);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedFiles.length === 0) {
      showToast({
        title: "Arquivos obrigatórios",
        description: "Por favor, selecione pelo menos um arquivo PDF",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);

    const supabase = createClient();
    if (!supabase) {
      showToast({
        title: "Erro",
        description: "Não foi possível conectar ao banco de dados",
        type: "error",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const uploadPromises = selectedFiles.map(async (file) => {
        // Sanitizar nome do arquivo ANTES de construir o path
        const sanitizedFileName = sanitizeFileName(file.name);
        
        // Construir path com o nome já sanitizado
        const filePath = `${processId}/${personType}/${sanitizedFileName}`;
        const uploaded = await uploadFile(file, filePath);

        if (!uploaded) {
          throw new Error(`Erro ao fazer upload do arquivo ${file.name}`);
        }

        // Salvar no banco de dados
        // IMPORTANTE: doc_type deve corresponder estritamente ao person_type
        const docType = personType === "comprador" 
          ? "dossie_comprador" 
          : personType === "vendedor" 
            ? "dossie_vendedor" 
            : "dossie_imovel";
        
        // Preparar dados para inserção
        const insertData: any = {
          process_id: processId,
          person_type: personType, // 'comprador' ou 'vendedor'
          doc_type: docType, // 'dossie_comprador' ou 'dossie_vendedor' - OBRIGATÓRIO
          // Campo obrigatório no schema atual (evita 23502 not_null_violation)
          estado_civil: "solteiro",
          documents: {
            documentacao_completa_filename: file.name,
            // Bucket público + path (usado para getPublicUrl) - OBRIGATÓRIO
            bucket: uploaded.bucket,
            file_path: uploaded.path, // CRÍTICO: sem isso, o documento não pode ser visualizado
            // Tipo genérico do pacote completo (mantido para compatibilidade)
            doc_type: "documentacao_completa",
          },
        };
        
        const { error, data } = await supabase.from("process_documents").insert(insertData).select().single();

        if (error) {
          // Se o erro for porque doc_type não existe ou tem valor inválido
          if (error.message?.includes("doc_type") || error.message?.includes("column") || error.message?.includes("check constraint")) {
            console.error("Erro ao salvar documento:", error);
            throw new Error(
              "Erro ao salvar documento. Verifique se o SQL ATUALIZAR_DOC_TYPE_CONTRATO_INICIAL.sql foi executado."
            );
          }
          throw error;
        }

        return data;
      });

      // Aguardar todos os uploads
      await Promise.all(uploadPromises);

      // Registrar log de upload de documentos
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await logHelpers.documentUploaded(
          processId,
          user.id,
          personType,
          selectedFiles.map(f => f.name).join(', '),
          selectedFiles.length
        );
      }

      showToast({
        title: "Documentos enviados com sucesso!",
        description: `${selectedFiles.length} arquivo(s) de ${personType === "comprador" ? "Comprador" : personType === "vendedor" ? "Vendedor" : "Imóvel"} foram salvos.`,
        type: "success",
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Erro ao salvar documentos:", error);
      showToast({
        title: "Erro ao salvar documentos",
        description: error.message || "Tente novamente",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-6">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl flex items-center gap-2">
            {personType === "comprador" ? (
              <User className="h-5 w-5 text-[#d4a574]" />
            ) : personType === "vendedor" ? (
              <Building2 className="h-5 w-5 text-[#d4a574]" />
            ) : (
              <FileText className="h-5 w-5 text-[#d4a574]" />
            )}
            Documentos - {personType === "comprador" ? "Comprador" : personType === "vendedor" ? "Vendedor" : "Imóvel"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Processo: {processClientName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seletor de Tipo */}
          <div className="space-y-2">
            <Label htmlFor="personType">Tipo de Pessoa</Label>
            <Select
              id="personType"
              name="personType"
              value={personType}
              onChange={handleSelectChange}
            >
              <option value="comprador">Comprador</option>
              <option value="vendedor">Vendedor</option>
              <option value="imovel">Imóvel</option>
            </Select>
          </div>

          {/* Upload de Documentação Completa */}
          <div className="space-y-2">
            <Label htmlFor="documentacao_completa">
              Documentação Completa (PDF) <span className="text-red-500">*</span>
            </Label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                relative border-2 border-dashed rounded-lg p-8 transition-colors
                ${
                  isDragging
                    ? "border-[#d4a574] bg-amber-50"
                    : selectedFiles.length > 0
                    ? "border-green-500 bg-green-50"
                    : "border-slate-300 bg-slate-50 hover:border-[#d4a574] hover:bg-slate-100"
                }
              `}
            >
              <input
                id="documentacao_completa"
                type="file"
                accept=".pdf"
                multiple
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {selectedFiles.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-700">
                      {selectedFiles.length} arquivo(s) selecionados
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearAllFiles();
                      }}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Limpar todos
                    </Button>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white border rounded-lg">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
                            <p className="text-xs text-slate-500">
                              {(file.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(index);
                          }}
                          className="h-6 w-6 flex-shrink-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 bg-amber-100 rounded-full">
                      <Cloud className="h-8 w-8 text-[#d4a574]" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    Clique ou arraste os arquivos PDF aqui
                  </p>
                  <p className="text-xs text-slate-500">
                    Apenas arquivos PDF são aceitos (máximo 100MB cada)
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    Você pode selecionar vários arquivos de uma vez
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    Inclua toda a documentação digitalizada (CPF, RG, Certidões, etc.)
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-[#d4a574] hover:bg-[#c49564] text-[#302521]"
              disabled={isSubmitting || selectedFiles.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Salvar Documentos
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
