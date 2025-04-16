import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { PlusCircle, Search, Users, MessageCircle, Check, X, UserPlus, Mail, Wallet, Edit, Trash2 } from 'lucide-react';
import { useContacts } from '@/context/ContactsContext';
import { useMessages } from '@/context/MessagesContext';
import { Chat } from '@/components/Chat';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessagesView } from '@/components/MessagesView';

const Contacts = () => {
  const { contacts, sentRequests, receivedRequests, addContact, updateContact, deleteContact, acceptRequest, rejectRequest } = useContacts();
  const { unreadCount } = useMessages();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    wallet_address: '',
  });
  
  const [editingContact, setEditingContact] = useState<{
    id: string;
    name: string;
    email: string;
    wallet_address?: string;
  } | null>(null);
  
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const selectedContactData = contacts.find(c => c.id === selectedContact);
  
  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name || !newContact.email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Name and email are required"
      });
      return;
    }

    await addContact({
      name: newContact.name,
      email: newContact.email,
      wallet_address: newContact.wallet_address || undefined
    });

    setNewContact({ name: "", email: "", wallet_address: "" });
    setIsAddDialogOpen(false);
  };
  
  const handleEditContact = async () => {
    if (!editingContact || !editingContact.name || !editingContact.email) {
      toast({
        variant: "destructive",
        title: "Invalid input",
        description: "Name and email are required.",
      });
      return;
    }
    
    await updateContact(editingContact.id, {
      name: editingContact.name,
      email: editingContact.email,
      wallet_address: editingContact.wallet_address,
    });
    
    setIsEditDialogOpen(false);
  };
  
  const handleDeleteContact = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this contact?")) {
      await deleteContact(id);
      if (selectedContact === id) {
        setSelectedContact(null);
      }
    }
  };
  
  const openEditDialog = (contact: typeof contacts[0]) => {
    setEditingContact({
      id: contact.id,
      name: contact.name,
      email: contact.email,
      wallet_address: contact.wallet_address,
    });
    setIsEditDialogOpen(true);
  };

  const handleAcceptRequest = async (requestId: string) => {
    await acceptRequest(requestId);
  };

  const handleRejectRequest = async (requestId: string) => {
    await rejectRequest(requestId);
  };

  return (
    <div className="container mx-auto p-4 h-screen flex flex-col">
      <Tabs defaultValue="contacts" className="flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="requests">
              Requests
              {receivedRequests.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {receivedRequests.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Contact</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddContact} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newContact.name}
                    onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Contact name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contact@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wallet">Wallet Address (Optional)</Label>
                  <Input
                    id="wallet"
                    value={newContact.wallet_address}
                    onChange={(e) => setNewContact(prev => ({ ...prev, wallet_address: e.target.value }))}
                    placeholder="0x..."
                  />
                </div>
                <Button type="submit" className="w-full">Add Contact</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="contacts" className="flex-1 flex space-x-4">
          <div className="w-1/3 flex flex-col">
            <Input
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4"
            />
            <ScrollArea className="flex-1">
              <div className="space-y-2">
                {filteredContacts.map((contact) => (
                  <Card
                    key={contact.id}
                    className={`p-4 cursor-pointer hover:bg-accent ${
                      selectedContact === contact.id ? "bg-accent" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1" onClick={() => setSelectedContact(contact.id)}>
                        <h3 className="font-medium">{contact.name}</h3>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Mail className="mr-1 h-3 w-3" />
                          {contact.email}
                        </div>
                        {contact.wallet_address && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Wallet className="mr-1 h-3 w-3" />
                            {contact.wallet_address.slice(0, 6)}...{contact.wallet_address.slice(-4)}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(contact);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteContact(contact.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div className="w-2/3">
            {selectedContact ? (
              <MessagesView contactId={selectedContact} />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Select a contact to start messaging
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="flex-1">
          <div className="space-y-4">
            {receivedRequests.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-2">Received Requests</h3>
                <div className="space-y-2">
                  {receivedRequests.map((request) => (
                    <Card key={request.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{request.sender_name}</h4>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Mail className="mr-1 h-3 w-3" />
                            {request.recipient_email}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600"
                            onClick={() => handleAcceptRequest(request.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                            onClick={() => handleRejectRequest(request.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {sentRequests.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-2">Sent Requests</h3>
                <div className="space-y-2">
                  {sentRequests.map((request) => (
                    <Card key={request.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Mail className="mr-1 h-3 w-3" />
                            {request.recipient_email}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Sent {new Date(request.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge>{request.status}</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {receivedRequests.length === 0 && sentRequests.length === 0 && (
              <div className="text-center text-muted-foreground">
                No pending contact requests
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
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
                  placeholder="Wallet address"
                  value={editingContact.wallet_address || ''}
                  onChange={(e) => setEditingContact(prev => 
                    prev ? { ...prev, wallet_address: e.target.value || undefined } : null
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
