export interface ProcessLog {
  id: string;
  process_id: string;
  user_id: string;
  action: 'process_created' | 'process_updated' | 'step_toggled' | 'document_uploaded' | 'document_deleted' | 'contract_uploaded' | 'status_changed';
  description: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface CreateProcessLogParams {
  processId: string;
  userId: string;
  action: ProcessLog['action'];
  description: string;
  metadata?: Record<string, any>;
}
