import { supabase } from './supabase';

interface InvitationEmail {
  recipientEmail: string;
  senderName: string;
  invitationLink: string;
}

export const sendInvitationEmail = async ({ recipientEmail, senderName, invitationLink }: InvitationEmail) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-invitation-email', {
      body: {
        recipientEmail,
        senderName,
        invitationLink
      }
    });

    if (error) {
      console.error('Error sending invitation email:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in sendInvitationEmail:', error);
    throw error;
  }
}; 