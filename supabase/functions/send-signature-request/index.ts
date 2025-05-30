import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { signerEmail, signerName, documentTitle, documentUrl } = await req.json();

    if (!signerEmail || !signerName || !documentTitle || !documentUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Send email using Supabase's built-in email service
    const { error } = await supabaseClient.functions.invoke('send-email', {
      body: {
        to: signerEmail,
        subject: `Signature Request: ${documentTitle}`,
        html: `
          <h2>Signature Request</h2>
          <p>Hello ${signerName},</p>
          <p>You have been requested to sign the document "${documentTitle}".</p>
          <p>Please click the link below to review and sign the document:</p>
          <p><a href="${documentUrl}">${documentUrl}</a></p>
          <p>Thank you,<br>The SealTrack Team</p>
        `,
      },
    });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}); 