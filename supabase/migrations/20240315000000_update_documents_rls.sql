-- Add updated_at column if it doesn't exist
ALTER TABLE documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON documents;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON documents;
DROP POLICY IF EXISTS "Enable update access for document owners" ON documents;
DROP POLICY IF EXISTS "Enable update access for document owners and signers" ON documents;
DROP POLICY IF EXISTS "Enable delete access for document owners" ON documents;

-- Create new policies
-- Allow all authenticated users to read documents
CREATE POLICY "Enable read access for authenticated users"
    ON documents FOR SELECT
    TO authenticated
    USING (true);

-- Allow all authenticated users to create documents
CREATE POLICY "Enable insert access for authenticated users"
    ON documents FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow document owners and signers to update documents
CREATE POLICY "Enable update access for document owners and signers"
    ON documents FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = created_by OR 
        EXISTS (
            SELECT 1 
            FROM jsonb_array_elements(signers) AS s
            WHERE (s->>'email')::text = auth.jwt() ->> 'email'
        )
    )
    WITH CHECK (
        auth.uid() = created_by OR 
        EXISTS (
            SELECT 1 
            FROM jsonb_array_elements(signers) AS s
            WHERE (s->>'email')::text = auth.jwt() ->> 'email'
        )
    );

-- Allow document owners to delete documents
CREATE POLICY "Enable delete access for document owners"
    ON documents FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by); 