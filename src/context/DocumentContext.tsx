import React, { createContext, useContext, useState, useEffect, type FC, type ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/components/ui/use-toast';
import { type ToastProps } from '@/components/ui/toast';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { BlockchainService } from '../lib/blockchain';

interface Signer {
  id: string;
  name: string;
  email: string;
  has_signed: boolean;
  signature_timestamp?: string;
  signature_data_url?: string;
  signature_hash?: string;
}

export interface Document {
  id: string;
  title: string;
  description?: string;
  content: string;
  created_at: string;
  created_by: string;
  status: 'draft' | 'pending' | 'completed' | 'rejected';
  signers: Signer[];
  category?: string;
  template_id?: string;
  blockchain_hash?: string;
  document_hash?: string;
  is_authentic?: boolean;
  last_verified_at?: string;
}

export interface Template extends Omit<Document, 'status' | 'created_by' | 'signers' | 'blockchain_hash'> {
  created_at: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  walletAddress?: string;
  addedAt: Date;
}

export interface DocumentContextType {
  documents: Document[];
  templates: Template[];
  contacts: Contact[];
  getDocument: (id: string) => Document | undefined;
  addDocument: (document: Omit<Document, 'id' | 'created_at' | 'status' | 'created_by'>) => Promise<string>;
  updateDocument: (id: string, document: Partial<Document>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  addSignature: (documentId: string, signerId: string, signatureDataUrl: string, signatureHash: string) => Promise<void>;
  verifyDocument: (id: string) => Promise<boolean>;
  addTemplate: (template: Omit<Template, 'id' | 'created_at'>) => string;
  updateTemplate: (id: string, template: Partial<Template>) => Promise<void>;
  deleteTemplate: (id: string) => void;
  getTemplate: (id: string) => Promise<Template | undefined>;
  addContact: (contact: Omit<Contact, 'id' | 'addedAt'>) => void;
  updateContact: (id: string, contact: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  getContact: (id: string) => Contact | undefined;
  sendInvitation: (email: string, message: string) => void;
  connectBlockchainWallet: () => Promise<void>;
  verifyDocumentOnChain: (documentId: string) => Promise<boolean>;
  isBlockchainConnected: boolean;
}

export const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export const useDocuments = () => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
};

// Mock initial data
const initialTemplates: Template[] = [
  {
    id: '1',
    title: 'Non-Disclosure Agreement',
    description: 'Standard NDA for business partnerships',
    content: `NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement (the "Agreement") is entered into by and between:

[PARTY A NAME], located at [PARTY A ADDRESS] ("Disclosing Party")

and

[PARTY B NAME], located at [PARTY B ADDRESS] ("Receiving Party")

1. PURPOSE
The parties wish to explore a potential business relationship. In connection with this opportunity, the Disclosing Party may share certain confidential and proprietary information with the Receiving Party.

2. CONFIDENTIAL INFORMATION
"Confidential Information" means any information disclosed by the Disclosing Party to the Receiving Party, either directly or indirectly, in writing, orally or by inspection of tangible objects, which is designated as "Confidential" or would reasonably be understood to be confidential given the nature of the information and the circumstances of disclosure.

3. OBLIGATIONS
The Receiving Party agrees to:
(a) Hold the Confidential Information in strict confidence;
(b) Not disclose such Confidential Information to any third party;
(c) Use the Confidential Information only for the purpose of evaluating the potential business relationship;
(d) Take reasonable measures to protect the confidentiality of the information.

4. TERM
This Agreement shall remain in effect for a period of [TERM] years from the date of execution.

Signed:

_________________________
[PARTY A NAME]
Date:

_________________________
[PARTY B NAME]
Date:`,
    category: 'nda',
    created_at: new Date('2023-01-15').toISOString(),
  },
  {
    id: '2',
    title: 'Consulting Agreement',
    description: 'Template for consulting services',
    content: `CONSULTING AGREEMENT

This Consulting Agreement (the "Agreement") is entered into by and between:

[CLIENT NAME], located at [CLIENT ADDRESS] ("Client")

and

[CONSULTANT NAME], located at [CONSULTANT ADDRESS] ("Consultant")

1. SERVICES
Consultant agrees to provide the following services to Client: [DESCRIPTION OF SERVICES]

2. COMPENSATION
Client agrees to pay Consultant at the rate of [RATE] for services rendered. Payment shall be made as follows: [PAYMENT TERMS]

3. TERM
This Agreement shall commence on [START DATE] and continue until [END DATE], unless terminated earlier as provided herein.

4. CONFIDENTIALITY
Consultant agrees to maintain the confidentiality of all proprietary information provided by Client.

5. INDEPENDENT CONTRACTOR
Consultant is an independent contractor and not an employee of Client.

Signed:

_________________________
[CLIENT NAME]
Date:

_________________________
[CONSULTANT NAME]
Date:`,
    category: 'contract',
    created_at: new Date('2023-02-20').toISOString(),
  },
];

const initialContacts: Contact[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    walletAddress: '8ZKG8qSJ1LnvfAvcKQQx2mLM9KMKwjmJQamKeLdpzvRM',
    addedAt: new Date('2023-03-10'),
  },
  {
    id: '2',
    name: 'Bob Williams',
    email: 'bob@example.com',
    addedAt: new Date('2023-03-15'),
  },
];

const initialDocuments: Document[] = [
  {
    id: '1',
    title: 'Service Agreement with Alice',
    description: 'Service agreement for project collaboration',
    content: 'This is a service agreement between our company and Alice Johnson...',
    created_at: new Date('2023-04-05').toISOString(),
    created_by: '1', // John Doe's ID
    status: 'pending',
    signers: [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        has_signed: true,
        signature_timestamp: new Date('2023-04-05').toISOString(),
        signature_hash: 'abcdef123456',
      },
      {
        id: '2',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        has_signed: false,
      },
    ],
    category: 'contract',
    blockchain_hash: '0x8a2d38f0eaa7b1f9d1e16f4f6cafe022a604f9e217a7e4a433df1939f59',
  },
  {
    id: '2',
    title: 'NDA with Bob',
    description: 'Non-disclosure agreement for new project',
    content: 'This Non-Disclosure Agreement is made between our company and Bob Williams...',
    created_at: new Date('2023-04-10').toISOString(),
    created_by: '1', // John Doe's ID
    status: 'draft',
    signers: [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        has_signed: false,
      },
      {
        id: '2',
        name: 'Bob Williams',
        email: 'bob@example.com',
        has_signed: false,
      },
    ],
    category: 'nda',
    template_id: '1', // Based on the NDA template
  },
];

