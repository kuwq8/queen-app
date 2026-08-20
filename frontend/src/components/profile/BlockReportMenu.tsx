'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, ShieldAlert, Ban } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function BlockReportMenu({ targetUserId, targetUsername, isBlocked: initialBlocked }: { targetUserId: string, targetUsername: string, isBlocked?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(initialBlocked || false);
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Check initial block status if not provided
    const checkBlock = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.from('blocks').select('*').eq('blocker_id', session.user.id).eq('blocked_id', targetUserId).maybeSingle();
      if (data) setIsBlocked(true);
    };
    if (initialBlocked === undefined) checkBlock();
  }, [targetUserId]);

  const handleBlockToggle = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    if (isBlocked) {
      await supabase.from('blocks').delete().eq('blocker_id', session.user.id).eq('blocked_id', targetUserId);
      setIsBlocked(false);
      alert('تم إزالة الحظر. يرجى تحديث الصفحة.');
    } else {
      const confirm = window.confirm(`هل أنت متأكد من حظر @${targetUsername}؟ لن تتمكن من رؤية منشوراته أو التواصل معه.`);
      if (confirm) {
        await supabase.from('blocks').insert({ blocker_id: session.user.id, blocked_id: targetUserId });
        setIsBlocked(true);
        alert('تم الحظر بنجاح. يرجى تحديث الصفحة.');
      }
    }
    setIsOpen(false);
  };

  const handleReport = async () => {
    if (!reportReason.trim()) {
      alert('يرجى كتابة سبب الإبلاغ');
      return;
    }
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase.from('reports').insert({
      reporter_id: session.user.id,
      reported_id: targetUserId,
      reason: reportReason
    });
    alert('تم إرسال البلاغ بنجاح. شكراً لك.');
    setIsReporting(false);
    setReportReason('');
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full border border-slate-600 flex items-center justify-center text-white hover:bg-slate-800 transition-colors"
      >
        <MoreHorizontal size={18} />
      </button>

      {isOpen && !isReporting && (
        <div className="absolute top-12 right-0 w-48 bg-[#111] border border-slate-800 rounded-xl shadow-2xl py-2 z-50">
          <button 
            onClick={handleBlockToggle}
            className="w-full text-right px-4 py-2 hover:bg-slate-800 transition-colors text-red-500 font-bold flex items-center gap-2"
          >
            <Ban size={16} /> {isBlocked ? 'إلغاء الحظر' : `حظر @${targetUsername}`}
          </button>
          <button 
            onClick={() => setIsReporting(true)}
            className="w-full text-right px-4 py-2 hover:bg-slate-800 transition-colors text-slate-300 flex items-center gap-2"
          >
            <ShieldAlert size={16} /> إبلاغ عن الحساب
          </button>
        </div>
      )}

      {isOpen && isReporting && (
        <div className="absolute top-12 right-0 w-64 bg-[#111] border border-slate-800 rounded-xl shadow-2xl p-4 z-50">
          <h4 className="font-bold mb-2">سبب الإبلاغ</h4>
          <textarea 
            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white mb-2"
            rows={3}
            placeholder="اكتب سبب الإبلاغ..."
            value={reportReason}
            onChange={e => setReportReason(e.target.value)}
          />
          <div className="flex gap-2">
            <button onClick={handleReport} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1.5 rounded transition-colors">إرسال</button>
            <button onClick={() => setIsReporting(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-1.5 rounded transition-colors">إلغاء</button>
          </div>
        </div>
      )}
    </div>
  );
}
