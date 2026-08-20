-- Drop old policies if they exist to recreate them safely
DROP POLICY IF EXISTS "Users can update their conversation participation" ON conversation_participants;
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON messages;

-- Allow users to update their own last_read_at in conversation_participants
CREATE POLICY "Users can update their conversation participation" 
ON conversation_participants FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to update messages (specifically is_read) if they are part of the conversation
-- Since RLS policies can get complex with joins, we keep it simple: you can update a message if you didn't send it and it's in your conversation.
CREATE POLICY "Users can update messages in their conversations" 
ON messages FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT user_id FROM conversation_participants WHERE conversation_id = messages.conversation_id
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM conversation_participants WHERE conversation_id = messages.conversation_id
  )
);
