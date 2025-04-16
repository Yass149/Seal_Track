-- Drop existing triggers and functions first with CASCADE
DROP TRIGGER IF EXISTS on_message_update_contact ON public.messages;
DROP FUNCTION IF EXISTS public.update_contact_last_message() CASCADE;

-- Drop and recreate the contacts table to ensure clean state
DROP TABLE IF EXISTS public.contacts CASCADE;

-- Create contacts table
CREATE TABLE public.contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    contact_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    wallet_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ,
    UNIQUE(user_id, contact_id),
    CONSTRAINT contacts_no_self_reference CHECK (user_id != contact_id)
);

-- Add indexes for better query performance
CREATE INDEX idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX idx_contacts_contact_id ON public.contacts(contact_id);
CREATE INDEX idx_contacts_email ON public.contacts(email);

-- Enable Row Level Security
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Create policies for contact access
CREATE POLICY "Users can view their own contacts" ON public.contacts
    FOR SELECT TO authenticated
    USING (auth.uid() IN (user_id, contact_id));

CREATE POLICY "Users can insert their own contacts" ON public.contacts
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts" ON public.contacts
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts" ON public.contacts
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Function to update last_message_at when a new message is sent
CREATE OR REPLACE FUNCTION public.update_contact_last_message()
RETURNS TRIGGER AS $$
BEGIN
    -- Update last_message_at for both sender and receiver's contact entries
    UPDATE public.contacts
    SET last_message_at = NOW()
    WHERE (user_id = NEW.sender_id AND contact_id = NEW.receiver_id)
       OR (user_id = NEW.receiver_id AND contact_id = NEW.sender_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updating last_message_at
CREATE TRIGGER on_message_update_contact
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_contact_last_message();

-- Enable real-time subscriptions for contacts
ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts; 