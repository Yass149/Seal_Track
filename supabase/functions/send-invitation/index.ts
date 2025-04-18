import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = (origin: string) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'true',
});

// Get environment variables
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
const SENDER_EMAIL = 'yassine.malal@gmail.com'; // Your verified SendGrid sender
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

// Log environment status at startup
console.log('Environment Check:');
console.log('SENDGRID_API_KEY present:', !!SENDGRID_API_KEY);
console.log('SENDGRID_API_KEY length:', SENDGRID_API_KEY?.length || 0);
console.log('SENDER_EMAIL:', SENDER_EMAIL);

serve(async (req) => {
  const origin = req.headers.get('origin') || '*';
  const headers = {
    ...corsHeaders(origin),
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling preflight request from origin:', origin);
    return new Response(JSON.stringify({}), {
      headers,
      status: 200
    });
  }

  try {
    console.log('Processing invitation request');
    
    // Check if SendGrid API key is set
    if (!SENDGRID_API_KEY) {
      const error = 'SendGrid API key is not set in environment variables';
      console.error(error);
      return new Response(JSON.stringify({ error }), {
        headers,
        status: 500
      });
    }
    
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      const error = 'No authorization header provided';
      console.error(error);
      return new Response(JSON.stringify({ error }), {
        headers,
        status: 401
      });
    }

    // Create a Supabase client to verify the token
    console.log('Verifying user token');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      console.error('Invalid token:', authError);
      return new Response(JSON.stringify({ error: 'Invalid token', details: authError }), {
        headers,
        status: 401
      });
    }
    console.log('User verified:', user.email);

    const { recipientEmail, senderName, invitationLink, message } = await req.json();
    console.log('Request payload:', { recipientEmail, senderName, invitationLink });

    // Proceed with sending the invitation email
    console.log('Preparing to send email to:', recipientEmail);

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Join SealTrack</h2>
        <p>Hello,</p>
        <p>${senderName} has invited you to join SealTrack, a secure document signing platform.</p>
        ${message ? `<p>Message from ${senderName}:</p><p style="font-style: italic;">${message}</p>` : ''}
        <p>Click the button below to accept the invitation and create your account:</p>
        <p style="margin: 30px 0;">
          <a href="${invitationLink}" 
             style="display: inline-block; background-color: #4F46E5; color: white; 
                    padding: 12px 24px; text-decoration: none; border-radius: 4px;
                    font-weight: bold;">
            Accept Invitation
          </a>
        </p>
        <p style="color: #666;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="color: #666; font-size: 14px;">${invitationLink}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated message from SealTrack. Please do not reply to this email.</p>
      </div>
    `;

    console.log('Sending email via SendGrid');
    const msg = {
      to: recipientEmail,
      from: {
        email: 'noreply@example.com',
        name: 'SealTrack'
      },
      subject: `${senderName} invited you to join SealTrack`,
      content: [
        {
          type: 'text/html',
          value: emailHtml
        }
      ]
    };

    try {
      console.log('Making request to SendGrid API');
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(msg)
      });

      console.log('SendGrid response status:', response.status);
      let responseText;
      try {
        responseText = await response.text();
        console.log('SendGrid response body:', responseText || 'No response body');
      } catch (textError) {
        console.error('Error reading response text:', textError);
        responseText = 'Could not read response body';
      }

      if (!response.ok) {
        const errorResponse = {
          error: 'Failed to send email',
          message: 'Failed to send invitation email through SendGrid',
          details: {
            status: response.status,
            statusText: response.statusText,
            body: responseText,
            headers: Object.fromEntries(response.headers.entries())
          }
        };
        console.error('SendGrid error details:', errorResponse);
        return new Response(JSON.stringify(errorResponse), {
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          status: 500
        });
      }

      console.log('Email sent successfully');
      return new Response(JSON.stringify({
        success: true,
        message: 'Invitation sent successfully'
      }), {
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        status: 200
      });
    } catch (error) {
      console.error('Error sending email:', error);
      const errorResponse = {
        error: 'Failed to send email',
        message: error.message || 'An unexpected error occurred',
        details: {
          name: error.name,
          stack: error.stack,
          cause: error.cause
        }
      };
      console.error('Error details:', errorResponse);
      return new Response(JSON.stringify(errorResponse), {
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        status: 500
      });
    }
  } catch (error) {
    console.error('Function error:', {
      name: error.name,
      message: error.message
    });
    return new Response(JSON.stringify({
      error: error.message,
      details: error.toString()
    }), {
      headers,
      status: 400
    });
  }
}); 