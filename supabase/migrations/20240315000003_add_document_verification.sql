-- Add verification fields to documents table
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS document_hash TEXT,
ADD COLUMN IF NOT EXISTS signature_hashes JSONB DEFAULT '{}'::JSONB,
ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;

-- Create a function to calculate document hash
CREATE OR REPLACE FUNCTION calculate_document_hash(
    doc_content TEXT,
    doc_title TEXT,
    doc_description TEXT,
    doc_created_at TIMESTAMPTZ,
    doc_created_by UUID,
    doc_signers JSONB
) RETURNS TEXT AS $$
DECLARE
    combined_content TEXT;
BEGIN
    -- Combine all relevant document data
    combined_content := doc_content || 
                       doc_title || 
                       COALESCE(doc_description, '') || 
                       doc_created_at::TEXT || 
                       doc_created_by::TEXT || 
                       doc_signers::TEXT;
    
    -- Return SHA-256 hash of the combined content
    RETURN encode(sha256(combined_content::bytea), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a trigger to automatically update document_hash
CREATE OR REPLACE FUNCTION update_document_hash()
RETURNS TRIGGER AS $$
BEGIN
    NEW.document_hash := calculate_document_hash(
        NEW.content,
        NEW.title,
        NEW.description,
        NEW.created_at,
        NEW.created_by,
        NEW.signers
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_document_hash_trigger
    BEFORE INSERT OR UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_document_hash();

-- Create a function to verify document integrity
CREATE OR REPLACE FUNCTION verify_document(doc_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    doc documents;
    calculated_hash TEXT;
BEGIN
    -- Get the document
    SELECT * INTO doc FROM documents WHERE id = doc_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Calculate the current hash
    calculated_hash := calculate_document_hash(
        doc.content,
        doc.title,
        doc.description,
        doc.created_at,
        doc.created_by,
        doc.signers
    );
    
    -- Update last verified timestamp
    UPDATE documents 
    SET last_verified_at = NOW() 
    WHERE id = doc_id;
    
    -- Return true if the stored hash matches the calculated hash
    RETURN doc.document_hash = calculated_hash;
END;
$$ LANGUAGE plpgsql; 