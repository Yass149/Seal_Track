-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their sent invitations" ON public.invitations;
DROP POLICY IF EXISTS "Users can create invitations" ON public.invitations;

-- Drop existing constraint if it exists
ALTER TABLE IF EXISTS public.invitations 
    DROP CONSTRAINT IF EXISTS invitations_status_check;

-- Create or update invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    UNIQUE(sender_id, email)
);

-- Add or update the status constraint
ALTER TABLE public.invitations 
    ADD CONSTRAINT invitations_status_check 
    CHECK (status IN ('pending', 'sent', 'accepted', 'error'));

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their sent invitations"
    ON public.invitations
    FOR SELECT
    USING (auth.uid() = sender_id);

CREATE POLICY "Users can create invitations"
    ON public.invitations
    FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_invitations_sender_id ON public.invitations(sender_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.invitations TO authenticated;

-- Update any existing rows with invalid status to 'pending'
UPDATE public.invitations 
SET status = 'pending' 
WHERE status NOT IN ('pending', 'sent', 'accepted', 'error'); 