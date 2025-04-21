import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Mail, Send, Clock, CheckCircle, XCircle, Trash2, AlertCircle, 
  RefreshCw, Users, Calendar, ChevronDown, Filter 
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Invitation {
  id: string;
  recipient_email: string;
  status: string;
  created_at: string;
  accepted_at?: string;
  expires_at: string;
}

const defaultMessage = `Hi there!

I'd like to invite you to join SealTrack, a secure platform for document sharing and collaboration. 

You can sign up using this invitation and we can start sharing documents securely.

Best regards`;

const Invitations = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [invitationData, setInvitationData] = useState({
    email: '',
    message: defaultMessage
  });
  const [filter, setFilter] = useState<'all' | 'pending' | 'expired'>('all');

  // Fetch invitations
  const fetchInvitations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('sender_id', user.id)
        .not('status', 'eq', 'accepted') // Don't show accepted invitations
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type assertion to ensure data matches Invitation interface
      const typedData = (data || []).map(item => ({
        id: item.id,
        recipient_email: item.email,
        status: item.status,
        created_at: item.created_at,
        accepted_at: item.accepted_at,
        expires_at: item.expires_at
      })) as Invitation[];
      
      setInvitations(typedData);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  // Delete invitation
  const handleDeleteInvitation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invitation deleted successfully"
      });

      // Update local state
      setInvitations(prev => prev.filter(inv => inv.id !== id));
    } catch (error) {
      console.error('Error deleting invitation:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete invitation"
      });
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    fetchInvitations();

    const channel = supabase
      .channel('invitations-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'invitations',
        filter: `sender_id=eq.${user.id}`
      }, () => {
        fetchInvitations();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !invitationData.email || !invitationData.message) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide both email and message"
      });
      return;
    }

    setLoading(true);
    try {
      // First create the invitation with 'pending' status
      const { data: invitation, error: dbError } = await supabase
        .from('invitations')
        .insert([{
          sender_id: user.id,
          email: invitationData.email,
          status: 'pending',  // Start with pending status
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
        }])
        .select()
        .single();

      if (dbError) throw dbError;

      const invitationLink = `${window.location.origin}/signup?invited_by=${user.email}`;
      
      // Then send the email
      const { error } = await supabase.functions.invoke('send-invitation', {
        body: {
          recipientEmail: invitationData.email,
          senderName: user.user_metadata?.full_name || user.email,
          invitationLink,
          message: invitationData.message
        }
      });

      if (error) {
        // If email sending fails, update status to error
        await supabase
          .from('invitations')
          .update({ status: 'error' })
          .eq('id', invitation.id);
        throw error;
      }

      // If email is sent successfully, update status to sent
      await supabase
        .from('invitations')
        .update({ status: 'sent' })
        .eq('id', invitation.id);

      toast({
        title: "Success",
        description: `Invitation sent to ${invitationData.email}`
      });

      // Reset form
      setInvitationData({
        email: '',
        message: defaultMessage
      });
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send invitation"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date();
    if (isExpired && ['pending', 'sent'].includes(status)) {
      return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusText = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date();
    if (isExpired && ['pending', 'sent'].includes(status)) {
      return 'Expired';
    }
    switch (status) {
      case 'accepted':
        return 'Accepted';
      case 'error':
        return 'Failed';
      case 'expired':
        return 'Expired';
      default:
        return 'Pending';
    }
  };

  const getStatusBadgeVariant = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date();
    if (isExpired && ['pending', 'sent'].includes(status)) {
      return 'secondary';
    }
    switch (status) {
      case 'accepted':
        return 'outline';
      case 'error':
        return 'destructive';
      case 'expired':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const filteredInvitations = invitations.filter(invitation => {
    const isExpired = new Date(invitation.expires_at) < new Date();
    switch (filter) {
      case 'pending':
        return !isExpired && ['pending', 'sent'].includes(invitation.status);
      case 'expired':
        return isExpired || invitation.status === 'expired';
      default:
        return true;
    }
  });

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
      <div className="container mx-auto py-8 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Invitations</h1>
              <p className="text-gray-500 mt-1">Manage and track your sent invitations</p>
              <div className="flex flex-wrap gap-3 mt-3">
                <Badge variant="secondary" className="gap-1">
                  <Users className="w-3 h-3" />
                  {invitations.length} Total
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Clock className="w-3 h-3" />
                  {invitations.filter(inv => new Date(inv.expires_at) > new Date() && ['pending', 'sent'].includes(inv.status)).length} Pending
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {invitations.filter(inv => new Date(inv.expires_at) < new Date() || inv.status === 'expired').length} Expired
                </Badge>
              </div>
            </div>
          </div>

          {/* Invitation Form */}
          <Card>
            <CardHeader>
              <CardTitle>Send Invitation</CardTitle>
              <CardDescription>
                Invite someone to join SealTrack and collaborate on documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendInvitation} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Recipient Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@company.com"
                    value={invitationData.email}
                    onChange={(e) => setInvitationData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">
                    Invitation Message
                  </label>
                  <Textarea
                    id="message"
                    placeholder="Write your invitation message..."
                    value={invitationData.message}
                    onChange={(e) => setInvitationData(prev => ({ ...prev, message: e.target.value }))}
                    required
                    className="min-h-[200px]"
                  />
                </div>
                <Button type="submit" className="w-full bg-primary-600 hover:bg-primary-700" disabled={loading}>
                  <Send className="w-4 h-4 mr-2" />
                  {loading ? 'Sending...' : 'Send Invitation'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Sent Invitations */}
          <Card>
            <CardHeader className="pb-0">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle>Sent Invitations</CardTitle>
                  <CardDescription>Track the status of your sent invitations</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Filter className="w-4 h-4" />
                      {filter === 'all' ? 'All Invitations' : 
                       filter === 'pending' ? 'Pending' : 'Expired'}
                      <ChevronDown className="w-4 h-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[200px]">
                    <DropdownMenuItem onClick={() => setFilter('all')}>
                      All Invitations
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilter('pending')}>
                      Pending
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilter('expired')}>
                      Expired
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <AnimatePresence mode="wait">
                {filteredInvitations.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center py-12"
                  >
                    <Mail className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-semibold text-gray-900">No invitations found</h3>
                    <p className="text-gray-500 mt-1">
                      {filter === 'all' 
                        ? "You haven't sent any invitations yet" 
                        : `No ${filter} invitations found`}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="space-y-4"
                  >
                    {filteredInvitations.map((invitation) => (
                      <motion.div
                        key={invitation.id}
                        variants={item}
                        layout
                      >
                        <Card className="group">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center">
                                  <Mail className="w-4 h-4 mr-2 text-primary-500" />
                                  <span className="font-medium">{invitation.recipient_email}</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    Sent {new Date(invitation.created_at).toLocaleDateString()}
                                  </div>
                                  <Separator orientation="vertical" className="h-4" />
                                  <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    Expires {new Date(invitation.expires_at).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge variant={getStatusBadgeVariant(invitation.status, invitation.expires_at)}>
                                  <span className="flex items-center gap-1">
                                    {getStatusIcon(invitation.status, invitation.expires_at)}
                                    {getStatusText(invitation.status, invitation.expires_at)}
                                  </span>
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteInvitation(invitation.id)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
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
        </motion.div>
      </div>
    </div>
  );
};

export default Invitations;
