-- Drop existing policies first
DO $$ 
DECLARE
    pol record;
BEGIN
    -- Contact Requests
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'contact_requests' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON contact_requests', pol.policyname);
    END LOOP;

    -- Contacts
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'contacts' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON contacts', pol.policyname);
    END LOOP;

    -- Documents
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'documents' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON documents', pol.policyname);
    END LOOP;

    -- Email Notifications
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'email_notifications' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON email_notifications', pol.policyname);
    END LOOP;

    -- Invitations
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'invitations' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON invitations', pol.policyname);
    END LOOP;

    -- Messages
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'messages' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON messages', pol.policyname);
    END LOOP;

    -- Profiles
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
    END LOOP;

    -- Templates
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'templates' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON templates', pol.policyname);
    END LOOP;

    -- User Template Modifications
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'user_template_modifications' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_template_modifications', pol.policyname);
    END LOOP;
END $$;

-- Contact Requests
ALTER TABLE contact_requests DISABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create requests" ON contact_requests
FOR INSERT TO public
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received requests" ON contact_requests
FOR UPDATE TO public
USING (recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can view their sent and received requests" ON contact_requests
FOR SELECT TO public
USING (auth.uid() = sender_id OR recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Contacts
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can delete their own contacts" ON contacts
FOR DELETE TO public
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contacts" ON contacts
FOR INSERT TO public
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts" ON contacts
FOR UPDATE TO public
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own contacts" ON contacts
FOR SELECT TO public
USING (auth.uid() = user_id);

-- Document Updates
ALTER TABLE document_updates ENABLE ROW LEVEL SECURITY;

-- Documents
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable delete access for document owners" ON documents
FOR DELETE TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Enable insert access for authenticated users" ON documents
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Enable read access for authenticated users" ON documents
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Enable update access for document owners and signers" ON documents
FOR UPDATE TO authenticated
USING (auth.uid() = created_by OR 
       EXISTS (
         SELECT 1 FROM jsonb_array_elements(signers) AS signer
         WHERE (signer->>'id')::uuid = auth.uid()
       ));

CREATE POLICY "Signers can update their signature" ON documents
FOR UPDATE TO public
USING (EXISTS (
  SELECT 1 FROM jsonb_array_elements(signers) AS signer
  WHERE (signer->>'id')::uuid = auth.uid()
));

CREATE POLICY "Users can update their own documents" ON documents
FOR UPDATE TO public
USING (auth.uid() = created_by);

CREATE POLICY "Users can view documents they are signers of" ON documents
FOR SELECT TO public
USING (EXISTS (
  SELECT 1 FROM jsonb_array_elements(signers) AS signer
  WHERE (signer->>'id')::uuid = auth.uid()
));

CREATE POLICY "Users can view their own documents" ON documents
FOR SELECT TO public
USING (auth.uid() = created_by);

-- Email Notifications
ALTER TABLE email_notifications DISABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their email notifications" ON email_notifications
FOR SELECT TO public
USING (auth.uid() = user_id);

-- Invitations
ALTER TABLE invitations DISABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create invitations" ON invitations
FOR INSERT TO public
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can delete their invitations" ON invitations
FOR DELETE TO public
USING (auth.uid() = sender_id);

CREATE POLICY "Users can view their sent invitations" ON invitations
FOR SELECT TO public
USING (auth.uid() = sender_id);

-- Messages
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert messages" ON messages
FOR INSERT TO public
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages" ON messages
FOR UPDATE TO public
USING (auth.uid() = receiver_id);

CREATE POLICY "Users can view their messages" ON messages
FOR SELECT TO public
USING (auth.uid() IN (sender_id, receiver_id));

-- Profiles
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own profile" ON profiles
FOR INSERT TO public
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can select their own profile" ON profiles
FOR SELECT TO public
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
FOR UPDATE TO public
USING (auth.uid() = id);

-- Templates
ALTER TABLE templates DISABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read public templates" ON templates
FOR SELECT TO authenticated
USING (is_public = true);

-- User Template Modifications
ALTER TABLE user_template_modifications DISABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can delete their own template modifications" ON user_template_modifications
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own template modifications" ON user_template_modifications
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own template modifications" ON user_template_modifications
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own template modifications" ON user_template_modifications
FOR UPDATE TO authenticated
USING (auth.uid() = user_id); 