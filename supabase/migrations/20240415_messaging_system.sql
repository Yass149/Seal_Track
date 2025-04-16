-- Drop existing triggers and functions first with CASCADE
DROP TRIGGER IF EXISTS on_new_message_notification ON public.messages;
DROP FUNCTION IF EXISTS public.handle_new_message() CASCADE;
DROP FUNCTION IF EXISTS public.mark_message_read(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_unread_message_count(UUID) CASCADE;

-- Drop and recreate the messages table to ensure clean state
DROP TABLE IF EXISTS public.messages CASCADE;

-- Create messages table
CREATE TABLE public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES auth.users(id) NOT NULL,
    receiver_id UUID REFERENCES auth.users(id) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    document_id UUID REFERENCES public.documents(id),
    message_type TEXT DEFAULT 'text',
    metadata JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT messages_sender_receiver_check CHECK (sender_id != receiver_id)
);

-- Add indexes for better query performance
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for message access
CREATE POLICY "Users can insert messages" ON public.messages
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can read their own messages" ON public.messages
    FOR SELECT TO authenticated
    USING (auth.uid() IN (sender_id, receiver_id));

-- Create function to mark message as read
CREATE OR REPLACE FUNCTION public.mark_message_read(message_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.messages
    SET read_at = NOW()
    WHERE id = message_id
    AND receiver_id = auth.uid()
    AND read_at IS NULL;
END;
$$;

-- Create function to get unread message count
CREATE OR REPLACE FUNCTION public.get_unread_message_count(contact_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO count
    FROM public.messages
    WHERE receiver_id = auth.uid()
    AND sender_id = contact_id
    AND read_at IS NULL
    AND deleted_at IS NULL;
    
    RETURN count;
END;
$$;

-- Create real-time notification function
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.email_notifications (
        user_id,
        type,
        content,
        created_at
    )
    VALUES (
        NEW.receiver_id,
        'new_message',
        json_build_object(
            'message_id', NEW.id,
            'sender_id', NEW.sender_id,
            'content', NEW.content
        ),
        NOW()
    );
    
    RETURN NEW;
END;
$$;

-- Create trigger for new message notifications
CREATE TRIGGER on_new_message_notification
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_message();

-- Enable real-time subscriptions for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages; 