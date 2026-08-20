'use client';

import { useRouter } from 'next/navigation';
import FollowButton from '../FollowButton';

interface FollowsModalProps {
  open: boolean;
  type: 'followers' | 'following';
  data: any[];
  loading: boolean;
  onClose: () => void;
}

export default function FollowsModal({ open, type, data, loading, onClose }: FollowsModalProps) {
  const router = useRouter();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-center px-4" onClick={onClose}>
      <div className="bg-[#111] w-full max-w-[400px] h-[500px] rounded-2xl border border-slate-800 p-4 shadow-2xl flex flex-col animate-fade-in-up" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-2">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors">
              <span className="text-xl font-bold px-1">✕</span>
            </button>
            <h2 className="text-lg font-bold text-white">{type === 'followers' ? 'المتابعون' : 'المتابَعون'}</h2>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-full text-slate-500">جاري التحميل...</div>
          ) : data.length === 0 ? (
            <div className="flex justify-center items-center h-full text-slate-500">لا يوجد مستخدمين هنا.</div>
          ) : (
            <div className="space-y-4 pt-2">
              {data.map(user => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => {
                    onClose();
                    router.push(`/${user.username}`);
                  }}>
                    <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-slate-300">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white font-bold text-[15px]">{user.first_name ? `${user.first_name} ${user.last_name||''}` : user.username}</span>
                      <span className="text-slate-500 text-sm">@{user.username}</span>
                    </div>
                  </div>
                  <div onClick={e => e.stopPropagation()}>
                    <FollowButton 
                      targetUserId={user.id} 
                      initialIsFollowing={user.my_follow_status === 'accepted'} 
                      initialFollowStatus={user.my_follow_status}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
