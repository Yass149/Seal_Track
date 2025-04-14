-- Create user_template_modifications table
CREATE TABLE IF NOT EXISTS user_template_modifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    title TEXT,
    description TEXT,
    content TEXT,
    category TEXT CHECK (category IN ('contract', 'nda', 'agreement', 'other')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, template_id)
);

-- Enable RLS
ALTER TABLE user_template_modifications ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own modifications
CREATE POLICY "Users can read their own template modifications"
ON user_template_modifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own modifications
CREATE POLICY "Users can insert their own template modifications"
ON user_template_modifications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own modifications
CREATE POLICY "Users can update their own template modifications"
ON user_template_modifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to delete their own modifications
CREATE POLICY "Users can delete their own template modifications"
ON user_template_modifications FOR DELETE
TO authenticated
USING (auth.uid() = user_id); 