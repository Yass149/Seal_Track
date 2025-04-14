import React, { createContext, useContext, useState, useEffect, type FC, type ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/components/ui/use-toast';
import { type ToastProps } from '@/components/ui/toast';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export interface Document {
  id: string;
  title: string;
  description?: string;
  content: string;
  created_at: string;
  created_by: string;
  status: 'draft' | 'pending' | 'completed';
  signers: Array<{
    id: string;
    name: string;
    email: string;
    has_signed: boolean;
    signature_timestamp?: string;
    signature_hash?: string;
    signature_data_url?: string;
  }>;
  category: string;
  template_id?: string;
  blockchain_hash?: string;
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

interface DocumentContextType {
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
  updateTemplate: (id: string, template: Partial<Template>) => void;
  deleteTemplate: (id: string) => void;
  getTemplate: (id: string) => Template | undefined;
  addContact: (contact: Omit<Contact, 'id' | 'addedAt'>) => void;
  updateContact: (id: string, contact: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  getContact: (id: string) => Contact | undefined;
  sendInvitation: (email: string, message: string) => void;
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

export const DocumentProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const { user } = useAuth();

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
    const fetchDocuments = async () => {
      if (!user) {
        console.log('No user logged in, skipping document fetch');
        setDocuments([]);
        return;
      }

      try {
        console.log('Fetching documents for user:', user.id);
        
        // Get all documents where user is either creator or signer
        const { data: userDocs, error } = await supabase
          .from('documents')
          .select('*')
          .or(`created_by.eq.${user.id},signers.cs.[{"email":"${user.email}"}]`);

        if (error) {
          console.error('Error fetching documents:', error);
          throw error;
        }

        if (!userDocs) {
          console.log('No documents found for user');
          setDocuments([]);
          return;
        }

        // Sort by creation date
        const sortedDocs = userDocs.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        console.log('Fetched documents:', sortedDocs);
        setDocuments(sortedDocs);
      } catch (error) {
        console.error('Error in fetchDocuments:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch documents"
        } as ToastProps);
      }
    };

    fetchDocuments();

    // Set up real-time subscription for document updates
    const subscription = supabase
      .channel('documents')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents'
        },
        async (payload: RealtimePostgresChangesPayload<Document>) => {
          console.log('Received document update:', payload);
          
          if (!payload.new || typeof payload.new !== 'object' || !('id' in payload.new)) {
            console.error('Invalid payload format');
            return;
          }

          // Always fetch the latest document state from the database
          const { data: latestDoc, error } = await supabase
            .from('documents')
            .select('*')
            .eq('id', payload.new.id)
            .single();

          if (error) {
            console.error('Error fetching updated document:', error);
            return;
          }

          if (!latestDoc) {
            console.error('No document found after update');
            return;
          }

          // Check if the user is either the creator or a signer
          const isCreator = latestDoc.created_by === user?.id;
          const isSigner = latestDoc.signers.some(s => s.email === user?.email);

          if (!isCreator && !isSigner) {
            return; // Skip if user is not involved with this document
          }

          // Handle different types of updates
          switch (payload.eventType) {
            case 'INSERT':
              setDocuments(prev => [...prev, latestDoc]);
              toast({
                title: "Success",
                description: "New document added",
                variant: "default"
              } as ToastProps);
              break;
            
            case 'UPDATE':
              setDocuments(prev => 
                prev.map(doc => 
                  doc.id === latestDoc.id 
                    ? latestDoc
                    : doc
                )
              );
              toast({
                title: "Success",
                description: "Document has been completed",
                variant: "default"
              } as ToastProps);
              break;
            
            case 'DELETE':
              setDocuments(prev => 
                prev.filter(doc => doc.id !== payload.old.id)
              );
              toast({
                title: "Info",
                description: "Document has been deleted",
                variant: "default"
              } as ToastProps);
              break;
          }

          // Show appropriate notifications
          if (payload.eventType === 'UPDATE') {
            if (latestDoc.status === 'completed') {
              toast({
                title: "Document Completed",
                description: "All signers have signed the document.",
              });
            } else if (latestDoc.status === 'pending') {
              const signedCount = latestDoc.signers.filter(s => s.has_signed).length;
              const totalSigners = latestDoc.signers.length;
              toast({
                title: "Document Updated",
                description: `${signedCount} of ${totalSigners} signers have signed.`,
              });
            }
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

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

  const addSignature = async (documentId: string, signerId: string, signatureDataUrl: string, signatureHash: string) => {
    try {
      console.log('Starting signature process for document:', documentId);
      
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

      // Update the signer's information
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

      // Update the document in the database
      const { data: updatedDoc, error: updateError } = await supabase
        .from('documents')
        .update({
          signers: updatedSigners,
          status: newStatus
        })
        .eq('id', documentId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating document:', updateError);
        throw new Error(`Failed to update document: ${updateError.message}`);
      }

      if (!updatedDoc) {
        throw new Error('No data returned from document update');
      }

      // Send notification to document creator if all signers have signed
      if (allSigned && currentDoc.created_by !== user?.id) {
        const { data: creatorData } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', currentDoc.created_by)
          .single();

        if (creatorData?.email) {
          await sendEmailNotification(
            creatorData.email,
            'Document Creator',
            currentDoc.title,
            documentId
          );
        }
      }

      // Send notifications to other signers
      const otherSigners = updatedSigners.filter(s => !s.has_signed);
      for (const signer of otherSigners) {
        await sendEmailNotification(
          signer.email,
          signer.name,
          currentDoc.title,
          documentId
        );
      }

      toast({
        title: "Signature added",
        description: "Your signature has been added to the document.",
      });
    } catch (error) {
      console.error('Error adding signature:', error);
      toast({
        title: "Error",
        description: "Failed to add signature",
        variant: "destructive"
      } as ToastProps);
      throw error;
    }
  };

  const verifyDocument = async (id: string) => {
    const document = await getDocument(id);
    
    // In a real app, this would verify with the blockchain
    // For now, we'll just check if it has a blockchain hash
    const isVerified = !!document?.blockchain_hash;
    
    toast({
      title: isVerified ? "Document verified" : "Verification failed",
      description: isVerified 
        ? "This document is authentic and has not been tampered with." 
        : "Could not verify the authenticity of this document.",
      variant: isVerified ? "default" : "destructive",
    });
    
    return isVerified;
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

  const updateTemplate = (id: string, template: Partial<Template>) => {
    setTemplates(prev => prev.map(temp => 
      temp.id === id ? { ...temp, ...template } : temp
    ));
    
    toast({
      title: "Template updated",
      description: "Your changes have been saved.",
    });
  };

  const deleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(temp => temp.id !== id));
    
    toast({
      title: "Template deleted",
      description: "The template has been removed.",
    });
  };

  const getTemplate = (id: string) => {
    return templates.find(temp => temp.id === id);
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
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
};
