import { createClient } from '@/lib/supabase/client';
import type { CreateProcessLogParams } from '@/types/process-logs';

/**
 * Registra uma atividade no log do processo
 * @param params Parâmetros para criar o log
 * @returns Promise com o ID do log criado ou null em caso de erro
 */
export async function createProcessLog(params: CreateProcessLogParams): Promise<string | null> {
  const supabase = createClient();
  if (!supabase) {
    console.error('❌ Cliente Supabase não disponível para criar log');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('process_logs')
      .insert({
        process_id: params.processId,
        user_id: params.userId,
        action: params.action,
        details: {
          description: params.description,
          ...params.metadata
        },
        old_values: null,
        new_values: null
      })
      .select('id')
      .single();

    if (error) {
      console.error('❌ Erro ao criar log:', error);
      return null;
    }

    return data.id;
  } catch (err) {
    console.error('❌ Exceção ao criar log:', err);
    return null;
  }
}

/**
 * Funções auxiliares para criar logs específicos
 */
export const logHelpers = {
  processCreated: (processId: string, userId: string, clientName: string) =>
    createProcessLog({
      processId,
      userId,
      action: 'process_created',
      description: `Processo criado para ${clientName}`,
      metadata: { clientName }
    }),

  processUpdated: (processId: string, userId: string, field: string, oldValue?: string, newValue?: string) =>
    createProcessLog({
      processId,
      userId,
      action: 'process_updated',
      description: `${field === 'client_name' ? 'Nome do cliente' : 'Endereço do imóvel'} atualizado`,
      metadata: { field, oldValue, newValue }
    }),

  stepToggled: (processId: string, userId: string, stepName: string, completed: boolean) =>
    createProcessLog({
      processId,
      userId,
      action: 'step_toggled',
      description: `Etapa "${stepName}" ${completed ? 'concluída' : 'reaberta'}`,
      metadata: { stepName, completed }
    }),

  documentUploaded: (processId: string, userId: string, personType: string, fileName: string, fileCount: number = 1) =>
    createProcessLog({
      processId,
      userId,
      action: 'document_uploaded',
      description: `${fileCount} documento(s) adicionado(s) para ${personType === 'comprador' ? 'Comprador' : 'Vendedor'}`,
      metadata: { personType, fileName, fileCount }
    }),

  documentDeleted: (processId: string, userId: string, personType: string, fileName: string) =>
    createProcessLog({
      processId,
      userId,
      action: 'document_deleted',
      description: `Documento "${fileName}" removido de ${personType === 'comprador' ? 'Comprador' : 'Vendedor'}`,
      metadata: { personType, fileName }
    }),

  contractUploaded: (processId: string, userId: string, fileName: string) =>
    createProcessLog({
      processId,
      userId,
      action: 'contract_uploaded',
      description: `Contrato "${fileName}" adicionado ao processo`,
      metadata: { fileName }
    }),

  statusChanged: (processId: string, userId: string, oldStatus: string, newStatus: string) =>
    createProcessLog({
      processId,
      userId,
      action: 'status_changed',
      description: `Status alterado de "${oldStatus}" para "${newStatus}"`,
      metadata: { oldStatus, newStatus }
    })
};
