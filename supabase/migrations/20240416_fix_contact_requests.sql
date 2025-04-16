-- Add sender_name column if it doesn't exist
ALTER TABLE public.contact_requests 
ADD COLUMN IF NOT EXISTS sender_name TEXT;

-- Update existing rows with sender names from auth.users
UPDATE public.contact_requests cr
SET sender_name = u.raw_user_meta_data->>'full_name'
FROM auth.users u
WHERE cr.sender_id = u.id
AND cr.sender_name IS NULL;

-- Make sender_name not null
ALTER TABLE public.contact_requests 
ALTER COLUMN sender_name SET NOT NULL; 