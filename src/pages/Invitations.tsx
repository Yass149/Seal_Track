import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Mail, Send, Clock, CheckCircle, XCircle, Trash2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

interface Invitation {
  id: string;
  recipient_email: string;
  status: string;
  created_at: string;
  accepted_at?: string;
  expires_at: string;
}

const defaultMessage = `Hi there!

I'd like to invite you to join DocuChain, a secure platform for document sharing and collaboration. 

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

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="space-y-8">
        {/* Invitation Form */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-6">Send Invitation</h2>
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
            <Button type="submit" className="w-full" disabled={loading}>
              <Send className="w-4 h-4 mr-2" />
              {loading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </form>
        </Card>

        {/* Sent Invitations */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Sent Invitations</h3>
          {invitations.length > 0 ? (
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <Card key={invitation.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        <span className="font-medium">{invitation.recipient_email}</span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 mr-2" />
                        {new Date(invitation.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span>Expires: {new Date(invitation.expires_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        {getStatusIcon(invitation.status, invitation.expires_at)}
                        <span className="ml-1">{getStatusText(invitation.status, invitation.expires_at)}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteInvitation(invitation.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No invitations sent yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Invitations;
