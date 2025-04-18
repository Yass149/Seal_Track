import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  PlusCircle, Search, Users, MessageCircle, Check, X, UserPlus, 
  Mail, Wallet, Edit, Trash2, UserCircle, Clock, CheckCircle, 
  XCircle, Filter, ChevronDown 
} from 'lucide-react';
import { useContacts } from '@/context/ContactsContext';
import { useMessages } from '@/context/MessagesContext';
import { Chat } from '@/components/Chat';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessagesView } from '@/components/MessagesView';
import { motion, AnimatePresence } from 'framer-motion';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const Contacts = () => {
  const { contacts, sentRequests, receivedRequests, addContact, updateContact, deleteContact, acceptRequest, rejectRequest } = useContacts();
  const { unreadCount } = useMessages();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'recent'>('name');
  
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
  ).sort((a, b) => sortBy === 'name' ? a.name.localeCompare(b.name) : 0);
  
  const selectedContactData = contacts.find(c => c.id === selectedContact);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
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
    
    toast({
      title: "Contact added",
      description: "The contact has been added successfully.",
    });
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
    toast({
      title: "Contact updated",
      description: "The contact has been updated successfully.",
    });
  };
  
  const handleDeleteContact = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this contact?")) {
      await deleteContact(id);
      if (selectedContact === id) {
        setSelectedContact(null);
      }
      toast({
        title: "Contact deleted",
        description: "The contact has been removed from your list.",
      });
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
    toast({
      title: "Request accepted",
      description: "The contact has been added to your list.",
    });
  };

  const handleRejectRequest = async (requestId: string) => {
    await rejectRequest(requestId);
    toast({
      title: "Request rejected",
      description: "The contact request has been rejected.",
    });
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
              <p className="text-gray-500 mt-1">Manage your contacts and connection requests</p>
              <div className="flex flex-wrap gap-3 mt-3">
                <Badge variant="secondary" className="gap-1">
                  <Users className="w-3 h-3" />
                  {contacts.length} Contacts
                </Badge>
                {receivedRequests.length > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <Clock className="w-3 h-3" />
                    {receivedRequests.length} Pending
                  </Badge>
                )}
              </div>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary-600 hover:bg-primary-700">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Contact
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Contact</DialogTitle>
                  <DialogDescription>
                    Add a new contact to your network.
                  </DialogDescription>
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

          <Tabs defaultValue="contacts" className="w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <TabsList className="bg-gray-100/80">
                <TabsTrigger value="contacts" className="data-[state=active]:bg-white">
                  <Users className="w-4 h-4 mr-2" />
                  Contacts
                </TabsTrigger>
                <TabsTrigger value="requests" className="data-[state=active]:bg-white">
                  <Clock className="w-4 h-4 mr-2" />
                  Requests
                  {receivedRequests.length > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {receivedRequests.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              
              <div className="flex gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:flex-none md:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Filter className="w-4 h-4" />
                      Sort
                      <ChevronDown className="w-4 h-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[180px]">
                    <DropdownMenuItem onClick={() => setSortBy('name')}>
                      Sort by Name
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('recent')}>
                      Sort by Recent
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <TabsContent value="contacts" className="mt-0">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="w-full lg:w-1/2 xl:w-2/5">
                  <Card>
                    <CardContent className="p-6">
                      <AnimatePresence mode="wait">
                        {filteredContacts.length === 0 ? (
                          <motion.div
                            key="empty"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="text-center py-12"
                          >
                            <Users className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-4 text-lg font-semibold text-gray-900">No contacts found</h3>
                            <p className="text-gray-500 mt-1">
                              {searchTerm 
                                ? "No contacts match your search criteria" 
                                : "Add your first contact to get started"}
                            </p>
                            <DialogTrigger asChild>
                              <Button className="mt-4">
                                <UserPlus className="mr-2 h-4 w-4" />
                                Add Contact
                              </Button>
                            </DialogTrigger>
                          </motion.div>
                        ) : (
                          <motion.div
                            variants={container}
                            initial="hidden"
                            animate="show"
                            className="grid grid-cols-1 gap-4"
                          >
                            {filteredContacts.map((contact) => (
                              <motion.div
                                key={contact.id}
                                variants={item}
                                className="group"
                                onClick={() => setSelectedContact(contact.id)}
                              >
                                <Card className={`cursor-pointer hover:shadow-md transition-shadow ${
                                  selectedContact === contact.id ? 'ring-2 ring-primary-500 shadow-md' : ''
                                }`}>
                                  <CardContent className="p-4">
                                    <div className="flex items-start space-x-4">
                                      <Avatar className="h-12 w-12">
                                        <AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 space-y-1">
                                        <h3 className="font-medium text-base">{contact.name}</h3>
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
                                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                  </CardContent>
                                </Card>
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </div>

                <div className="w-full lg:w-1/2 xl:w-3/5">
                  <Card className="h-[calc(100vh-280px)]">
                    <CardContent className="p-0 h-full">
                      {selectedContact ? (
                        <MessagesView contactId={selectedContact} />
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                          <MessageCircle className="h-12 w-12 mb-4 text-gray-400" />
                          <h3 className="text-lg font-semibold text-gray-900">Select a contact to start messaging</h3>
                          <p className="text-gray-500 mt-1">Choose a contact from the list to view your conversation</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="requests" className="mt-0">
              <Card>
                <CardContent className="p-6">
                  <AnimatePresence mode="wait">
                    {receivedRequests.length === 0 && sentRequests.length === 0 ? (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="text-center py-12"
                      >
                        <Clock className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">No pending requests</h3>
                        <p className="text-gray-500 mt-1">You don't have any pending contact requests</p>
                      </motion.div>
                    ) : (
                      <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="space-y-6"
                      >
                        {receivedRequests.length > 0 && (
                          <motion.div variants={item}>
                            <h3 className="text-lg font-medium mb-4">Received Requests</h3>
                            <div className="grid gap-4">
                              {receivedRequests.map((request) => (
                                <Card key={request.id} className="group">
                                  <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-4">
                                        <Avatar>
                                          <AvatarFallback>
                                            {getInitials(request.sender_name)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <h4 className="font-medium">{request.sender_name}</h4>
                                          <div className="flex items-center text-sm text-muted-foreground">
                                            <Mail className="mr-1 h-3 w-3" />
                                            {request.recipient_email}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex space-x-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                          onClick={() => handleAcceptRequest(request.id)}
                                        >
                                          <Check className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                          onClick={() => handleRejectRequest(request.id)}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </motion.div>
                        )}

                        {sentRequests.length > 0 && (
                          <motion.div variants={item}>
                            <h3 className="text-lg font-medium mb-4">Sent Requests</h3>
                            <div className="grid gap-4">
                              {sentRequests.map((request) => (
                                <Card key={request.id}>
                                  <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-4">
                                        <Avatar>
                                          <AvatarFallback>
                                            {getInitials(request.recipient_email.split('@')[0])}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <div className="flex items-center text-sm text-muted-foreground">
                                            <Mail className="mr-1 h-3 w-3" />
                                            {request.recipient_email}
                                          </div>
                                          <div className="text-sm text-muted-foreground">
                                            Sent {new Date(request.created_at).toLocaleDateString()}
                                          </div>
                                        </div>
                                      </div>
                                      <Badge variant={
                                        request.status === 'pending' ? 'secondary' :
                                        request.status === 'accepted' ? 'outline' :
                                        'destructive'
                                      }>
                                        {request.status}
                                      </Badge>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
      
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
