import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { messageId } = await req.json();

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. Fetch message details to ensure it is view once and get the media_url
    // We only need the message details. The RPC claim checks if the user is authorized indirectly,
    // but we can enforce it here by checking if the user is a channel member
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .select('*, channels!inner(*)')
      .eq('id', messageId)
      .single();

    if (msgError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (!message.is_view_once || !message.media_url) {
      return NextResponse.json({ error: 'Not a view once media message' }, { status: 400 });
    }

    let filePath = message.media_url;

    // 2. Claim the view atomically via RPC
    const { data: claimSuccess, error: claimError } = await supabase.rpc('claim_view_once_media', { msg_id: messageId });

    if (claimError || !claimSuccess) {
      return NextResponse.json({ error: 'Media has already been viewed or claim failed' }, { status: 403 });
    }

    // 3. Generate Signed URL using Service Role key
    // We assume the service role key is in the environment
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey!
    );

    // Generate a 60-second signed URL
    const { data: signedData, error: signedError } = await supabaseAdmin
      .storage
      .from('private_media')
      .createSignedUrl(filePath, 60);

    if (signedError || !signedData) {
       console.error("Signed URL error:", signedError);
       return NextResponse.json({ error: 'Failed to generate access URL' }, { status: 500 });
    }

    return NextResponse.json({ url: signedData.signedUrl });

  } catch (err: any) {
    console.error('View once error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
