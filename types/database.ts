export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'client' | 'secretaria' | 'financeiro' | 'administrativo' | 'gestor';
  created_at: string;
  updated_at: string;
};

export type Process = {
  id: string;
  user_id?: string | null;
  client_id: string;
  admin_id: string;
  contract_url: string | null;
  contract_filename: string | null;
  client_name: string;
  client_email: string;
  property_address: string | null;
  property_value: number | null;
  correspondent: string | null;
  sale_date?: string | null;
  commission_installments?: number | null;
  commission_payment_method?: 'boleto' | 'pix' | 'webropay' | null;
  expected_payment_dates?: { date: string; paid: boolean }[] | null;
  status: 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
};

export type ProcessStep = {
  id: string;
  process_id: string;
  step_order: number;
  step_name: string;
  step_description: string | null;
  status: 'pending' | 'completed';
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
};

export type StepDocument = {
  id: string;
  process_id: string;
  step_order: number;
  document_type: 'ficha' | 'planilha' | 'termo';
  file_url: string;
  file_filename: string;
  file_path: string;
  uploaded_by: string | null;
  created_at: string;
};

export type ProcessWithSteps = Process & {
  steps: ProcessStep[];
};

