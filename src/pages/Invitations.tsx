import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { UserPlus, Copy, Mail, Send } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

const Invitations = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const invitationLink = user ? `${window.location.origin}/signup?invited_by=${user.email}` : '';

  const handleCopyLink = () => {
    if (!invitationLink) return;
    navigator.clipboard.writeText(invitationLink);
    toast({
      title: "Copied to clipboard",
      description: "Invitation link has been copied to your clipboard.",
    });
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
      if (!user) {
        throw new Error('User not authenticated');
      }

      setIsLoading(true);
      console.log('Sending invitation to:', inviteEmail);
      
      const { data, error } = await supabase.functions.invoke('send-invitation', {
        body: {
          recipientEmail: inviteEmail,
          senderName: user.user_metadata?.name || user.email,
          invitationLink,
          message: inviteMessage
        }
      });

      if (error) {
        let errorMessage = 'An error occurred while sending the invitation.';
        try {
          const errorData = error.message ? JSON.parse(error.message) : data;
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          console.error('Error parsing error response:', e);
        }

        toast({
          variant: "destructive",
          title: "Failed to send invitation",
          description: errorMessage,
        });
        return;
      }

      if (data?.error === 'User already exists') {
        toast({
          variant: "default",
          className: "bg-yellow-50 border-yellow-200",
          title: "User already exists",
          description: "This email address already belongs to a registered user.",
        });
        return;
      }

      toast({
        title: "Invitation sent",
        description: `An invitation has been sent to ${inviteEmail}.`,
      });
      
      setInviteEmail('');
      setInviteMessage('');
    } catch (error) {
      console.error('Failed to send invitation:', error);
      toast({
        variant: "destructive",
        title: "Failed to send invitation",
        description: error instanceof Error ? error.message : "An error occurred while sending the invitation.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Invitations</h1>
            <p className="text-gray-600 mt-1">Invite others to join DocuChain</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Invite by Email Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-docuchain-primary" />
                Invite by Email
              </CardTitle>
              <CardDescription>
                Send an email invitation to colleagues or clients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Personal Message (optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Add a personal message to your invitation..."
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSendInvitation} 
                disabled={isLoading} 
                className="w-full flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {isLoading ? 'Sending...' : 'Send Invitation'}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Share Invite Link */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-docuchain-primary" />
                Share Invite Link
              </CardTitle>
              <CardDescription>
                Copy and share your personal invitation link
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-link">Your Personal Invite Link</Label>
                <div className="flex">
                  <Input
                    id="invite-link"
                    value={invitationLink}
                    readOnly
                    className="rounded-r-none"
                  />
                  <Button 
                    onClick={handleCopyLink}
                    variant="secondary"
                    className="rounded-l-none"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-md text-sm">
                <h4 className="font-semibold text-blue-800 mb-2">Why invite others?</h4>
                <ul className="list-disc pl-5 text-blue-700 space-y-1">
                  <li>Collaborate on documents securely</li>
                  <li>Sign contracts and agreements together</li>
                  <li>Track document status in real-time</li>
                  <li>Maintain a secure record of all transactions</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex-col space-y-4">
              <div className="flex gap-2 w-full">
                <Button className="flex-1 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </Button>
                <Button className="flex-1 flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                  Twitter
                </Button>
              </div>
              <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5.46 7.12l-1.97 9.38c-.14.66-.5.84-1.03.52l-2.84-2.1-1.37 1.32c-.16.15-.28.28-.57.28l.2-2.86 5.2-4.7c.23-.2-.05-.31-.34-.11l-6.43 4.04-2.77-.92c-.6-.2-.61-.59.13-.87l10.8-4.16c.5-.18.94.13.79.84z" />
                </svg>
                Telegram
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Invitations;
