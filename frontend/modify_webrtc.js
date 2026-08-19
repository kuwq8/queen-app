const fs = require('fs');
const path = require('path');

function replaceAll(str, find, replace) {
  return str.split(find).join(replace);
}

// 1. Update CallManager.tsx
const callManagerPath = path.join(__dirname, 'src', 'components', 'CallManager.tsx');
let callManagerCode = fs.readFileSync(callManagerPath, 'utf8');

callManagerCode = callManagerCode.replace(
  "channel = supabase.channel(`user-calls:${session.user.id}`);",
  `channel = supabase.channel('system-calls');`
);

callManagerCode = callManagerCode.replace(
  "channel.on('broadcast', { event: 'call-offer' }, (payload: any) => {",
  `channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'calls', filter: 'receiver_id=eq.'+session.user.id }, async (payload: any) => {
          if (payload.new && payload.new.status === 'ringing') {
            const call = payload.new;
            // Fetch caller info
            const { data: caller } = await supabase.from('profiles').select('username, avatar_url').eq('id', call.caller_id).single();
            const fakePayload = {
              call_id: call.id,
              caller_id: call.caller_id,
              caller_name: caller?.username || 'مستخدم',
              caller_avatar: caller?.avatar_url || null,
              call_type: call.call_type
            };
            payload.payload = fakePayload; // mock it for existing logic
`
);

callManagerCode = callManagerCode.replace(
  "channel.on('broadcast', { event: 'call-canceled' }, (payload: any) => {",
  `channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'calls', filter: 'receiver_id=eq.'+session.user.id }, (payload: any) => {
          if (payload.new && (payload.new.status === 'ended' || payload.new.status === 'rejected' || payload.new.status === 'missed')) {
            payload.payload = { call_id: payload.new.id };
`
);

// Remove the manual reject broadcast
callManagerCode = callManagerCode.replace(
  `      // Notify caller
      await supabase.channel(\`user-calls:\${incomingCall.caller_id}\`).send({
        type: 'broadcast',
        event: 'call-rejected',
        payload: { call_id: incomingCall.call_id }
      });`,
  `// Handled by calls table UPDATE status`
);

fs.writeFileSync(callManagerPath, callManagerCode);

// 2. Update messages/[id]/page.tsx
const msgPagePath = path.join(__dirname, 'src', 'app', 'messages', '[id]', 'page.tsx');
let msgCode = fs.readFileSync(msgPagePath, 'utf8');

const oldBroadcast = `        // 2. Broadcast call-offer to receiver
        const channel = supabase.channel(\`user-calls:\${otherUser.id}\`);
        
        // Fetch my profile info to send in the payload
        const { data: myProfile } = await supabase.from('profiles').select('username, avatar_url').eq('id', currentUserId).single();
        
        await channel.send({
          type: 'broadcast',
          event: 'call-offer',
          payload: {
            call_id: call.id,
            caller_id: currentUserId,
            caller_name: myProfile?.username || 'مستخدم',
            caller_avatar: myProfile?.avatar_url || null,
            call_type: type
          }
        });`;

msgCode = msgCode.replace(oldBroadcast, `        // Realtime signaling is now securely handled by postgres_changes on the calls table insert.`);

fs.writeFileSync(msgPagePath, msgCode);

// 3. Update call/[id]/page.tsx
const callRoomPath = path.join(__dirname, 'src', 'app', 'call', '[id]', 'page.tsx');
let callRoomCode = fs.readFileSync(callRoomPath, 'utf8');

// Replace channel logic with postgres_changes on call_signals
callRoomCode = callRoomCode.replace(
  `      // Setup Signaling Channel
      const channel = supabase.channel(\`call-\${callId}\`);
      channelRef.current = channel;

      channel.on('broadcast', { event: 'receiver-ready' }, async () => {`,
  `      // Setup Secure Signaling Channel via call_signals table
      const channel = supabase.channel(\`signals-\${callId}\`);
      
      // Override send method to write to DB instead of open broadcast
      channelRef.current = {
        send: async (msg: any) => {
          await supabase.from('call_signals').insert({
            call_id: callId,
            sender_id: session.user.id,
            receiver_id: isCaller ? call.receiver_id : call.caller_id,
            event: msg.event,
            payload: msg.payload
          });
        }
      };

      channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'call_signals', filter: 'call_id=eq.'+callId }, async (payload: any) => {
        const msg = payload.new;
        if (msg.sender_id === session.user.id) return; // ignore my own
        
        if (msg.event === 'receiver-ready') {`
);

// Now fix the rest of the event handlers
callRoomCode = callRoomCode.replace(
  `      channel.on('broadcast', { event: 'offer' }, async (payload: any) => {`,
  `        } else if (msg.event === 'offer') {
          const payload = { payload: msg.payload };`
);

callRoomCode = callRoomCode.replace(
  `      channel.on('broadcast', { event: 'answer' }, async (payload: any) => {`,
  `        } else if (msg.event === 'answer') {
          const payload = { payload: msg.payload };`
);

callRoomCode = callRoomCode.replace(
  `      channel.on('broadcast', { event: 'ice-candidate' }, async (payload: any) => {`,
  `        } else if (msg.event === 'ice-candidate') {
          const payload = { payload: msg.payload };`
);

callRoomCode = callRoomCode.replace(
  `      channel.on('broadcast', { event: 'call-ended' }, () => {`,
  `        } else if (msg.event === 'call-ended') {`
);

// Close the big postgres_changes block before subscribe
callRoomCode = callRoomCode.replace(
  `      channel.subscribe(async (status: string) => {`,
  `        }
      });

      channel.subscribe(async (status: string) => {`
);

// Fix call-ended alert logic (it had no payload before)
callRoomCode = callRoomCode.replace(
  `        } else if (msg.event === 'call-ended') {
        alert('تم إنهاء المكالمة من الطرف الآخر.');`,
  `        } else if (msg.event === 'call-ended') {
          alert('تم إنهاء المكالمة من الطرف الآخر.');`
);

fs.writeFileSync(callRoomPath, callRoomCode);

console.log('WebRTC Architecture updated to use Secure DB Signaling.');
