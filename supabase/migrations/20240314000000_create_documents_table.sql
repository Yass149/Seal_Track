-- Create documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'completed', 'rejected')),
    signers JSONB NOT NULL DEFAULT '[]'::JSONB,
    signatures JSONB NOT NULL DEFAULT '{}'::JSONB,
    file_url TEXT,
    blockchain_hash TEXT,
    is_authentic BOOLEAN,
    template_id UUID,
    category TEXT NOT NULL CHECK (category IN ('contract', 'nda', 'agreement', 'other'))
);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their documents" ON documents;
DROP POLICY IF EXISTS "Users can create documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;

-- Create new policies
CREATE POLICY "Enable read access for authenticated users"
    ON documents FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert access for authenticated users"
    ON documents FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update access for document owners"
    ON documents FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by);

CREATE POLICY "Enable delete access for document owners"
    ON documents FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);

-- Grant necessary privileges
GRANT ALL ON documents TO authenticated; 