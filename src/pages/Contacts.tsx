import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { PlusCircle, Search, Users, MessageCircle } from 'lucide-react';
import { useDocuments, Contact } from '@/context/DocumentContext';
import { useMessages } from '@/context/MessagesContext';
import ContactItem from '@/components/ContactItem';
import { Chat } from '@/components/Chat';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { useContacts } from '@/context/ContactsContext';
import { supabase } from '@/lib/supabase';

const Contacts = () => {
  const { contacts, addContact, updateContact, deleteContact } = useDocuments();
  const { unreadCount } = useMessages();
  const { toast } = useToast();
  const { inviteContact } = useContacts();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    walletAddress: '',
  });
  
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const selectedContactData = contacts.find(c => c.id === selectedContact);
  
  const handleAddContact = () => {
    if (!newContact.name || !newContact.email) {
      toast({
        variant: "destructive",
        title: "Invalid input",
        description: "Name and email are required.",
      });
      return;
    }
    
    addContact({
      name: newContact.name,
      email: newContact.email,
      walletAddress: newContact.walletAddress || undefined,
    });
    
    setNewContact({
      name: '',
      email: '',
      walletAddress: '',
    });
    
    setIsAddDialogOpen(false);
  };
  
  const handleEditContact = () => {
    if (!editingContact || !editingContact.name || !editingContact.email) {
      toast({
        variant: "destructive",
        title: "Invalid input",
        description: "Name and email are required.",
      });
      return;
    }
    
    updateContact(editingContact.id, {
      name: editingContact.name,
      email: editingContact.email,
      walletAddress: editingContact.walletAddress,
    });
    
    setIsEditDialogOpen(false);
  };
  
  const handleDeleteContact = (id: string) => {
    if (window.confirm("Are you sure you want to delete this contact?")) {
      deleteContact(id);
      if (selectedContact === id) {
        setSelectedContact(null);
      }
    }
  };
  
  const handleSendInvitation = async () => {
    if (!inviteEmail) {
      toast({
        variant: "destructive",
        title: "Invalid input",
        description: "Email is required.",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Sending invitation to:', inviteEmail);
      const invitationLink = `${window.location.origin}/signup?invited_by=${user.email}`;
      console.log('Invitation link:', invitationLink);
      
      let retries = 3;
      let lastError = null;
      
      while (retries > 0) {
        try {
          console.log('Attempting to send invitation, attempt:', 4 - retries);
          const { data, error } = await supabase.functions.invoke('send-invitation', {
            body: {
              recipientEmail: inviteEmail,
              senderName: user.user_metadata?.name || user.email,
              invitationLink,
              message: inviteMessage
            }
          });

          console.log('Function response:', { data, error });

          if (error) {
            // Try to parse the error message from the response
            let errorMessage = 'An error occurred while sending the invitation.';
            let errorDetails = null;
            
            try {
              // The error might be in error.message or in the data
              const errorData = error.message ? JSON.parse(error.message) : data;
              errorMessage = errorData.message || errorData.error || errorMessage;
              errorDetails = errorData.details;
              console.log('Parsed error details:', errorDetails);
            } catch (e) {
              console.error('Error parsing error response:', e);
            }

            toast({
              variant: "destructive",
              title: "Failed to send invitation",
              description: errorMessage,
            });
            
            // If this is a SendGrid error, log it for debugging
            if (errorDetails?.status) {
              console.error('SendGrid API error:', {
                status: errorDetails.status,
                response: errorDetails.body
              });
            }
            
            setIsInviteDialogOpen(false);
            return;
          }

          if (data?.error === 'User already exists') {
            toast({
              variant: "default",
              className: "bg-yellow-50 border-yellow-200",
              title: "User already exists",
              description: "This email address already belongs to a registered user.",
              action: (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsAddDialogOpen(true);
                    setNewContact(prev => ({
                      ...prev,
                      email: inviteEmail,
                      name: inviteEmail.split('@')[0] // Set a default name from email
                    }));
                    setIsInviteDialogOpen(false);
                  }}
                >
                  Add to Contacts
                </Button>
              ),
            });
            setIsInviteDialogOpen(false);
            return;
          }

          if (data?.error) {
            throw new Error(data.message || data.error);
          }

          console.log('Invitation sent successfully');
          toast({
            title: "Invitation sent",
            description: `An invitation has been sent to ${inviteEmail}.`,
          });
          
          setInviteEmail('');
          setInviteMessage('');
          setIsInviteDialogOpen(false);
          return;
        } catch (error) {
          console.error('Attempt failed:', error);
          lastError = error;
          retries--;
          if (retries > 0) {
            console.log('Retrying in 1 second...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      throw lastError;
    } catch (error) {
      console.error('Failed to send invitation:', error);
      toast({
        variant: "destructive",
        title: "Failed to send invitation",
        description: error instanceof Error ? error.message : "An error occurred while sending the invitation.",
      });
    }
  };
  
  const openEditDialog = (contact: Contact) => {
    setEditingContact(contact);
    setIsEditDialogOpen(true);
  };
  
  const openInviteDialog = (email: string) => {
    setInviteEmail(email);
    setIsInviteDialogOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
            <p className="text-gray-600 mt-1">Manage your contacts and messages</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-2">
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Invite Contact</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite a Contact</DialogTitle>
                  <DialogDescription>
                    Send an invitation to join DocuChain and collaborate on documents.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">Email</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      placeholder="email@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invite-message">Message (optional)</Label>
                    <Input
                      id="invite-message"
                      placeholder="Add a personal message..."
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleSendInvitation}>
                    Send Invitation
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <PlusCircle className="w-4 h-4" />
                  Add Contact
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Contact</DialogTitle>
                  <DialogDescription>
                    Add a new contact to your address book.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={newContact.name}
                      onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={newContact.email}
                      onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wallet">Wallet Address (optional)</Label>
                    <Input
                      id="wallet"
                      placeholder="Solana wallet address"
                      value={newContact.walletAddress}
                      onChange={(e) => setNewContact(prev => ({ ...prev, walletAddress: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleAddContact}>
                    Add Contact
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="space-y-2">
                  {contacts.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 mx-auto text-gray-300" />
                      <p className="mt-2 text-sm text-gray-500">No contacts yet</p>
                      <Button onClick={() => setIsAddDialogOpen(true)} variant="outline" className="mt-4">
                        Add Contact
                      </Button>
                    </div>
                  ) : filteredContacts.length === 0 ? (
                    <div className="text-center py-8">
                      <Search className="w-12 h-12 mx-auto text-gray-300" />
                      <p className="mt-2 text-sm text-gray-500">No matching contacts</p>
                    </div>
                  ) : (
                    filteredContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedContact === contact.id
                            ? 'bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedContact(contact.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{contact.name}</h3>
                            <p className="text-sm text-gray-500">{contact.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {unreadCount(contact.id) > 0 && (
                              <Badge variant="destructive">
                                {unreadCount(contact.id)}
                              </Badge>
                            )}
                            <MessageCircle className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            {selectedContact ? (
              <Chat
                contactId={selectedContact}
                contactName={selectedContactData?.name || ''}
              />
            ) : (
              <div className="h-[600px] bg-white rounded-lg shadow-lg flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto text-gray-300" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">
                    Select a contact to start messaging
                  </h3>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>
              Update contact information.
            </DialogDescription>
          </DialogHeader>
          {editingContact && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  placeholder="John Doe"
                  value={editingContact.name}
                  onChange={(e) => setEditingContact(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="john@example.com"
                  value={editingContact.email}
                  onChange={(e) => setEditingContact(prev => prev ? { ...prev, email: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-wallet">Wallet Address (optional)</Label>
                <Input
                  id="edit-wallet"
                  placeholder="Solana wallet address"
                  value={editingContact.walletAddress || ''}
                  onChange={(e) => setEditingContact(prev => 
                    prev ? { ...prev, walletAddress: e.target.value || undefined } : null
                  )}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleEditContact}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Contacts;
