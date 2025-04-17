// @deno-types="https://deno.land/std@0.168.0/http/server.d.ts"
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { PDFDocument, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.17.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

interface DocumentData {
  title: string;
  content: string;
  blockchain_hash?: string;
  signers: Array<{
    name: string;
    email: string;
    signature_data_url?: string;
    signature_timestamp?: string;
    signature_hash?: string;
    has_signed: boolean;
  }>;
}

function formatHash(hash: string): string {
  // Take first 8 characters and last 8 characters
  const shortHash = `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  return shortHash;
}

async function generatePDF(data: DocumentData): Promise<Uint8Array> {
  try {
    const doc = await PDFDocument.create();
    
    // Embed fonts
    const helveticaFont = await doc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);
    
    // Constants for layout
    const margin = 72; // 1 inch margins
    const titleFontSize = 14;
    const subtitleFontSize = 12;
    const bodyFontSize = 11;
    const smallFontSize = 10;
    const lineHeight = bodyFontSize * 1.5;
    const paragraphSpacing = bodyFontSize * 1.5;
    const signatureWidth = 150;
    const boxPadding = 20;
    
    // Add first page with content
    let currentPage = doc.addPage([595.28, 841.89]); // A4
    const { width, height } = currentPage.getSize();
    let y = height - margin;
    
    // Draw title centered
    const titleWidth = helveticaBold.widthOfTextAtSize(data.title, titleFontSize);
    currentPage.drawText(data.title, {
      x: (width - titleWidth) / 2,
      y: y - titleFontSize,
      size: titleFontSize,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    y -= titleFontSize + lineHeight * 2;

    // Draw document hash if available
    if (data.blockchain_hash) {
      const shortHash = formatHash(data.blockchain_hash);
      const hashWidth = helveticaFont.widthOfTextAtSize(shortHash, smallFontSize);
      currentPage.drawText(shortHash, {
        x: (width - hashWidth) / 2,
        y: y,
        size: smallFontSize,
        font: helveticaFont,
        color: rgb(0.3, 0.3, 0.3),
      });
      y -= lineHeight * 2;
    }
    
    // Process content with proper legal document formatting
    const lines = data.content.split('\n');
    let currentSection = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        y -= lineHeight;
        continue;
      }
      
      if (y < margin + lineHeight * 2) {
        currentPage = doc.addPage([595.28, 841.89]);
        y = height - margin;
      }
      
      const isHeader = trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length > 3;
      
      if (isHeader) {
        y -= paragraphSpacing;
        
        // Handle section headers
        const sectionMatch = trimmedLine.match(/^(\d+)\./);
        if (sectionMatch) {
          currentSection = sectionMatch[1];
          currentPage.drawText(trimmedLine, {
            x: margin,
            y,
            size: subtitleFontSize,
            font: helveticaBold,
            color: rgb(0, 0, 0),
          });
        } else {
          currentPage.drawText(trimmedLine, {
            x: margin,
            y,
            size: subtitleFontSize,
            font: helveticaBold,
            color: rgb(0, 0, 0),
          });
        }
        y -= subtitleFontSize + lineHeight;
      } else {
        // Handle subsections and content
        if (trimmedLine.match(/^\d+\.\d+/)) {
          currentPage.drawText(trimmedLine, {
            x: margin + 20,
            y,
            size: bodyFontSize,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
          y -= lineHeight;
        } else if (trimmedLine.startsWith('-')) {
          currentPage.drawText(trimmedLine, {
            x: margin + 20,
            y,
            size: bodyFontSize,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
          y -= lineHeight;
        } else {
          const words = trimmedLine.split(' ');
          let currentLine = '';
          
          for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const textWidth = helveticaFont.widthOfTextAtSize(testLine, bodyFontSize);
            
            if (textWidth > width - (margin * 2)) {
              currentPage.drawText(currentLine, {
                x: margin,
                y,
                size: bodyFontSize,
                font: helveticaFont,
                color: rgb(0, 0, 0),
              });
              y -= lineHeight;
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          }
          
          if (currentLine) {
            currentPage.drawText(currentLine, {
              x: margin,
              y,
              size: bodyFontSize,
              font: helveticaFont,
              color: rgb(0, 0, 0),
            });
            y -= lineHeight;
          }
        }
      }
    }
    
    // Add signature page
    let signaturePage = doc.addPage([595.28, 841.89]);
    y = height - margin;
    
    // Draw signature page title
    const signatureTitle = 'SIGNATURES';
    signaturePage.drawText(signatureTitle, {
      x: margin,
      y,
      size: subtitleFontSize,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    y -= subtitleFontSize + paragraphSpacing;
    
    // Draw signature blocks
    for (const signer of data.signers) {
      if (y < margin + 150) {
        signaturePage = doc.addPage([595.28, 841.89]);
        y = height - margin;
      }
      
      // Draw "Signed by:" label
      signaturePage.drawText('Signed by:', {
        x: margin,
        y,
        size: bodyFontSize,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });
      y -= lineHeight * 1.5;
      
      // Calculate name width for positioning
      const nameWidth = helveticaFont.widthOfTextAtSize(signer.name, bodyFontSize);
      
      // Draw name
      signaturePage.drawText(signer.name, {
        x: margin,
        y,
        size: bodyFontSize,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
      
      // Draw signature if available - right after the name
      if (signer.has_signed && signer.signature_data_url) {
        try {
          const base64Data = signer.signature_data_url.split(',')[1] || signer.signature_data_url;
          const signatureBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          const signatureImage = await doc.embedPng(signatureBytes);
          
          const aspectRatio = signatureImage.height / signatureImage.width;
          const sigWidth = Math.min(120, signatureImage.width); // Increased size
          const sigHeight = sigWidth * aspectRatio;
          
          signaturePage.drawImage(signatureImage, {
            x: margin + nameWidth + 20, // Position after name with some spacing
            y: y - (sigHeight / 4), // Adjust vertical position to align with name
            width: sigWidth,
            height: sigHeight,
          });
        } catch (error) {
          console.error('Error processing signature:', error);
        }
      }
      
      // Draw signature line
      signaturePage.drawLine({
        start: { x: margin, y: y - 2 },
        end: { x: margin + 300, y: y - 2 },
        thickness: 0.5,
        color: rgb(0, 0, 0),
      });
      
      // Draw date on the right side
      if (signer.has_signed && signer.signature_timestamp) {
        const date = new Date(signer.signature_timestamp);
        const dateText = `Date: ${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}, ${date.getHours() % 12 || 12}:${String(date.getMinutes()).padStart(2, '0')} ${date.getHours() >= 12 ? 'PM' : 'AM'}`;
        const dateWidth = helveticaFont.widthOfTextAtSize(dateText, bodyFontSize);
        signaturePage.drawText(dateText, {
          x: width - margin - dateWidth,
          y,
          size: bodyFontSize,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
      }
      
      // Draw hash below signature line
      if (signer.signature_hash) {
        y -= lineHeight * 2;
        const hashLength = signer.signature_hash.length;
        const firstHalf = signer.signature_hash.substring(0, Math.ceil(hashLength / 2));
        const secondHalf = signer.signature_hash.substring(Math.ceil(hashLength / 2));

        signaturePage.drawText(firstHalf, {
          x: margin,
          y,
          size: smallFontSize,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
        y -= lineHeight;
        signaturePage.drawText(secondHalf, {
          x: margin,
          y,
          size: smallFontSize,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
      }
      
      y -= lineHeight * 4; // More space before next signature
    }
    
    // Add document hash at the very bottom of the last page
    if (data.blockchain_hash) {
      const lastPage = doc.getPages()[doc.getPageCount() - 1];
      const bottomMargin = 50;
      
      // Draw separator line
      lastPage.drawLine({
        start: { x: margin, y: bottomMargin + 40 },
        end: { x: width - margin, y: bottomMargin + 40 },
        thickness: 0.5,
        color: rgb(0, 0, 0),
      });
      
      // Split document hash into two lines
      const hashLength = data.blockchain_hash.length;
      const firstHalf = data.blockchain_hash.substring(0, Math.ceil(hashLength / 2));
      const secondHalf = data.blockchain_hash.substring(Math.ceil(hashLength / 2));

      // Draw document hash label and first half
      lastPage.drawText('Document Hash:', {
        x: margin,
        y: bottomMargin + 20,
        size: smallFontSize,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });

      // Draw hash in two lines
      lastPage.drawText(firstHalf, {
        x: margin,
        y: bottomMargin + 5,
        size: smallFontSize,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });

      lastPage.drawText(secondHalf, {
        x: margin,
        y: bottomMargin - 10,
        size: smallFontSize,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
    }
    
    console.log('Saving PDF...');
    const pdfBytes = await doc.save();
    console.log('PDF generated successfully. Size:', pdfBytes.length, 'bytes');
    return pdfBytes;
    
  } catch (error) {
    console.error('Error in PDF generation:', error);
    throw error;
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received PDF generation request');
    const { documentId } = await req.json();

    if (!documentId) {
      throw new Error('Document ID is required');
    }
    console.log('Document ID:', documentId);

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Fetching document from Supabase...');
    
    // Fetch document with signers array
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select(`
        *,
        signers
      `)
      .eq('id', documentId)
      .single();

    if (docError || !doc) {
      console.error('Error fetching document:', docError);
      throw new Error(docError?.message || 'Document not found');
    }

    // Ensure signers is an array and has the correct data
    const signers = Array.isArray(doc.signers) ? doc.signers.map(signer => {
      console.log('Signer data:', {
        name: signer.name,
        has_signed: signer.has_signed,
        has_signature: !!signer.signature_data_url,
        signature_length: signer.signature_data_url?.length
      });
      return {
        ...signer,
        signature_data: signer.signature_data_url // Use the correct field name
      };
    }) : [];

    console.log('Document fetched successfully');
    console.log('Title:', doc.title);
    console.log('Content length:', doc.content.length);
    console.log('Number of signers:', signers.length);

    const pdfBytes = await generatePDF({
      title: doc.title,
      content: doc.content,
      blockchain_hash: doc.blockchain_hash,
      signers
    });

    if (!pdfBytes || pdfBytes.length === 0) {
      throw new Error('Generated PDF is empty');
    }

    console.log('Creating response...');
    console.log('PDF size:', pdfBytes.length, 'bytes');
    const filename = `${doc.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;

    try {
      // Convert Uint8Array to Base64 using Deno's encoder
      const base64Data = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));
      console.log('Base64 conversion successful. Length:', base64Data.length);
      
      return new Response(
        JSON.stringify({ 
          data: base64Data,
          filename: filename
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (encodeError) {
      console.error('Error encoding PDF to base64:', encodeError);
      throw new Error('Failed to encode PDF data');
    }

  } catch (error) {
    console.error('Error in request handler:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});