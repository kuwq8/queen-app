'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Shield, Trash2, Ban, User, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import BottomNav from '../../../components/BottomNav';

export default function AdminReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAndFetchReports();
  }, []);

  const checkAdminAndFetchReports = async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return router.push('/');
      }

      // Very simple admin check: For demo purposes, we will treat 'admin' username as admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', session.user.id)
        .single();
        
      if (!profile || (profile.username !== 'admin' && profile.username !== 'ali')) {
        // Just allowing 'admin' or 'ali' as admins for the demo
        alert('Access Denied. Admins only.');
        return router.push('/');
      }
      
      setIsAdmin(true);

      const { data, error } = await supabase
        .from('reports')
        .select(`
          id,
          reason,
          created_at,
          post_id,
          reporter:profiles!reports_reporter_id_fkey(username, first_name, last_name),
          reported:profiles!reports_reported_id_fkey(id, username, first_name, last_name, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (data) setReports(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePost = async (postId: string, reportId: string) => {
    if (!postId) return alert('No post associated with this report');
    const confirm = window.confirm('هل أنت متأكد من حذف هذا المنشور نهائياً؟');
    if (!confirm) return;

    const supabase = createClient();
    await supabase.from('posts').delete().eq('id', postId);
    await supabase.from('reports').delete().eq('id', reportId); // Dismiss report
    setReports(prev => prev.filter(r => r.id !== reportId));
    alert('تم حذف المنشور وإغلاق البلاغ.');
  };

  const handleBlockUser = async (reportedId: string, reportId: string) => {
    const confirm = window.confirm('هل أنت متأكد من حظر هذا المستخدم نهائياً؟ (هذا سيحذف حسابه أو يمنعه من الدخول)');
    if (!confirm) return;

    const supabase = createClient();
    // Since we don't have service_role key to delete auth.users easily from client, 
    // we can either add a ban flag to profiles or just delete their profile (which cascades and deletes everything).
    await supabase.from('profiles').delete().eq('id', reportedId);
    setReports(prev => prev.filter(r => r.reported?.id !== reportedId));
    alert('تم حذف الحساب بالكامل.');
  };
  
  const handleDismiss = async (reportId: string) => {
    const supabase = createClient();
    await supabase.from('reports').delete().eq('id', reportId);
    setReports(prev => prev.filter(r => r.id !== reportId));
  };

  if (isLoading) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">جاري التحميل...</div>;
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col pb-20" dir="rtl">
      <header className="sticky top-0 z-20 bg-black/80 backdrop-blur-md border-b border-slate-800 p-4 flex items-center justify-between shadow-sm">
        <h1 className="text-xl font-bold flex items-center gap-2 text-red-500">
          <Shield size={24} /> لوحة الإدارة - البلاغات
        </h1>
      </header>
      
      <main className="flex-1 p-4 max-w-4xl mx-auto w-full space-y-4">
        {reports.length === 0 ? (
          <div className="text-center p-12 text-slate-500">
            <AlertTriangle size={48} className="mx-auto mb-4 opacity-50" />
            <p>لا توجد بلاغات حالياً. كل شيء على ما يرام!</p>
          </div>
        ) : (
          reports.map(report => (
            <div key={report.id} className="bg-[#111] border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 text-slate-400 text-sm">
                  <span>من: @{report.reporter?.username}</span>
                  <span>•</span>
                  <span>{new Date(report.created_at).toLocaleDateString('ar-EG')}</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg mb-3">
                  <h4 className="font-bold text-red-400 mb-1">السبب:</h4>
                  <p className="text-sm">{report.reason}</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden">
                    {report.reported?.avatar_url ? (
                      <img src={report.reported.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User size={20} className="m-auto mt-2" />
                    )}
                  </div>
                  <div>
                    <h5 className="font-bold">المُبلغ عنه: @{report.reported?.username}</h5>
                    {report.post_id && (
                      <Link href={`/post/${report.post_id}`} className="text-cyan-500 text-xs hover:underline">
                        عرض المنشور المتعلق بالبلاغ
                      </Link>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-row md:flex-col gap-2 justify-end">
                {report.post_id && (
                  <button onClick={() => handleDeletePost(report.post_id, report.id)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-sm font-bold text-yellow-500 transition-colors">
                    <Trash2 size={16} /> حذف المنشور
                  </button>
                )}
                <button onClick={() => handleBlockUser(report.reported?.id, report.id)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-sm font-bold text-red-500 transition-colors">
                  <Ban size={16} /> إغلاق الحساب
                </button>
                <button onClick={() => handleDismiss(report.id)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-sm font-bold text-slate-400 transition-colors">
                  <Shield size={16} /> تجاهل البلاغ
                </button>
              </div>
            </div>
          ))
        )}
      </main>
      <BottomNav activeTab="home" />
    </div>
  );
}
