const fs = require('fs');

// Fix CallManager.tsx
const callManagerPath = 'src/components/CallManager.tsx';
let callManagerCode = fs.readFileSync(callManagerPath, 'utf8');

const regexCallManager = /channel\.on\('postgres_changes'[\s\S]*?(?=\n\s+channel\.subscribe\(\);)/m;

const newCallManagerInner = `channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'calls', filter: 'receiver_id=eq.'+session.user.id }, async (payload: any) => {
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
            
            if (!incomingCall) {
              setIncomingCall(fakePayload);
              setTimeout(() => {
                setIncomingCall((current: any) => {
                  if (current && current.call_id === fakePayload.call_id) {
                    return null;
                  }
                  return current;
                });
              }, 30000);
            }
          }
        });

        channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'calls', filter: 'receiver_id=eq.'+session.user.id }, (payload: any) => {
          if (payload.new && (payload.new.status === 'ended' || payload.new.status === 'rejected' || payload.new.status === 'missed')) {
            setIncomingCall((current: any) => {
              if (current && current.call_id === payload.new.id) {
                return null;
              }
              return current;
            });
          }
        });`;

callManagerCode = callManagerCode.replace(regexCallManager, newCallManagerInner);
fs.writeFileSync(callManagerPath, callManagerCode);

// Fix call/[id]/page.tsx
const callRoomPath = 'src/app/call/[id]/page.tsx';
let callRoomCode = fs.readFileSync(callRoomPath, 'utf8');

const regexCallRoom = /channel\.on\('postgres_changes', \{ event: 'INSERT'[\s\S]*?(?=\n\s+channel\.subscribe\(async)/m;

const newCallRoomInner = `channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'call_signals', filter: 'call_id=eq.'+callId }, async (payload: any) => {
        const msg = payload.new;
        if (msg.sender_id === session.user.id) return; // ignore my own
        
        if (msg.event === 'receiver-ready') {
          if (isCaller) {
            setStatus('Receiver joined. Negotiating...');
            const offer = await peerConnection.current!.createOffer();
            await peerConnection.current!.setLocalDescription(offer);
            
            channelRef.current.send({
              event: 'offer',
              payload: { offer, senderId: session.user.id }
            });
          }
        } else if (msg.event === 'offer') {
          const fakePayload = { payload: msg.payload };
          if (!isCaller && fakePayload.payload.senderId !== session.user.id) {
            setStatus('Received offer. Sending answer...');
            await peerConnection.current!.setRemoteDescription(new RTCSessionDescription(fakePayload.payload.offer));
            const answer = await peerConnection.current!.createAnswer();
            await peerConnection.current!.setLocalDescription(answer);
            
            channelRef.current.send({
              event: 'answer',
              payload: { answer, senderId: session.user.id }
            });
          }
        } else if (msg.event === 'answer') {
          const fakePayload = { payload: msg.payload };
          if (isCaller && fakePayload.payload.senderId !== session.user.id) {
            setStatus('Connected!');
            await peerConnection.current!.setRemoteDescription(new RTCSessionDescription(fakePayload.payload.answer));
          }
        } else if (msg.event === 'ice-candidate') {
          const fakePayload = { payload: msg.payload };
          if (fakePayload.payload.senderId !== session.user.id && peerConnection.current) {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(fakePayload.payload.candidate));
          }
        } else if (msg.event === 'call-ended') {
          alert('تم إنهاء المكالمة من الطرف الآخر.');
          endCall(false, true);
        }
      });`;

callRoomCode = callRoomCode.replace(regexCallRoom, newCallRoomInner);

// Replace the old channel.send in onicecandidate
callRoomCode = callRoomCode.replace(/channelRef\.current\.send\(\{[\s\S]*?type: 'broadcast',[\s\S]*?event: 'ice-candidate',[\s\S]*?\}\);/m, 
`channelRef.current.send({
            event: 'ice-candidate',
            payload: { candidate: event.candidate, senderId: session.user.id }
          });`);

fs.writeFileSync(callRoomPath, callRoomCode);
