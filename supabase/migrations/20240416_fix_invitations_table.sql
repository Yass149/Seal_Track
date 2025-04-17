-- Drop existing table and its dependencies
DROP TABLE IF EXISTS public.invitations CASCADE;

-- Create invitations table fresh
CREATE TABLE public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    UNIQUE(sender_id, email),
    CONSTRAINT invitations_status_check CHECK (status IN ('pending', 'sent', 'accepted', 'error', 'expired'))
);

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

CREATE POLICY "Users can delete their invitations"
    ON public.invitations
    FOR DELETE
    USING (auth.uid() = sender_id);

-- Add indexes
CREATE INDEX idx_invitations_sender_id ON public.invitations(sender_id);
CREATE INDEX idx_invitations_email ON public.invitations(email);
CREATE INDEX idx_invitations_status ON public.invitations(status);
CREATE INDEX idx_invitations_expires_at ON public.invitations(expires_at);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.invitations TO authenticated;

-- Create function to clean up expired invitations
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update status to 'expired' for expired invitations
    UPDATE public.invitations
    SET status = 'expired'
    WHERE status IN ('pending', 'sent')
    AND expires_at < NOW();
END;
$$; 