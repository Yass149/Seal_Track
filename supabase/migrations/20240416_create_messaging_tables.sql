-- Drop existing functions first
DROP FUNCTION IF EXISTS send_message CASCADE;
DROP FUNCTION IF EXISTS create_message_notification CASCADE;

-- Recreate email_notifications table with proper constraints
DROP TABLE IF EXISTS public.email_notifications CASCADE;
CREATE TABLE public.email_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_email TEXT,  -- Made nullable
    subject TEXT,
    content TEXT,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    scheduled_for TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    error TEXT,
    sender_id UUID REFERENCES auth.users(id),
    user_id UUID REFERENCES auth.users(id)
);

-- Enable RLS on email_notifications
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for email_notifications
CREATE POLICY "Users can view their email notifications"
    ON public.email_notifications
    FOR SELECT
    USING (
        auth.uid() = user_id OR 
        auth.uid() = sender_id
    );

-- Ensure messages table exists with proper structure
DROP TABLE IF EXISTS public.messages CASCADE;
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    receiver_id UUID NOT NULL REFERENCES auth.users(id),
    content TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'text',
    metadata JSONB DEFAULT '{}'::jsonb,
    document_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages
CREATE POLICY "Users can view their messages"
    ON public.messages
    FOR SELECT
    USING (
        auth.uid() = sender_id OR 
        auth.uid() = receiver_id
    );

CREATE POLICY "Users can insert messages"
    ON public.messages
    FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id
    );

CREATE POLICY "Users can update their received messages"
    ON public.messages
    FOR UPDATE
    USING (
        auth.uid() = receiver_id
    );

-- Create function to send message
CREATE OR REPLACE FUNCTION send_message(
    p_receiver_id UUID,
    p_content TEXT,
    p_message_type TEXT DEFAULT 'text',
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_document_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_message_id UUID;
BEGIN
    -- Insert message
    INSERT INTO public.messages (
        sender_id,
        receiver_id,
        content,
        message_type,
        metadata,
        document_id
    )
    VALUES (
        auth.uid(),
        p_receiver_id,
        p_content,
        p_message_type,
        p_metadata,
        p_document_id
    )
    RETURNING id INTO v_message_id;

    -- Try to create notification
    BEGIN
        INSERT INTO public.email_notifications (
            recipient_email,
            subject,
            content,
            type,
            metadata,
            sender_id,
            user_id
        )
        SELECT 
            r.email,
            'New message from ' || COALESCE(s.raw_user_meta_data->>'full_name', s.email, 'User'),
            p_content,
            'message',
            jsonb_build_object(
                'message_id', v_message_id,
                'sender_name', COALESCE(s.raw_user_meta_data->>'full_name', s.email, 'User')
            ),
            auth.uid(),
            p_receiver_id
        FROM auth.users r
        JOIN auth.users s ON s.id = auth.uid()
        WHERE r.id = p_receiver_id
        AND r.email IS NOT NULL;
        -- If email is null, no row will be inserted, and that's fine
    EXCEPTION WHEN OTHERS THEN
        -- Log error but continue (don't fail the message send)
        NULL;
    END;

    RETURN v_message_id;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.email_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION send_message TO authenticated;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_document_id ON public.messages(document_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_email_notifications_user_id ON public.email_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_sender_id ON public.email_notifications(sender_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_created_at ON public.email_notifications(created_at); 