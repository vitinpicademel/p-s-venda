"use client";

// Commit de teste: funcionalidade de download direto implementada
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Building2, FileText, Download, CheckCircle2, Clock, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ProcessDocument } from "@/types/documents";
import ProcessDocumentsForm from "./ProcessDocumentsForm";

const PROCESS_DOCS_BUCKET = "arquivos";

interface ProcessDocumentsListProps {
  processId: string;
  processClientName: string;
}

export default function ProcessDocumentsList({
  processId,
  processClientName,
}: ProcessDocumentsListProps) {
  const [documents, setDocuments] = useState<ProcessDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPersonType, setSelectedPersonType] = useState<"comprador" | "vendedor" | null>(null);

  const supabase = createClient();

  const fetchDocuments = async () => {
    if (!supabase) return;

    try {
      setIsLoading(true);
      
      // Buscar APENAS documentos de dossiê (comprador e vendedor)
      // EXCLUIR contrato_inicial - ele não deve aparecer aqui
      const { data, error } = await supabase
        .from("process_documents")
        .select("*")
        .eq("process_id", processId)
        .in("doc_type", ["dossie_comprador", "dossie_vendedor"])
        .order("created_at", { ascending: false });

      if (error) {
        // Se o erro for porque doc_type não existe, buscar com fallback
        if (error.message?.includes("doc_type") || error.message?.includes("column")) {
          console.warn("Campo doc_type não encontrado, usando fallback");
          const { data: fallbackData, error: fallbackError } = await supabase
            .from("process_documents")
            .select("*")
            .eq("process_id", processId)
            .order("created_at", { ascending: false });
          
          if (fallbackError) throw fallbackError;
          
          // Filtrar no cliente: apenas documentos com person_type válido E que tenham file_path
          // E que NÃO sejam contrato_inicial (verificar se não tem doc_type ou se não é contrato_inicial)
          const filtered = (fallbackData || []).filter((doc: any) => {
            const docs = doc.documents || {};
            const hasFilePath = !!docs.file_path;
            const hasValidPersonType = doc.person_type === "comprador" || doc.person_type === "vendedor";
            // Excluir se for contrato_inicial (mesmo sem doc_type, podemos verificar pelo documents.doc_type)
            const isContratoInicial = docs.doc_type === "contrato_inicial" || doc.doc_type === "contrato_inicial";
            return hasFilePath && hasValidPersonType && !isContratoInicial;
          });
          
          setDocuments(filtered);
          return;
        }
        throw error;
      }

      // Filtrar para garantir que só pegamos documentos válidos com file_path
      const filtered = (data || []).filter((doc: any) => {
        const docs = doc.documents || {};
        const hasFilePath = !!docs.file_path;
        // Garantir que é dossie_comprador ou dossie_vendedor
        const isValidDocType = doc.doc_type === "dossie_comprador" || doc.doc_type === "dossie_vendedor";
        // Garantir que person_type corresponde ao doc_type
        const personTypeMatches = 
          (doc.doc_type === "dossie_comprador" && doc.person_type === "comprador") ||
          (doc.doc_type === "dossie_vendedor" && doc.person_type === "vendedor");
        
        return hasFilePath && isValidDocType && personTypeMatches;
      });

      setDocuments(filtered);
    } catch (error) {
      console.error("Erro ao buscar documentos:", error);
      setDocuments([]); // Garantir que não fica com dados antigos
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (supabase) {
      fetchDocuments();
    }
  }, [processId, supabase, fetchDocuments]);

  const handleOpenForm = (personType: "comprador" | "vendedor") => {
    setSelectedPersonType(personType);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedPersonType(null);
  };

  const handleSuccess = () => {
    fetchDocuments();
  };

  const getDocumentStatus = (doc: ProcessDocument) => {
    const docs = doc.documents as any;
    // Verifica se tem o file_path (obrigatório para visualização)
    // file_path é o campo que realmente indica que o arquivo foi enviado
    return !!(docs.file_path);
  };

  const getDocumentCount = (doc: ProcessDocument) => {
    const docs = doc.documents as any;
    // Conta apenas se tem file_path válido
    return docs.file_path ? 1 : 0;
  };

  const getTotalRequiredDocs = () => {
    // Agora só precisa de 1 arquivo (documentação completa)
    return 1;
  };

  // Filtrar documentos por tipo específico - BUSCA ESTRITA
  // Comprador: APENAS se existir doc_type: 'dossie_comprador' E person_type: 'comprador'
  const hasComprador = documents.some((d) => {
    const docs = d.documents as any;
    const hasFilePath = !!docs.file_path;
    return (
      d.doc_type === "dossie_comprador" &&
      d.person_type === "comprador" &&
      hasFilePath
    );
  });
  
  // Vendedor: APENAS se existir doc_type: 'dossie_vendedor' E person_type: 'vendedor'
  const hasVendedor = documents.some((d) => {
    const docs = d.documents as any;
    const hasFilePath = !!docs.file_path;
    return (
      d.doc_type === "dossie_vendedor" &&
      d.person_type === "vendedor" &&
      hasFilePath
    );
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-slate-500">Carregando documentos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Comprador */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-[#d4a574]" />
                <CardTitle className="text-lg">Documentos do Comprador</CardTitle>
              </div>
              {!hasComprador && (
                <Button
                  size="sm"
                  className="bg-[#d4a574] hover:bg-[#c49564] text-[#302521] gap-2"
                  onClick={() => handleOpenForm("comprador")}
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Documentos
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {hasComprador ? (
              (() => {
                // Buscar especificamente o documento do tipo dossie_comprador
                // BUSCA ESTRITA: doc_type: 'dossie_comprador' E person_type: 'comprador'
                const compradorDoc = documents.find((d) => {
                  const docs = d.documents as any;
                  const hasFilePath = !!docs.file_path;
                  return (
                    d.doc_type === "dossie_comprador" &&
                    d.person_type === "comprador" &&
                    hasFilePath
                  );
                });
                if (!compradorDoc) return null;

                const isComplete = getDocumentStatus(compradorDoc);
                const docCount = getDocumentCount(compradorDoc);
                const totalRequired = getTotalRequiredDocs();

                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isComplete ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-amber-600" />
                        )}
                        <span className="font-medium">
                          {docCount}/{totalRequired} documentos enviados
                        </span>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isComplete
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {isComplete ? "Completo" : "Pendente"}
                      </span>
                    </div>

                    <DocumentDetails doc={compradorDoc} />
                  </div>
                );
              })()
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">
                Nenhum documento do comprador foi adicionado ainda.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Vendedor */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#d4a574]" />
                <CardTitle className="text-lg">Documentos do Vendedor</CardTitle>
              </div>
              {!hasVendedor && (
                <Button
                  size="sm"
                  className="bg-[#d4a574] hover:bg-[#c49564] text-[#302521] gap-2"
                  onClick={() => handleOpenForm("vendedor")}
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Documentos
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {hasVendedor ? (
              (() => {
                // Buscar especificamente o documento do tipo dossie_vendedor
                // BUSCA ESTRITA: doc_type: 'dossie_vendedor' E person_type: 'vendedor'
                const vendedorDoc = documents.find((d) => {
                  const docs = d.documents as any;
                  const hasFilePath = !!docs.file_path;
                  return (
                    d.doc_type === "dossie_vendedor" &&
                    d.person_type === "vendedor" &&
                    hasFilePath
                  );
                });
                if (!vendedorDoc) return null;

                const isComplete = getDocumentStatus(vendedorDoc);
                const docCount = getDocumentCount(vendedorDoc);
                const totalRequired = getTotalRequiredDocs();

                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isComplete ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-amber-600" />
                        )}
                        <span className="font-medium">
                          {docCount}/{totalRequired} documentos enviados
                        </span>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isComplete
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {isComplete ? "Completo" : "Pendente"}
                      </span>
                    </div>

                    <DocumentDetails doc={vendedorDoc} />
                  </div>
                );
              })()
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">
                Nenhum documento do vendedor foi adicionado ainda.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Form Dialog */}
      {selectedPersonType && (
        <ProcessDocumentsForm
          processId={processId}
          processClientName={processClientName}
          personType={selectedPersonType}
          open={isFormOpen}
          onClose={handleCloseForm}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}

function DocumentDetails({ doc }: { doc: ProcessDocument }) {
  const documents = doc.documents as any;
  const documentacaoFilename = documents.documentacao_completa_filename || "Documentação Completa.pdf";
  const bucket = documents.bucket || PROCESS_DOCS_BUCKET;
  const filePath = documents.file_path;

  if (!filePath) {
    return (
      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
        <p className="text-xs text-amber-700">
          ⚠️ Arquivo não encontrado. O documento pode não ter sido enviado corretamente.
        </p>
      </div>
    );
  }

  const downloadFile = async (path: string, fileName: string) => {
    try {
      const supabase = createClient();
      if (!supabase) {
        alert("Erro: Não foi possível conectar ao sistema.");
        return;
      }

      // 1. Baixa o arquivo como 'blob' do Supabase
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(path);

      if (error) throw error;

      // 2. Cria um link temporário para forçar o download no navegador
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName); // Nome que o arquivo terá ao baixar
      document.body.appendChild(link);
      link.click();

      // 3. Limpa o link e o objeto da memória
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (err: any) {
      console.error('Erro no download:', err);
      alert('Não foi possível baixar o arquivo.');
    }
  };

  const handleDownload = () => {
    // Validar bucket e file_path antes de tentar fazer download
    if (!bucket || !filePath) {
      alert("Erro: Informações do arquivo incompletas.");
      return;
    }

    // Usar o nome do arquivo original ou um nome padrão
    const fileName = documentacaoFilename || "Documentação Completa.pdf";
    
    // Iniciar o download
    downloadFile(filePath, fileName);
  };

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-slate-700">Documentação</h4>
      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2 flex-1">
          <FileText className="h-5 w-5 text-slate-600" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700">Documentação Completa</p>
            {documentacaoFilename && (
              <p className="text-xs text-slate-500 truncate">{documentacaoFilename}</p>
            )}
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleDownload}
          className="gap-2"
        >
          <Download className="h-3 w-3" />
          Baixar PDF
        </Button>
      </div>
    </div>
  );
}
