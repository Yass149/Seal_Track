import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

interface MessageMetadata {
  [key: string]: string | number | boolean | null;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
  deleted_at: string | null;
  document_id: string | null;
  message_type: 'text' | 'file' | 'image' | 'system';
  metadata: MessageMetadata;
}

interface MessagesContextType {
  messages: Message[];
  loading: boolean;
  error: string | null;
  sendMessage: (
    receiverId: string,
    content: string,
    messageType?: 'text' | 'file' | 'image' | 'system',
    metadata?: MessageMetadata,
    documentId?: string
  ) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  getConversation: (contactId: string) => Message[];
  unreadCount: (contactId?: string) => number;
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchMessages = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching messages:', error);
        setError(error.message);
        return;
      }

      // Ensure the data matches our Message interface
      const typedMessages = (data || []).map(msg => ({
        id: msg.id as string,
        sender_id: msg.sender_id as string,
        receiver_id: msg.receiver_id as string,
        content: msg.content as string,
        created_at: msg.created_at as string,
        read_at: msg.read_at as string | null,
        deleted_at: msg.deleted_at as string | null,
        document_id: msg.document_id as string | null,
        message_type: msg.message_type as 'text' | 'file' | 'image' | 'system',
        metadata: (msg.metadata || {}) as MessageMetadata
      }));

      setMessages(typedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch messages');
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchMessages();

    // Create a channel for real-time updates
    const channel = supabase
      .channel('messages-changes')
      .on('postgres_changes', {
        event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${user.id}` // Messages sent by user
      }, () => {
        console.log('Message change detected (sent)');
        fetchMessages();
      })
      .on('postgres_changes', {
        event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}` // Messages received by user
      }, () => {
        console.log('Message change detected (received)');
        fetchMessages();
      })
      .subscribe((status) => {
        console.log('Message subscription status:', status);
      });

    return () => {
      console.log('Cleaning up message subscription');
      channel.unsubscribe();
    };
  }, [user]);

  const sendMessage = async (
    receiverId: string,
    content: string,
    messageType: 'text' | 'file' | 'image' | 'system' = 'text',
    metadata: MessageMetadata = {},
    documentId?: string
  ): Promise<void> => {
    if (!user) {
      setError('You must be logged in to send messages');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First, send the message
      const { data: messageData, error: messageError } = await supabase
        .rpc('send_message', {
          p_receiver_id: receiverId,
          p_content: content,
          p_message_type: messageType,
          p_metadata: metadata,
          p_document_id: documentId
        });

      if (messageError) {
        console.error('Error sending message:', messageError);
        setError(messageError.message);
        toast({
          title: "Error",
          description: messageError.message,
          variant: "destructive"
        });
        return;
      }

      // Try to create notification, but don't block on failure
      try {
        await supabase
          .rpc('create_message_notification', {
            p_message_id: messageData
          });
      } catch (notificationError) {
        // Log but don't fail the message send
        console.warn('Failed to create notification:', notificationError);
      }

      // Refresh messages to include the new one
      await fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string): Promise<void> => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId)
        .eq('receiver_id', user.id);

      if (error) {
        console.error('Error marking message as read:', error);
        return;
      }

      await fetchMessages();
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const getConversation = (contactId: string): Message[] => {
    return messages.filter(
      m => (m.sender_id === contactId && m.receiver_id === user?.id) ||
           (m.sender_id === user?.id && m.receiver_id === contactId)
    ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  };

  const unreadCount = (contactId?: string) => {
    return messages.filter(
      msg => 
        msg.receiver_id === user?.id && 
        !msg.read_at &&
        (!contactId || msg.sender_id === contactId)
    ).length;
  };

  return (
    <MessagesContext.Provider value={{
      messages,
      loading,
      error,
      sendMessage,
      markAsRead,
      getConversation,
      unreadCount
    }}>
      {children}
    </MessagesContext.Provider>
  );
}

export const useMessages = () => {
  const context = useContext(MessagesContext);
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessagesProvider');
  }
  return context;
}; 