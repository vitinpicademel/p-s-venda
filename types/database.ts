export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'client';
  created_at: string;
  updated_at: string;
};

export type Process = {
  id: string;
  client_id: string;
  admin_id: string;
  contract_url: string | null;
  contract_filename: string | null;
  client_name: string;
  client_email: string;
  property_address: string | null;
  property_value: number | null;
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

export type ProcessWithSteps = Process & {
  steps: ProcessStep[];
};

