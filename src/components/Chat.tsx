import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMessages } from '@/context/MessagesContext';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { Send } from 'lucide-react';

interface ChatProps {
  contactId: string;
  contactName: string;
}

export function Chat({ contactId, contactName }: ChatProps) {
  const [newMessage, setNewMessage] = useState('');
  const { user } = useAuth();
  const { sendMessage, getConversation, markAsRead } = useMessages();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const conversation = getConversation(contactId);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current;
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  }, [conversation]);

  // Mark messages as read
  useEffect(() => {
    conversation
      .filter(msg => msg.sender_id === contactId && !msg.read)
      .forEach(msg => markAsRead(msg.id));
  }, [conversation, contactId, markAsRead]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    await sendMessage(contactId, newMessage.trim());
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4">
        <h2 className="text-lg font-semibold">{contactName}</h2>
      </div>

      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4">
          {conversation.map((message) => {
            const isCurrentUser = message.sender_id === user?.id;
            return (
              <div
                key={message.id}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    isCurrentUser
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {formatDistanceToNow(new Date(message.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            );
          })}
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