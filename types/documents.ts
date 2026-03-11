// Tipos para documentos de comprador e vendedor

export type MaritalStatus = 'solteiro' | 'casado' | 'divorciado' | 'viuvo';

export type DocumentType = 
  | 'cpf'
  | 'rg'
  | 'comprovante_residencia'
  | 'certidao_nascimento'
  | 'certidao_casamento'
  | 'certidao_casamento_averbacao'
  | 'dados_bancarios'
  | 'matricula_imovel';

export type PersonType = 'comprador' | 'vendedor';

export interface PersonDocumentData {
  // Documentação completa (único arquivo PDF)
  documentacao_completa_file?: string; // URL do arquivo
  documentacao_completa_filename?: string;
  doc_type?: string; // 'documentacao_completa'
}

export type DocumentTypeCategory = 'dossie_comprador' | 'dossie_vendedor';

export interface ProcessDocument {
  id: string;
  process_id: string;
  person_type: PersonType; // 'comprador' ou 'vendedor'
  doc_type: DocumentTypeCategory; // 'dossie_comprador' ou 'dossie_vendedor' - diferenciação do contrato principal
  
  // Dados da pessoa principal (opcionais, mantidos para compatibilidade)
  telefone?: string;
  email?: string;
  profissao?: string;
  estado_civil?: MaritalStatus;
  
  // Documentos da pessoa principal (JSONB) - agora apenas documentação completa
  documents: PersonDocumentData;
  
  // Dados do cônjuge (removido - não mais necessário)
  spouse_data?: any;
  
  created_at: string;
  updated_at: string;
}

// Tipo para o formulário de upload (simplificado)
export interface DocumentFormData {
  personType: PersonType;
  documentacao_completa_file: File | null; // Único arquivo PDF com toda documentação
}
