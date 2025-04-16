import React, { useState, useEffect, useRef } from 'react';
import { useMessages } from '@/context/MessagesContext';
import { useContacts } from '@/context/ContactsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Send } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface MessagesViewProps {
  contactId: string;
}

export function MessagesView({ contactId }: MessagesViewProps) {
  const { user } = useAuth();
  const { getContact } = useContacts();
  const { messages, sendMessage, markAsRead } = useMessages();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const contact = getContact(contactId);

  // Filter messages for this contact
  const contactMessages = messages.filter(
    msg => (msg.sender_id === user?.id && msg.receiver_id === contact?.contact_id) ||
           (msg.receiver_id === user?.id && msg.sender_id === contact?.contact_id)
  ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  // Mark messages as read when viewing them
  useEffect(() => {
    if (contactId && user?.id && contact?.contact_id) {
      const unreadMessages = messages
        .filter(msg => 
          msg.receiver_id === user.id && 
          msg.sender_id === contact.contact_id && 
          !msg.read
        );
      
      // Mark each unread message as read
      for (const msg of unreadMessages) {
        void markAsRead(msg.id);
      }
    }
  }, [contactId, messages, markAsRead, user?.id, contact?.contact_id]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [contactMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !contact?.contact_id) return;

    await sendMessage(contact.contact_id, newMessage.trim());
    setNewMessage('');
  };

  if (!contact) {
    return <div>Contact not found</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-4">
        <h2 className="text-lg font-semibold">{contact.name}</h2>
        <p className="text-sm text-muted-foreground">{contact.email}</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {contactMessages.map((message) => (
            <Card
              key={message.id}
              className={`p-3 max-w-[80%] ${
                message.sender_id === user?.id
                  ? 'ml-auto bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <p>{message.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {new Date(message.created_at).toLocaleTimeString()}
              </p>
            </Card>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSendMessage} className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
} 