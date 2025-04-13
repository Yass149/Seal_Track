import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { PlusCircle, Search, Users } from 'lucide-react';
import { useDocuments, Contact } from '@/context/DocumentContext';
import ContactItem from '@/components/ContactItem';
import Navbar from '@/components/Navbar';
import { useToast } from '@/components/ui/use-toast';

const Contacts = () => {
  const { contacts, addContact, updateContact, deleteContact } = useDocuments();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  
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
    }
  };
  
  const handleSendInvitation = () => {
    if (!inviteEmail) {
      toast({
        variant: "destructive",
        title: "Invalid input",
        description: "Email is required.",
      });
      return;
    }
    
    toast({
      title: "Invitation sent",
      description: `An invitation has been sent to ${inviteEmail}.`,
    });
    
    setInviteEmail('');
    setInviteMessage('');
    setIsInviteDialogOpen(false);
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
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
            <p className="text-gray-600 mt-1">Manage your contacts for document signing</p>
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
        
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        {contacts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <Users className="w-16 h-16 mx-auto text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No contacts yet</h3>
            <p className="mt-1 text-gray-500">Get started by adding your first contact</p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="mt-6">
              Add Contact
            </Button>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <Search className="w-16 h-16 mx-auto text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No matching contacts</h3>
            <p className="mt-1 text-gray-500">Try adjusting your search</p>
            <Button variant="outline" onClick={() => setSearchTerm('')} className="mt-6">
              Clear Search
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContacts.map((contact) => (
              <ContactItem
                key={contact.id}
                contact={contact}
                onEdit={openEditDialog}
                onDelete={handleDeleteContact}
                onInvite={openInviteDialog}
              />
            ))}
          </div>
        )}
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
