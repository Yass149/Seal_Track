import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { sendInvitationEmail } from '@/lib/email';

interface Contact {
  id: string;
  user_id: string;
  contact_id: string;
  name: string;
  email: string;
  walletAddress?: string;
  created_at: string;
  last_message_at?: string;
}

interface ContactsContextType {
  contacts: Contact[];
  addContact: (email: string) => Promise<void>;
  inviteContact: (email: string) => Promise<void>;
  updateContact: (id: string, data: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
}

const ContactsContext = createContext<ContactsContextType | undefined>(undefined);

export function ContactsProvider({ children }: { children: React.ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchContacts = async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .or(`user_id.eq.${user.id},contact_id.eq.${user.id}`)
        .order('name');

      if (error) {
        console.error('Error fetching contacts:', error);
        return;
      }

      // Transform the data to ensure it matches Contact interface
      const typedContacts = (data || []).map(contact => ({
        id: contact.id,
        user_id: contact.user_id,
        contact_id: contact.contact_id,
        name: contact.name,
        email: contact.email,
        walletAddress: contact.walletAddress,
        created_at: contact.created_at,
        last_message_at: contact.last_message_at
      })) as Contact[];

      setContacts(typedContacts);
    };

    fetchContacts();

    // Subscribe to ALL contact changes that involve the current user
    const subscription = supabase
      .channel('contacts-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'contacts',
        filter: `or(user_id.eq.${user.id},contact_id.eq.${user.id})` 
      }, (payload) => {
        console.log('Contact change received:', payload);
        if (payload.eventType === 'INSERT') {
          const newContact = {
            id: payload.new.id,
            user_id: payload.new.user_id,
            contact_id: payload.new.contact_id,
            name: payload.new.name,
            email: payload.new.email,
            walletAddress: payload.new.walletAddress,
            created_at: payload.new.created_at,
            last_message_at: payload.new.last_message_at
          } as Contact;
          setContacts(prev => [...prev, newContact]);
        } else if (payload.eventType === 'UPDATE') {
          setContacts(prev => prev.map(contact => 
            contact.id === payload.new.id ? { ...contact, ...payload.new as Contact } : contact
          ));
        } else if (payload.eventType === 'DELETE') {
          setContacts(prev => prev.filter(contact => contact.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const addContact = async (email: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add contacts",
        variant: "destructive"
      });
      return;
    }

    // Get existing user with proper type casting
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, user_metadata')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      toast({
        title: "Error",
        description: "User not found. Please invite them to join.",
        variant: "destructive"
      });
      return;
    }

    const existingUser = {
      id: userData.id as string,
      email: userData.email as string,
      user_metadata: userData.user_metadata as { full_name?: string }
    };

    // Check if contact already exists
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('*')
      .or(`and(user_id.eq.${user.id},contact_id.eq.${existingUser.id}),and(user_id.eq.${existingUser.id},contact_id.eq.${user.id})`)
      .single();

    if (existingContact) {
      toast({
        title: "Error",
        description: "This contact already exists",
        variant: "destructive"
      });
      return;
    }

    // Create bidirectional contact relationship
    const [{ error: error1 }, { error: error2 }] = await Promise.all([
      supabase.from('contacts').insert({
        user_id: user.id,
        contact_id: existingUser.id,
        name: existingUser.user_metadata?.full_name || email.split('@')[0],
        email: existingUser.email
      }),
      supabase.from('contacts').insert({
        user_id: existingUser.id,
        contact_id: user.id,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown',
        email: user.email
      })
    ]);

    if (error1 || error2) {
      console.error('Error adding contact:', { error1, error2 });
      toast({
        title: "Error",
        description: "Failed to add contact",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: "Contact added successfully"
    });
  };

  const inviteContact = async (email: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to invite contacts",
        variant: "destructive"
      });
      return;
    }

    try {
      // Generate invitation link
      const invitationLink = `${window.location.origin}/signup?invited_by=${user.id}`;
      
      // Send invitation email using the same system as document notifications
      const { error: emailError } = await supabase
        .from('email_notifications')
        .insert({
          recipient_email: email,
          subject: `${user.user_metadata?.full_name || user.email?.split('@')[0]} invited you to join DocuChain`,
          content: `
            <h1>You've been invited to join DocuChain!</h1>
            <p>${user.user_metadata?.full_name || user.email?.split('@')[0]} has invited you to join DocuChain, a secure document signing platform.</p>
            <p>Click the link below to accept the invitation:</p>
            <a href="${invitationLink}">Accept Invitation</a>
          `,
          type: 'invitation',
          status: 'pending',
          metadata: {
            sender_id: user.id,
            sender_name: user.user_metadata?.full_name || user.email?.split('@')[0],
            invitation_link: invitationLink
          }
        });

      if (emailError) {
        throw new Error('Failed to send invitation email');
      }

      // Record the invitation in the database
      const { error: inviteError } = await supabase
        .from('invitations')
        .insert({
          sender_id: user.id,
          email: email,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (inviteError) {
        throw new Error('Failed to record invitation');
      }

      toast({
        title: "Success",
        description: "Invitation sent successfully"
      });
    } catch (error) {
      console.error('Error in inviteContact:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send invitation",
        variant: "destructive"
      });
    }
  };

  const updateContact = async (id: string, data: Partial<Contact>) => {
    if (!user) return;

    const { error } = await supabase
      .from('contacts')
      .update(data)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update contact",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: "Contact updated successfully"
    });
  };

  const deleteContact = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete contact",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: "Contact deleted successfully"
    });
  };

  return (
    <ContactsContext.Provider value={{
      contacts,
      addContact,
      inviteContact,
      updateContact,
      deleteContact
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