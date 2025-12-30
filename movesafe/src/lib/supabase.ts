import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Safe {
  id: string;
  address: string;
  name: string;
  threshold: number;
  owners: string[];
  created_at: string;
  updated_at: string;
}

export interface SafeDraft {
  id: string;
  name: string;
  threshold: number;
  owner_limit: number;
  owners: string[];
  created_by_pubkey: string;
  join_token: string;
  admin_token: string;
  status: 'DRAFT' | 'FINALIZED' | 'CANCELLED';
  finalized_safe_address: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  safe_address: string;
  payload: {
    function: string;
    typeArguments: string[];
    functionArguments: (string | number | boolean | Uint8Array)[];
    txOptions?: {
      maxGasAmount?: string;
      gasUnitPrice?: string;
      expireTimestamp?: string;
    };
  };
  status: 'PENDING' | 'EXECUTED' | 'REJECTED';
  created_by: string;
  sequence_number: number;
  tx_hash?: string;
  created_at: string;
  executed_at?: string;
  updated_at?: string;
}

export interface Signature {
  id: string;
  transaction_id: string;
  signer_address: string;
  signature_hex: string;
  signed_at: string;
}

export interface ExecutableTransaction extends Transaction {
  threshold: number;
  signature_count: number;
  is_executable: boolean;
}
