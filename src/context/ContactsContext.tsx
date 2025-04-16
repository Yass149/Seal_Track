import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

interface Contact {
  id: string;
  user_id: string;
  contact_id?: string | null;
  name: string;
  email: string;
  wallet_address?: string | null;
  created_at: string;
  last_message_at?: string | null;
}

interface ContactRequest {
  id: string;
  sender_id: string;
  recipient_email: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  sender_name: string;
}

interface ContactsContextType {
  contacts: Contact[];
  sentRequests: ContactRequest[];
  receivedRequests: ContactRequest[];
  addContact: (contact: { name: string; email: string; wallet_address?: string }) => Promise<void>;
  updateContact: (id: string, contact: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  getContact: (id: string) => Contact | undefined;
  acceptRequest: (requestId: string) => Promise<void>;
  rejectRequest: (requestId: string) => Promise<void>;
}

const ContactsContext = createContext<ContactsContextType | undefined>(undefined);

export function ContactsProvider({ children }: { children: React.ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [sentRequests, setSentRequests] = useState<ContactRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<ContactRequest[]>([]);
  const { user } = useAuth();

  const fetchData = async () => {
    if (!user) return;

    // Fetch contacts
    const { data: contactsData, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (contactsError) {
      console.error('Error fetching contacts:', contactsError);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch contacts"
      });
      return;
    }

    // Fetch sent requests
    const { data: sentData, error: sentError } = await supabase
      .from('contact_requests')
      .select('*')
      .eq('sender_id', user.id)
      .order('created_at', { ascending: false });

    if (sentError) {
      console.error('Error fetching sent requests:', sentError);
    }

    // Fetch received requests
    const { data: receivedData, error: receivedError } = await supabase
      .from('contact_requests')
      .select('*')
      .eq('recipient_email', user.email)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (receivedError) {
      console.error('Error fetching received requests:', receivedError);
    }

    // Type assertions to fix TypeScript errors
    setContacts((contactsData as Contact[]) || []);
    setSentRequests((sentData as ContactRequest[]) || []);
    setReceivedRequests((receivedData as ContactRequest[]) || []);
  };

  useEffect(() => {
    if (!user) return;

    fetchData();

    // Subscribe to changes
    const contactsSubscription = supabase
      .channel('contacts-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'contacts',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchData();
      })
      .subscribe();

    const requestsSubscription = supabase
      .channel('requests-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'contact_requests',
        filter: `recipient_email=eq.${user.email}`
      }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      contactsSubscription.unsubscribe();
      requestsSubscription.unsubscribe();
    };
  }, [user]);

  const createContactRequest = async (recipientEmail: string) => {
    try {
      const { data, error } = await supabase
        .rpc('create_contact_request', { recipient_email: recipientEmail });

      if (error) {
        console.error('Error creating contact request:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating contact request:', error);
      throw error;
    }
  };

  const addContact = async (contact: { name: string; email: string; wallet_address?: string }) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to add contacts"
      });
      return;
    }

    try {
      // Call the create_contact_request function
      const { data, error } = await supabase
        .rpc('create_contact_request', {
          recipient_email: contact.email
        });

      if (error) {
        console.error('Error creating contact request:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to send contact request"
        });
        return;
      }

      toast({
        title: "Request sent",
        description: `Contact request sent to ${contact.email}`
      });

      // Refresh the data
      fetchData();
    } catch (error) {
      console.error('Unexpected error adding contact:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred"
      });
    }
  };

  const acceptRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('contact_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId)
        .eq('recipient_email', user?.email);

      if (error) {
        console.error('Error accepting request:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to accept contact request"
        });
        return;
      }

      toast({
        title: "Request accepted",
        description: "Contact request accepted successfully"
      });

      // Refresh the data
      fetchData();
    } catch (error) {
      console.error('Unexpected error accepting request:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred"
      });
    }
  };

  const rejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('contact_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId)
        .eq('recipient_email', user?.email);

      if (error) {
        console.error('Error rejecting request:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to reject contact request"
        });
        return;
      }

      toast({
        title: "Request rejected",
        description: "Contact request rejected successfully"
      });

      // Refresh the data
      fetchData();
    } catch (error) {
      console.error('Unexpected error rejecting request:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred"
      });
    }
  };

  const updateContact = async (id: string, contact: Partial<Contact>) => {
    if (!user) return;

    const { error } = await supabase
      .from('contacts')
      .update(contact)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating contact:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update contact"
      });
      return;
    }

    toast({
      title: "Contact updated",
      description: "Contact information has been updated."
    });

    // Refresh the data
    fetchData();
  };

  const deleteContact = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting contact:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete contact"
      });
      return;
    }

    toast({
      title: "Contact removed",
      description: "The contact has been removed from your list."
    });

    // Refresh the data
    fetchData();
  };

  const getContact = (id: string) => {
    return contacts.find(c => c.id === id);
  };

  return (
    <ContactsContext.Provider value={{
      contacts,
      sentRequests,
      receivedRequests,
      addContact,
      updateContact,
      deleteContact,
      getContact,
      acceptRequest,
      rejectRequest
    }}>
      {children}
    </ContactsContext.Provider>
  );
}

export const useContacts = () => {
  const context = useContext(ContactsContext);
  if (context === undefined) {
    throw new Error('useContacts must be used within a ContactsProvider');
  }
  return context;
}; 