import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

interface MessageMetadata {
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  [key: string]: unknown;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
  message_type: 'text' | 'file' | 'image' | 'system';
  metadata: MessageMetadata;
}

interface MessagesContextType {
  messages: Message[];
  sendMessage: (receiverId: string, content: string, messageType?: Message['message_type'], metadata?: MessageMetadata) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  getConversation: (contactId: string) => Message[];
  unreadCount: (contactId?: string) => number;
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Fetch existing messages
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching messages:', error);
          toast({
            title: "Error",
            description: "Failed to fetch messages",
            variant: "destructive"
          });
          return;
        }

        // Transform the data to ensure it matches Message interface
        const typedMessages = (data || []).map(msg => ({
          id: msg.id,
          sender_id: msg.sender_id,
          receiver_id: msg.receiver_id,
          content: msg.content,
          created_at: msg.created_at,
          read: msg.read,
          message_type: msg.message_type,
          metadata: msg.metadata || {}
        })) as Message[];

        setMessages(typedMessages);
      } catch (error) {
        console.error('Error in fetchMessages:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive"
        });
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `or(sender_id.eq.${user.id},receiver_id.eq.${user.id})` 
      }, (payload) => {
        const newMessage = {
          id: payload.new.id,
          sender_id: payload.new.sender_id,
          receiver_id: payload.new.receiver_id,
          content: payload.new.content,
          created_at: payload.new.created_at,
          read: payload.new.read,
          message_type: payload.new.message_type,
          metadata: payload.new.metadata || {}
        } as Message;
        
        setMessages(prev => [newMessage, ...prev]);
        
        // Show notification for new messages
        if (newMessage.receiver_id === user.id) {
          toast({
            title: "New Message",
            description: `From: ${newMessage.sender_id}`,
          });
        }
      })
      .subscribe((status) => {
        console.log('Message subscription status:', status);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const sendMessage = async (
    receiverId: string, 
    content: string, 
    messageType: Message['message_type'] = 'text', 
    metadata: MessageMetadata = {}
  ) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to send messages",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          content,
          message_type: messageType,
          metadata,
          read: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive"
        });
        return;
      }

      // Transform the data to ensure it matches Message interface
      const newMessage = {
        id: data.id,
        sender_id: data.sender_id,
        receiver_id: data.receiver_id,
        content: data.content,
        created_at: data.created_at,
        read: data.read,
        message_type: data.message_type,
        metadata: data.metadata || {}
      } as Message;

      // Update the messages state with the new message
      setMessages(prev => [newMessage, ...prev]);

      toast({
        title: "Success",
        description: "Message sent successfully"
      });
    } catch (error) {
      console.error('Error in sendMessage:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const markAsRead = async (messageId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('id', messageId)
      .eq('receiver_id', user.id);

    if (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const getConversation = (contactId: string) => {
    return messages.filter(
      msg => 
        (msg.sender_id === contactId && msg.receiver_id === user?.id) ||
        (msg.sender_id === user?.id && msg.receiver_id === contactId)
    ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  };

  const unreadCount = (contactId?: string) => {
    return messages.filter(
      msg => 
        msg.receiver_id === user?.id && 
        !msg.read &&
        (!contactId || msg.sender_id === contactId)
    ).length;
  };

  return (
    <MessagesContext.Provider value={{
      messages,
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