import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from './AuthContext';

export interface Signer {
  id: string;
  name: string;
  email: string;
  hasSigned: boolean;
  signatureTimestamp?: Date;
  signatureHash?: string;
}

export interface Document {
  id: string;
  title: string;
  description: string;
  content: string;
  createdAt: Date;
  createdBy: string;
  status: 'draft' | 'pending' | 'completed' | 'rejected';
  signers: Signer[];
  signatures: {
    [userId: string]: string;  // Base64 encoded signature image
  };
  fileUrl?: string;
  blockchainHash?: string;
  isAuthentic?: boolean;
  templateId?: string;
  category: 'contract' | 'nda' | 'agreement' | 'other';
}

export interface Template {
  id: string;
  title: string;
  description: string;
  content: string;
  category: 'contract' | 'nda' | 'agreement' | 'other';
  createdAt: Date;
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
  addDocument: (document: Omit<Document, 'id' | 'createdAt' | 'status' | 'createdBy' | 'signatures'>) => string;
  updateDocument: (id: string, document: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
  getDocument: (id: string) => Document | undefined;
  addSignature: (documentId: string, userId: string, signatureDataUrl: string) => void;
  verifyDocument: (documentId: string) => boolean;
  addTemplate: (template: Omit<Template, 'id' | 'createdAt'>) => string;
  updateTemplate: (id: string, template: Partial<Template>) => void;
  deleteTemplate: (id: string) => void;
  getTemplate: (id: string) => Template | undefined;
  addContact: (contact: Omit<Contact, 'id' | 'addedAt'>) => void;
  updateContact: (id: string, contact: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  getContact: (id: string) => Contact | undefined;
  sendInvitation: (email: string, message: string) => void;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

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
    createdAt: new Date('2023-01-15'),
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
    createdAt: new Date('2023-02-20'),
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
    createdAt: new Date('2023-04-05'),
    createdBy: '1', // John Doe's ID
    status: 'pending',
    signers: [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        hasSigned: true,
        signatureTimestamp: new Date('2023-04-05'),
        signatureHash: 'abcdef123456',
      },
      {
        id: '2',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        hasSigned: false,
      },
    ],
    signatures: {
      '1': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEU...',
    },
    category: 'contract',
    blockchainHash: '0x8a2d38f0eaa7b1f9d1e16f4f6cafe022a604f9e217a7e4a433df1939f59',
  },
  {
    id: '2',
    title: 'NDA with Bob',
    description: 'Non-disclosure agreement for new project',
    content: 'This Non-Disclosure Agreement is made between our company and Bob Williams...',
    createdAt: new Date('2023-04-10'),
    createdBy: '1', // John Doe's ID
    status: 'draft',
    signers: [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        hasSigned: false,
      },
      {
        id: '2',
        name: 'Bob Williams',
        email: 'bob@example.com',
        hasSigned: false,
      },
    ],
    signatures: {},
    category: 'nda',
    templateId: '1', // Based on the NDA template
  },
];

export const DocumentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    // Load from localStorage or use mock data on first load
    const savedDocuments = localStorage.getItem('documents');
    const savedTemplates = localStorage.getItem('templates');
    const savedContacts = localStorage.getItem('contacts');

    setDocuments(savedDocuments ? JSON.parse(savedDocuments) : initialDocuments);
    setTemplates(savedTemplates ? JSON.parse(savedTemplates) : initialTemplates);
    setContacts(savedContacts ? JSON.parse(savedContacts) : initialContacts);
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('documents', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('templates', JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem('contacts', JSON.stringify(contacts));
  }, [contacts]);

  const addDocument = (document: Omit<Document, 'id' | 'createdAt' | 'status' | 'createdBy' | 'signatures'>) => {
    const id = uuidv4();
    const newDocument: Document = {
      ...document,
      id,
      createdAt: new Date(),
      status: 'draft',
      createdBy: user?.id || 'unknown',
      signatures: {},
    };

    setDocuments(prev => [...prev, newDocument]);
    
    toast({
      title: "Document created",
      description: `"${document.title}" has been created successfully.`,
    });
    
    return id;
  };

  const updateDocument = (id: string, document: Partial<Document>) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === id ? { ...doc, ...document } : doc
    ));
    
    toast({
      title: "Document updated",
      description: "Your changes have been saved.",
    });
  };

  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    
    toast({
      title: "Document deleted",
      description: "The document has been removed.",
    });
  };

  const getDocument = (id: string) => {
    return documents.find(doc => doc.id === id);
  };

  const addSignature = (documentId: string, userId: string, signatureDataUrl: string) => {
    setDocuments(prev => prev.map(doc => {
      if (doc.id === documentId) {
        // Update the signatures object
        const updatedSignatures = { ...doc.signatures, [userId]: signatureDataUrl };
        
        // Update the signers array
        const updatedSigners = doc.signers.map(signer => 
          signer.id === userId 
            ? { 
                ...signer, 
                hasSigned: true, 
                signatureTimestamp: new Date(),
                signatureHash: `sign_${Math.random().toString(36).substr(2, 9)}` // Mock hash
              } 
            : signer
        );
        
        // Check if all signers have signed
        const allSigned = updatedSigners.every(signer => signer.hasSigned);
        
        // Generate a mock blockchain hash if all have signed
        const blockchainHash = allSigned 
          ? `0x${Math.random().toString(36).substr(2, 64)}`
          : doc.blockchainHash;
        
        return { 
          ...doc, 
          signatures: updatedSignatures, 
          signers: updatedSigners,
          status: allSigned ? 'completed' : 'pending',
          blockchainHash,
          isAuthentic: allSigned ? true : undefined
        };
      }
      return doc;
    }));
    
    toast({
      title: "Document signed",
      description: "Your signature has been added and recorded on the blockchain.",
    });
  };

  const verifyDocument = (documentId: string) => {
    const document = getDocument(documentId);
    
    // In a real app, this would verify with the blockchain
    // For now, we'll just check if it has a blockchain hash
    const isVerified = !!document?.blockchainHash;
    
    toast({
      title: isVerified ? "Document verified" : "Verification failed",
      description: isVerified 
        ? "This document is authentic and has not been tampered with." 
        : "Could not verify the authenticity of this document.",
      variant: isVerified ? "default" : "destructive",
    });
    
    return isVerified;
  };

  const addTemplate = (template: Omit<Template, 'id' | 'createdAt'>) => {
    const id = uuidv4();
    const newTemplate: Template = {
      ...template,
      id,
      createdAt: new Date(),
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
