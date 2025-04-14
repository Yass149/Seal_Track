export interface Signer {
  id: string;
  name: string;
  email: string;
  has_signed: boolean;
  signature_timestamp?: string;
  signature_hash?: string;
  signature_data_url?: string;
}

export interface Document {
  id: string;
  title: string;
  description: string;
  content: string;
  created_at: string;
  created_by: string;
  status: 'draft' | 'pending' | 'completed' | 'rejected';
  signers: Signer[];
  signatures?: Record<string, string>;
  file_url?: string;
  blockchain_hash?: string;
  is_authentic?: boolean;
  template_id?: string;
  category?: string;
}

export interface DocumentContextType {
  documents: Document[];
  loading: boolean;
  error: Error | null;
  fetchDocuments: () => Promise<void>;
  addSignature: (documentId: string, signatureDataUrl: string) => Promise<void>;
  createDocument: (document: Partial<Document>) => Promise<Document>;
  updateDocument: (documentId: string, updates: Partial<Document>) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
}

export type DocumentUpdatePayload = {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  old: Document | null;
  new: Document | null;
}; 