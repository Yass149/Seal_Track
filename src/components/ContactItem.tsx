
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, User, Wallet, Calendar, Edit, Trash2, Send } from 'lucide-react';
import { Contact } from '@/context/DocumentContext';

interface ContactItemProps {
  contact: Contact;
  onEdit: (contactId: string) => void;
  onDelete: (contactId: string) => void;
  onInvite: (email: string) => void;
}

const ContactItem: React.FC<ContactItemProps> = ({ contact, onEdit, onDelete, onInvite }) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5 text-docuchain-primary" />
          {contact.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex items-center">
            <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
            <span>{contact.email}</span>
          </div>
          
          {contact.walletAddress && (
            <div className="flex items-center">
              <Wallet className="w-4 h-4 mr-2 text-muted-foreground" />
              <span className="truncate max-w-[200px]">{contact.walletAddress}</span>
            </div>
          )}
          
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
            <span>Added: {new Date(contact.addedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onEdit(contact.id)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(contact.id)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
        <Button 
          size="sm"
          onClick={() => onInvite(contact.email)}
        >
          <Send className="w-4 h-4 mr-2" />
          Invite
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ContactItem;
