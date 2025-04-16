-- Create a secure view for user data
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
    id,
    email,
    raw_user_meta_data->>'name' as display_name
FROM auth.users;

-- Grant access to the view
GRANT SELECT ON public.user_profiles TO authenticated;

-- Create contact_requests table
CREATE TABLE IF NOT EXISTS public.contact_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    recipient_email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sender_name TEXT NOT NULL,
    UNIQUE(sender_id, recipient_email)
);

-- Enable RLS
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their sent and received requests" ON public.contact_requests;
DROP POLICY IF EXISTS "Users can create requests" ON public.contact_requests;
DROP POLICY IF EXISTS "Users can update their received requests" ON public.contact_requests;

-- Create policies
CREATE POLICY "Users can view their sent and received requests"
    ON public.contact_requests
    FOR SELECT
    USING (
        auth.uid() = sender_id OR 
        recipient_email = (SELECT email FROM public.user_profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can create requests"
    ON public.contact_requests
    FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received requests"
    ON public.contact_requests
    FOR UPDATE
    USING (
        recipient_email = (SELECT email FROM public.user_profiles WHERE id = auth.uid())
    );

-- Create function to handle request creation with sender name
CREATE OR REPLACE FUNCTION create_contact_request(recipient_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_sender_id UUID;
    v_sender_name TEXT;
    v_request_id UUID;
BEGIN
    -- Get sender details from user_profiles
    SELECT id, display_name
    INTO v_sender_id, v_sender_name
    FROM public.user_profiles
    WHERE id = auth.uid();

    IF v_sender_name IS NULL THEN
        RAISE EXCEPTION 'User name is required';
    END IF;

    -- Create request
    INSERT INTO public.contact_requests (sender_id, recipient_email, sender_name)
    VALUES (v_sender_id, recipient_email, v_sender_name)
    RETURNING id INTO v_request_id;

    RETURN v_request_id;
END;
$$;

-- Create trigger to handle request acceptance
CREATE OR REPLACE FUNCTION handle_contact_request_accepted()
RETURNS TRIGGER AS $$
DECLARE
    v_recipient_id UUID;
    v_recipient_name TEXT;
    v_sender_name TEXT;
    v_sender_email TEXT;
BEGIN
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        -- Get recipient details from user_profiles
        SELECT id, display_name
        INTO v_recipient_id, v_recipient_name
        FROM public.user_profiles
        WHERE email = NEW.recipient_email;

        -- Get sender details from user_profiles
        SELECT display_name, email
        INTO v_sender_name, v_sender_email
        FROM public.user_profiles
        WHERE id = NEW.sender_id;

        -- Add contact for the sender
        INSERT INTO public.contacts (user_id, contact_id, name, email)
        VALUES (
            NEW.sender_id,
            v_recipient_id,
            v_recipient_name,
            NEW.recipient_email
        );

        -- Add contact for the recipient
        INSERT INTO public.contacts (user_id, contact_id, name, email)
        VALUES (
            v_recipient_id,
            NEW.sender_id,
            v_sender_name,
            v_sender_email
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_contact_request_accepted ON public.contact_requests;

CREATE TRIGGER on_contact_request_accepted
    AFTER UPDATE ON public.contact_requests
    FOR EACH ROW
    EXECUTE FUNCTION handle_contact_request_accepted();

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_contact_requests_sender_id ON public.contact_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_recipient_email ON public.contact_requests(recipient_email);
CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON public.contact_requests(status);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.contact_requests TO authenticated;
GRANT EXECUTE ON FUNCTION create_contact_request TO authenticated;
GRANT ALL ON public.contacts TO authenticated; 