'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export default function CallRoom() {
  const params = useParams();
  const router = useRouter();
  const callId = params.id as string;

  const [callData, setCallData] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [status, setStatus] = useState<string>('Connecting...');
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    initCall();
    return () => {
      endCall(false); // cleanup on unmount
    };
  }, [callId]);

  const initCall = async () => {
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/');
        return;
      }
      setCurrentUser(session.user);

      // Fetch Call Details
      const { data: call } = await supabase
        .from('calls')
        .select('*, caller:profiles!caller_id(*), receiver:profiles!receiver_id(*)')
        .eq('id', callId)
        .single();
      
      if (!call || call.status === 'ended' || call.status === 'rejected') {
        alert('هذه المكالمة غير متاحة أو انتهت.');
        router.push('/messages');
        return;
      }

      setCallData(call);
      const isCaller = session.user.id === call.caller_id;
      const isVideoCall = call.call_type === 'video';

      // Set initial video state
      setIsVideoOff(!isVideoCall);

      // Get User Media
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: isVideoCall,
          audio: true
        });
        localStream.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing media devices.', err);
        setStatus('Error accessing camera/microphone.');
        return;
      }

      // Initialize WebRTC
      peerConnection.current = new RTCPeerConnection(ICE_SERVERS);

      // Add local tracks to peer connection
      localStream.current.getTracks().forEach(track => {
        if (localStream.current && peerConnection.current) {
          peerConnection.current.addTrack(track, localStream.current);
        }
      });

      // Handle incoming tracks
      peerConnection.current.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Handle ICE candidates
      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate && channelRef.current) {
          channelRef.current.send({
            event: 'ice-candidate',
            payload: { candidate: event.candidate, senderId: session.user.id }
          });
        }
      };

      // Setup Secure Signaling Channel via call_signals table
      const channel = supabase.channel(`signals-${callId}`);
      
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
      });

      channel.subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          if (!isCaller) {
            // Tell caller we are ready
            channel.send({
              type: 'broadcast',
              event: 'receiver-ready',
              payload: {}
            });
          } else {
            setStatus('Waiting for receiver...');
          }
        }
      });

    } catch (err) {
      console.error(err);
    }
  };

  const endCall = async (broadcast = true, skipRoute = false) => {
    try {
      if (localStream.current) {
        localStream.current.getTracks().forEach(track => track.stop());
      }
      if (peerConnection.current) {
        peerConnection.current.close();
      }
      if (broadcast && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'call-ended',
          payload: {}
        });
      }
      
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      await supabase.from('calls').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', callId);

      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
      }
      
      if (!skipRoute) {
        router.back();
      }
    } catch(e) {}
  };

  const toggleMute = () => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream.current) {
      const videoTrack = localStream.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  if (!callData) return <div className="min-h-screen bg-black text-white flex items-center justify-center">جاري التحميل...</div>;

  const isCaller = currentUser?.id === callData.caller_id;
  const otherUser = isCaller ? callData.receiver : callData.caller;

  return (
    <div className="min-h-screen flex justify-center bg-black font-sans relative overflow-hidden" dir="rtl">
      {/* Remote Video (Full Screen) */}
      <video 
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className={`w-full h-full object-cover absolute inset-0 ${callData.call_type === 'audio' ? 'hidden' : ''}`}
      />
      
      {/* Audio Placeholder if Video is hidden */}
      {(callData.call_type === 'audio' || isVideoOff) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
           <div className="w-32 h-32 rounded-full bg-slate-800 border-4 border-slate-700 overflow-hidden mb-6 shadow-2xl">
             {otherUser.avatar_url ? (
               <img src={otherUser.avatar_url} alt="User" className="w-full h-full object-cover" />
             ) : (
               <div className="w-full h-full flex items-center justify-center font-bold text-5xl text-slate-400">
                 {otherUser.username?.charAt(0).toUpperCase()}
               </div>
             )}
           </div>
           <h2 className="text-3xl font-bold text-white mb-2">{otherUser.username}</h2>
           <p className="text-slate-400 animate-pulse">{status}</p>
        </div>
      )}

      {/* Local Video (PiP) */}
      <div className={`absolute bottom-32 right-4 w-28 h-40 bg-slate-800 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl z-20 ${callData.call_type === 'audio' ? 'hidden' : ''}`}>
        <video 
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
        />
        {isVideoOff && (
          <div className="w-full h-full flex items-center justify-center bg-slate-900">
            <VideoOff className="text-slate-500" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-0 w-full flex justify-center gap-6 z-30">
        <button 
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-slate-300 text-slate-900' : 'bg-slate-800/80 text-white hover:bg-slate-700 backdrop-blur-md'}`}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>

        <button 
          onClick={() => endCall()}
          className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-transform hover:scale-110 shadow-lg shadow-red-500/30"
        >
          <PhoneOff size={28} />
        </button>

        {callData.call_type === 'video' && (
          <button 
            onClick={toggleVideo}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isVideoOff ? 'bg-slate-300 text-slate-900' : 'bg-slate-800/80 text-white hover:bg-slate-700 backdrop-blur-md'}`}
          >
            {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
          </button>
        )}
      </div>
    </div>
  );
}