type PostgresDocumentPayload = RealtimePostgresChangesPayload<{
  id: string;
  title: string;
  status: string;
  created_by: string;
  signers: Array<{
    email: string;
    name: string;
    has_signed: boolean;
  }>;
}>;

export const DocumentProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const { user } = useAuth();
  const [blockchainService] = useState(() => new BlockchainService());
  const [isBlockchainConnected, setIsBlockchainConnected] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data, error } = await supabase
          .from('templates')
          .select('*');

        if (error) {
          console.error('Error fetching templates:', error);
          // Initialize with empty templates if table doesn't exist
          setTemplates([]);
          return;
        }

        setTemplates(data || []);
      } catch (error) {
        console.error('Error fetching templates:', error);
        setTemplates([]);
      }
    };

    fetchTemplates();
  }, []);

  useEffect(() => {
    if (!user) {
      setDocuments([]);
      return;
    }

    const fetchData = async () => {
      try {
        console.log('Fetching documents for user:', user.id, 'email:', user.email);
        
        // First, get documents where user is the creator
        const { data: creatorDocs, error: creatorError } = await supabase
          .from('documents')
          .select('*')
          .eq('created_by', user.id);

        if (creatorError) {
          console.error('Error fetching creator documents:', creatorError);
          throw creatorError;
        }

        // Then, get documents where user is a signer
        const { data: signerDocs, error: signerError } = await supabase
          .from('documents')
          .select('*')
          .contains('signers', JSON.stringify([{ email: user.email }]));

        if (signerError) {
          console.error('Error fetching signer documents:', signerError);
          throw signerError;
        }

        // Combine and deduplicate documents
        const allDocs = [...(creatorDocs || []), ...(signerDocs || [])];
        const uniqueDocs = Array.from(new Map(allDocs.map(doc => [doc.id, doc])).values());
        
        // Sort by creation date
        const sortedDocs = uniqueDocs.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        console.log('Fetched documents:', sortedDocs);
        setDocuments(sortedDocs);
      } catch (error) {
        console.error('Error in fetchData:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch documents.',
          variant: 'destructive'
        });
      }
    };

    // Set up real-time subscription
    const subscription = supabase
      .channel('document-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents'
        },
        handleDocumentUpdate
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    // Initial fetch
    fetchData();

    // Cleanup subscription on unmount
    return () => {
      console.log('Cleaning up subscription');
      subscription.unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    const checkBlockchainConnection = async () => {
      try {
        const contractExists = await blockchainService.verifyContract();
        setIsBlockchainConnected(contractExists);
      } catch (error) {
        console.error('Error checking blockchain connection:', error);
        setIsBlockchainConnected(false);
      }
    };

    checkBlockchainConnection();
  }, [blockchainService]);

  const handleDocumentUpdate = async (payload: PostgresDocumentPayload) => {
    console.log('Received document update:', payload);

    // Type guard to ensure payload.new exists and has required properties
    if (!payload.new || !('id' in payload.new) || !user) return;

    try {
      // Fetch the latest document state to ensure we have the most up-to-date data
      const { data: updatedDoc, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', payload.new.id)
        .single();

      if (error) {
        console.error('Error fetching updated document:', error);
        return;
      }

      if (!updatedDoc) {
        console.log('No document found with id:', payload.new.id);
        return;
      }

      // Check if user is authorized to receive this update
      const isCreator = updatedDoc.created_by === user.id;
      const isSigner = updatedDoc.signers?.some(signer => signer.email === user.email);

      if (!isCreator && !isSigner) {
        console.log('User not authorized for this document update');
        return;
      }

      // Update local state based on the event type
      setDocuments(prevDocs => {
        const updatedDocs = [...prevDocs];

        switch (payload.eventType) {
          case 'INSERT': {
            toast({
              title: 'New Document',
              description: `Document "${updatedDoc.title}" has been added`,
            });
            return [updatedDoc, ...updatedDocs];
          }

          case 'UPDATE': {
            const oldDoc = updatedDocs.find(doc => doc.id === updatedDoc.id);
            if (oldDoc?.status !== updatedDoc.status) {
              toast({
                title: 'Document Updated',
                description: `Status changed to ${updatedDoc.status}`,
              });
            }
            return updatedDocs.map(doc => 
              doc.id === updatedDoc.id ? updatedDoc : doc
            );
          }

          case 'DELETE': {
            // Type guard for payload.old
            if (payload.old && 'id' in payload.old) {
              toast({
                title: 'Document Removed',
                description: 'Document has been removed',
              });
              return updatedDocs.filter(doc => doc.id !== payload.old?.id);
            }
            return updatedDocs;
          }

          default:
            return updatedDocs;
        }
      });
    } catch (error) {
      console.error('Error handling document update:', error);
      toast({
        title: 'Error',
        description: 'Failed to process document update',
        variant: 'destructive'
      });
    }
  };

  const sendEmailNotification = async (signerEmail: string, signerName: string, documentTitle: string, documentId: string) => {
    try {
      console.log('Preparing to send email to:', signerEmail);
      
      const documentUrl = `${window.location.origin}/documents/${documentId}`;
      console.log('Document URL:', documentUrl);

      const requestBody = {
        signerEmail,
        signerName,
        documentTitle,
        documentUrl
      };
      console.log('Sending email with request body:', requestBody);

      // Use the deployed Supabase function URL
      const functionUrl = 'https://bxgludnrxdubafwnalxa.supabase.co/functions/v1/send-signature-request';
      console.log('Using function URL:', functionUrl);

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Failed to send email: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Email sent successfully:', data);
    } catch (error) {
      console.error('Failed to send email notification:', error);
      // Don't throw the error, just log it
      // This way the document creation still succeeds even if email fails
    }
  };

  const addDocument = async (document: Omit<Document, 'id' | 'created_at' | 'status' | 'created_by'>) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "You must be logged in to create documents.",
      });
      throw new Error("User not authenticated");
    }

    try {
      console.log('Creating new document:', document);
      
      const newDocument = {
        title: document.title,
        description: document.description || '',
        content: document.content,
        created_by: user.id,
        status: 'draft',
        signers: document.signers || [],
        category: document.category
      };

      console.log('Inserting document into Supabase:', newDocument);

      const { data, error } = await supabase
        .from('documents')
        .insert(newDocument)
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating document:', error);
        toast({
          variant: "destructive",
          title: "Error creating document",
          description: `Failed to create document: ${error.message}`,
        });
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from document creation');
      }

      console.log('Document created successfully:', data);

      // Send email notifications to all signers
      if (document.signers && document.signers.length > 0) {
        for (const signer of document.signers) {
          await sendEmailNotification(
            signer.email,
            signer.name,
            document.title,
            data.id
          );
        }
      }

      setDocuments(prev => [...prev, data as Document]);
      
      toast({
        title: "Document created",
        description: `"${document.title}" has been created successfully.`,
      });
      
      return data.id;
    } catch (error) {
      console.error('Error creating document:', error);
      toast({
        variant: "destructive",
        title: "Error creating document",
        description: error.message,
      });
      throw error;
    }
  };

  const updateDocument = async (id: string, document: Partial<Document>) => {
    try {
      // If updating signers, ensure the data is properly formatted
      if (document.signers) {
        // Format signers as a JSONB array
        const formattedSigners = document.signers.map(signer => ({
          id: signer.id,
          name: signer.name,
          email: signer.email,
          has_signed: signer.has_signed || false,
          signature_timestamp: signer.signature_timestamp || null,
          signature_hash: signer.signature_hash || null
        }));
        document.signers = formattedSigners;
      }

      console.log('Updating document:', { id, document });

      const { error } = await supabase
        .from('documents')
        .update(document)
        .eq('id', id);

      if (error) {
        console.error('Error updating document:', error);
        throw error;
      }

      setDocuments(prev => {
        const updatedDocs = prev.map(doc => {
          if (doc.id === id) {
            const updatedDoc = { ...doc, ...document };
            
            // If signers were updated, send notifications
            if (document.signers) {
              const newSigners = document.signers.filter(
                newSigner => !doc.signers.some(
                  existingSigner => existingSigner.email === newSigner.email
                )
              );
              
              // Send email to new signers
              newSigners.forEach(async (signer) => {
                try {
                  console.log('Preparing to send email to:', signer.email);
                  
                  const documentUrl = `${window.location.origin}/documents/${id}`;
                  console.log('Document URL:', documentUrl);
                  
                  const { data: { session } } = await supabase.auth.getSession();
                  if (!session?.access_token) {
                    throw new Error('No active session');
                  }

                  const requestBody = {
                    recipientEmail: signer.email,
                    recipientName: signer.name,
                    documentId: id,
                    documentTitle: updatedDoc.title,
                    documentUrl: documentUrl,
                    requesterName: user?.user_metadata?.name || user?.email || 'A user'
                  };
                  
                  console.log('Sending email with request body:', requestBody);

                  // Use the deployed Supabase function URL
                  const functionUrl = 'https://bxgludnrxdubafwnalxa.supabase.co/functions/v1/send-signature-request';

                  console.log('Using function URL:', functionUrl);

                  const response = await fetch(functionUrl, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify(requestBody)
                  });

                  let responseText;
                  try {
                    responseText = await response.text();
                    console.log('Raw response:', responseText);
                    
                    const responseData = JSON.parse(responseText);
                    
                    if (!response.ok) {
                      console.error('Email sending failed:', { 
                        status: response.status, 
                        data: responseData,
                        headers: Object.fromEntries(response.headers.entries())
                      });
                      throw new Error(responseData.error || `Failed to send email: ${response.statusText}`);
                    }

                    console.log('Email sent successfully:', responseData);
                    
                    toast({
                      title: "Notification sent",
                      description: `Signature request sent to ${signer.email}`,
                    });
                  } catch (parseError) {
                    console.error('Error parsing response:', {
                      responseText,
                      parseError,
                      status: response.status,
                      headers: Object.fromEntries(response.headers.entries())
                    });
                    throw new Error(`Failed to parse response: ${responseText}`);
                  }
                } catch (error) {
                  console.error('Failed to send email notification:', error);
                  toast({
                    variant: "destructive",
                    title: "Notification error",
                    description: `Could not send email to ${signer.email}. Please ensure the email service is properly configured.`,
                  });
                }
              });
            }
            
            return updatedDoc;
          }
          return doc;
        });
        
        return updatedDocs;
      });
      
      toast({
        title: "Document updated",
        description: "Your changes have been saved.",
      });
    } catch (error) {
      console.error('Document update error:', error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: `Failed to update document: ${error.message}`,
      });
      throw error;
    }
  };

  const deleteDocument = async (id: string) => {
    if (!user) {
      console.log('No user logged in, cannot delete document');
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to delete documents.",
      });
      return;
    }

    try {
      console.log('Deleting document:', id);
      
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting document:', error);
        toast({
          variant: "destructive",
          title: "Error deleting document",
          description: error.message,
        });
        throw error;
      }

      console.log('Document deleted successfully');
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      toast({
        title: "Document deleted",
        description: "The document has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error in deleteDocument:', error);
      toast({
        variant: "destructive",
        title: "Error deleting document",
        description: "Failed to delete the document. Please try again.",
      });
    }
  };

  const getDocument = (id: string) => {
    return documents.find(doc => doc.id === id);
  };

  const connectBlockchainWallet = async () => {
    try {
      await blockchainService.connectWallet();
      const contractExists = await blockchainService.verifyContract();
      setIsBlockchainConnected(contractExists);
      
      if (!contractExists) {
        throw new Error('Contract not found at the specified address. Please check your environment variables.');
      }

      toast({
        title: "Wallet Connected",
        description: "Successfully connected to blockchain",
      });
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setIsBlockchainConnected(false);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
        variant: "destructive",
      });
    }
  };

  const addSignature = async (documentId: string, signerId: string, signatureDataUrl: string, signatureHash: string) => {
    try {
      console.log('Starting unified signature process for document:', documentId);
      
      // First, fetch the current document state
      const { data: currentDoc, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (fetchError) {
        console.error('Error fetching document:', fetchError);
        throw new Error(`Document not found: ${fetchError.message}`);
      }

      if (!currentDoc) {
        throw new Error('Document not found in database');
      }

      // Verify the signer exists and hasn't signed yet
      const signer = currentDoc.signers.find(s => s.id === signerId);
      if (!signer) {
        throw new Error('Signer not found in document');
      }

      if (signer.has_signed) {
        throw new Error('Signer has already signed this document');
      }

      // Update the signer's information with both visual and blockchain signatures
      const updatedSigners = currentDoc.signers.map(s => {
        if (s.id === signerId) {
          return {
            ...s,
            has_signed: true,
            signature_timestamp: new Date().toISOString(),
            signature_hash: signatureHash,
            signature_data_url: signatureDataUrl
          };
        }
        return s;
      });

      // Check if all signers have signed
      const allSigned = updatedSigners.every(s => s.has_signed);
      const newStatus = allSigned ? 'completed' : 'pending';

      // For blockchain storage, we'll use the last signer's signature hash
      // This represents the final state of the document with all signatures
      if (allSigned && isBlockchainConnected) {
        console.log('All signers have signed, storing final document state on blockchain');
        try {
          // Store the final document state on blockchain
          const success = await blockchainService.storeDocument(
            documentId,
            signatureHash // Using the last signature hash as the final document state
          );
          
          if (!success) {
            throw new Error('Failed to store document hash on blockchain');
          }
          console.log('Successfully stored document on blockchain');
        } catch (error) {
          console.error('Blockchain storage error:', error);
          toast({
            title: "Blockchain Storage Failed",
            description: error instanceof Error ? error.message : "Failed to store document on blockchain",
            variant: "destructive",
          });
          // We'll continue with the process even if blockchain storage fails
          // The document is still valid with the signatures
        }
      }

      // Update document with new signer information and blockchain hash
      const updateData = {
        signers: updatedSigners,
        status: newStatus,
        blockchain_hash: signatureHash, // Store the latest signature hash
        is_authentic: true,
        last_verified_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('documents')
        .update(updateData)
        .eq('id', documentId);

      if (updateError) {
        console.error('Error updating document:', updateError);
        throw updateError;
      }

      // Fetch the updated document to ensure we have the latest state
      const { data: updatedDoc, error: refetchError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (refetchError || !updatedDoc) {
        console.error('Error fetching updated document:', refetchError);
        throw new Error('Failed to fetch updated document');
      }

      // Update local state
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId ? updatedDoc : doc
      ));

      // If all signers have signed, notify the document creator
      if (allSigned) {
        const creatorSigner = updatedDoc.signers.find(s => s.id === updatedDoc.created_by);
        if (creatorSigner) {
          await sendEmailNotification(
            creatorSigner.email,
            creatorSigner.name,
            updatedDoc.title,
            documentId
          );
        }
      }

      toast({
        title: "Signature Added",
        description: "Your signature has been securely added to the document and verified on the blockchain.",
      });
    } catch (error) {
      console.error('Error adding signature:', error);
      toast({
        title: "Signature Failed",
        description: error instanceof Error ? error.message : "Failed to add signature",
        variant: "destructive",
      });
      throw error;
    }
  };

  const verifyDocument = async (documentId: string) => {
    try {
      console.log('Starting document verification:', documentId);
      
      // Fetch the current document state
      const { data: document, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (fetchError) {
        console.error('Error fetching document:', fetchError);
        throw new Error(`Document not found: ${fetchError.message}`);
      }

      if (!document) {
        throw new Error('Document not found in database');
      }

      // Check if document has been signed
      if (!document.blockchain_hash) {
        toast({
          title: "Verification Failed",
          description: "Document has not been signed yet and cannot be verified.",
          variant: "destructive"
        });
        return;
      }

      // Call the verify_document Supabase function
      const { data: verificationResult, error: verifyError } = await supabase
        .rpc('verify_document', { doc_id: documentId });

      if (verifyError) {
        console.error('Error verifying document:', verifyError);
        throw verifyError;
      }

      // Update local state with verification result
      setDocuments(prev => prev.map(doc => {
        if (doc.id === documentId) {
          return {
            ...doc,
            is_authentic: verificationResult,
            last_verified_at: new Date().toISOString()
          };
        }
        return doc;
      }));

      // Show appropriate toast message based on verification result
      toast({
        title: verificationResult ? "Document Verified" : "Verification Failed",
        description: verificationResult 
          ? "The document is authentic and has not been tampered with."
          : "The document may have been modified since it was signed.",
        variant: verificationResult ? "default" : "destructive"
      });

      return verificationResult;
    } catch (error) {
      console.error('Error during document verification:', error);
      toast({
        variant: "destructive",
        title: "Verification Error",
        description: error instanceof Error ? error.message : "Failed to verify document",
      });
      throw error;
    }
  };

  const verifyDocumentOnChain = async (documentId: string) => {
    try {
      const { data: document } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (!document) {
        throw new Error('Document not found');
      }

      // Get the latest signature
      const latestSigner = document.signers.find((signer: Signer) => signer.signature_data_url);
      if (!latestSigner) {
        throw new Error('No signatures found for this document');
      }

      const isValid = await blockchainService.verifyDocument(
        documentId,
        latestSigner.signature_hash
      );

      toast({
        title: isValid ? "Document Verified" : "Verification Failed",
        description: isValid 
          ? "Document signature matches blockchain record" 
          : "Document signature does not match blockchain record",
        variant: isValid ? "default" : "destructive",
      });

      return isValid;
    } catch (error) {
      console.error('Error verifying document:', error);
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Failed to verify document",
        variant: "destructive",
      });
      return false;
    }
  };

  const addTemplate = (template: Omit<Template, 'id' | 'created_at'>) => {
    const id = uuidv4();
    const newTemplate: Template = {
      ...template,
      id,
      created_at: new Date().toISOString(),
    };

    setTemplates(prev => [...prev, newTemplate]);
    
    toast({
      title: "Template created",
      description: `"${template.title}" has been created successfully.`,
    });
    
    return id;
  };

  const updateTemplate = async (id: string, template: Partial<Template>) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "You must be logged in to edit templates.",
      });
      return;
    }

    try {
      // First, check if the user has any existing modifications for this template
      const { data: existingModification } = await supabase
        .from('user_template_modifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('template_id', id)
        .single();

      if (existingModification) {
        // Update existing modification
        const { error } = await supabase
          .from('user_template_modifications')
          .update({
            ...template,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingModification.id);

        if (error) throw error;
      } else {
        // Create new modification
        const { error } = await supabase
          .from('user_template_modifications')
          .insert({
            user_id: user.id,
            template_id: id,
            ...template
          });

        if (error) throw error;
      }

      // Update local state with the modified template
      setTemplates(prev => prev.map(temp => 
        temp.id === id ? { ...temp, ...template } : temp
      ));
      
      toast({
        title: "Template updated",
        description: "Your changes have been saved.",
      });
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update template"
      } as ToastProps);
      throw error;
    }
  };

  const deleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(temp => temp.id !== id));
    
    toast({
      title: "Template deleted",
      description: "The template has been removed.",
    });
  };

  const getTemplate = async (id: string): Promise<Template | undefined> => {
    // First get the base template
    const baseTemplate = templates.find(temp => temp.id === id);
    if (!baseTemplate || !user) return baseTemplate;

    try {
      // Check if the user has any modifications for this template
      const { data: modification, error } = await supabase
        .from('user_template_modifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('template_id', id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching template modification:', error);
        throw error;
      }

      // If there's a modification, merge it with the base template
      if (modification) {
        return {
          ...baseTemplate,
          title: modification.title || baseTemplate.title,
          description: modification.description || baseTemplate.description,
          content: modification.content || baseTemplate.content,
          category: modification.category || baseTemplate.category
        };
      }

      return baseTemplate;
    } catch (error) {
      console.error('Error fetching template:', error);
      return baseTemplate;
    }
  };

  const addContact = (contact: Omit<Contact, 'id' | 'addedAt'>) => {
    // Check if contact already exists
    const existingContact = contacts.find(c => c.email === contact.email);
    if (existingContact) {
      toast({
        variant: "destructive",
        title: "Contact already exists",
        description: `${contact.email} is already in your contacts.`,
      });
      return;
    }
    
    const newContact: Contact = {
      ...contact,
      id: uuidv4(),
      addedAt: new Date(),
    };

    setContacts(prev => [...prev, newContact]);
    
    toast({
      title: "Contact added",
      description: `${contact.name} has been added to your contacts.`,
    });
  };

  const updateContact = (id: string, contact: Partial<Contact>) => {
    setContacts(prev => prev.map(c => 
      c.id === id ? { ...c, ...contact } : c
    ));
    
    toast({
      title: "Contact updated",
      description: "Contact information has been updated.",
    });
  };

  const deleteContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
    
    toast({
      title: "Contact removed",
      description: "The contact has been removed from your list.",
    });
  };

  const getContact = (id: string) => {
    return contacts.find(c => c.id === id);
  };

  const sendInvitation = (email: string, message: string) => {
    // In a real app, this would send an email invitation
    console.log(`Sending invitation to ${email}: ${message}`);
    
    toast({
      title: "Invitation sent",
      description: `An invitation has been sent to ${email}.`,
    });
  };

  return (
    <DocumentContext.Provider
      value={{
        documents,
        templates,
        contacts,
        addDocument,
        updateDocument,
        deleteDocument,
        getDocument,
        addSignature,
        verifyDocument,
        addTemplate,
        updateTemplate,
        deleteTemplate,
        getTemplate,
        addContact,
        updateContact,
        deleteContact,
        getContact,
        sendInvitation,
        connectBlockchainWallet,
        verifyDocumentOnChain,
        isBlockchainConnected,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
};
