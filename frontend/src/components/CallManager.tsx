'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, PhoneOff, Video } from 'lucide-react';

export default function CallManager() {
  const router = useRouter();
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    let channel: any = null;

    const setupListener = async () => {
      try {
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) return;
        setCurrentUser(session.user);

        channel = supabase.channel('system-calls');
        
        channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'calls', filter: 'receiver_id=eq.'+session.user.id }, async (payload: any) => {
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
        });

        channel.subscribe();
      } catch (err) {
        console.error('CallManager setup error:', err);
      }
    };

    setupListener();

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, []);

  const handleAccept = async () => {
    if (!incomingCall) return;
    
    // Update DB status to ongoing
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      await supabase.from('calls').update({ status: 'ongoing' }).eq('id', incomingCall.call_id);
    } catch(e) {}

    // Navigate to call room
    router.push(`/call/${incomingCall.call_id}`);
    setIncomingCall(null);
  };

  const handleReject = async () => {
    if (!incomingCall) return;
    
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      await supabase.from('calls').update({ status: 'rejected' }).eq('id', incomingCall.call_id);
      
// Handled by calls table UPDATE status
    } catch(e) {}
    
    setIncomingCall(null);
  };

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300" dir="rtl">
      <div className="bg-[#181824] border border-slate-700 w-full max-w-sm rounded-3xl p-6 flex flex-col items-center shadow-2xl shadow-cyan-500/10">
        
        <div className="w-24 h-24 rounded-full bg-slate-800 border-4 border-slate-700 overflow-hidden mb-4 animate-pulse">
          {incomingCall.caller_avatar ? (
            <img src={incomingCall.caller_avatar} alt="Caller" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-bold text-3xl text-slate-400">
              {incomingCall.caller_name?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <h2 className="text-2xl font-bold text-white mb-1">{incomingCall.caller_name}</h2>
        <p className="text-slate-400 mb-8 flex items-center gap-2">
          {incomingCall.call_type === 'video' ? <Video size={16} /> : <Phone size={16} />}
          مكالمة {incomingCall.call_type === 'video' ? 'فيديو' : 'صوتية'} واردة...
        </p>

        <div className="flex gap-6 w-full justify-center">
          <button 
            onClick={handleReject}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-transform hover:scale-110 shadow-lg shadow-red-500/30"
          >
            <PhoneOff size={28} />
          </button>
          
          <button 
            onClick={handleAccept}
            className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white transition-transform hover:scale-110 shadow-lg shadow-green-500/30 animate-bounce"
          >
            {incomingCall.call_type === 'video' ? <Video size={28} /> : <Phone size={28} />}
          </button>
        </div>

      </div>
      
      {/* Audio Element for ringing sound (optional, assuming we have a file, but we'll leave it simple for now) */}
    </div>
  );
}
