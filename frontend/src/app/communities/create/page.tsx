'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Camera, Users, Shield } from 'lucide-react';
import Link from 'next/link';

export default function CreateCommunityPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCoverPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isLoading) return;
    
    setIsLoading(true);
    // Mock successful creation with delay
    setTimeout(() => {
      router.push('/communities/3');
    }, 1500);
  };

  return (
    <div className="w-full flex flex-col relative pb-[60px] min-h-screen bg-black font-sans text-right">
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-slate-800 p-3 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-slate-700 transition-colors">
            <ChevronRight size={20} />
          </button>
          <h2 className="text-lg font-bold text-white">إنشاء مجتمع جديد</h2>
        </div>
        <button 
          onClick={handleSubmit}
          disabled={!name.trim() || isLoading}
          className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white text-sm font-bold px-4 py-1.5 rounded-full transition-colors flex items-center justify-center min-w-[70px]"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            'إنشاء'
          )}
        </button>
      </header>

      <main className="flex-1 p-4 flex flex-col gap-6 animate-fade-in-up">
        {/* Cover & Avatar Upload Mock */}
        <div className="relative w-full h-32 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-center overflow-visible group">
          <label className="absolute inset-0 z-10 flex flex-col items-center justify-center cursor-pointer bg-black/40 hover:bg-black/60 transition-colors rounded-2xl overflow-hidden">
            <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
            {coverPreview && (
              <img src={coverPreview} className="w-full h-full object-cover absolute inset-0 -z-10" />
            )}
            <Camera className="text-white drop-shadow-md" size={24} />
            <span className="text-white text-xs font-bold mt-2 drop-shadow-md">إضافة غلاف</span>
          </label>
          <label className="absolute -bottom-6 right-4 w-16 h-16 bg-slate-800 rounded-full border-4 border-black z-20 flex items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors overflow-hidden shadow-lg">
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            {avatarPreview ? (
              <img src={avatarPreview} className="w-full h-full object-cover" />
            ) : (
              <Camera className="text-white" size={20} />
            )}
          </label>
        </div>

        <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-slate-300 px-1">اسم المجتمع <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: عشاق القهوة، مبرمجي كويت..."
              className="w-full bg-[#111] border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-slate-300 px-1">نبذة عن المجتمع</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اكتب وصفاً موجزاً يعرّف بمجتمعك واهتماماته..."
              rows={4}
              className="w-full bg-[#111] border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
            />
          </div>

          <div className="flex flex-col gap-3 mt-2 bg-[#111] border border-slate-800 rounded-xl p-4">
            <h3 className="text-sm font-bold text-white mb-1">إعدادات الخصوصية</h3>
            
            <label className="flex items-start gap-3 cursor-pointer group">
              <input type="radio" name="privacy" defaultChecked className="mt-1 accent-cyan-500 w-4 h-4" />
              <div className="flex flex-col">
                <span className="text-white font-bold text-[15px] group-hover:text-cyan-400 transition-colors">عام</span>
                <span className="text-slate-400 text-[13px]">يمكن لأي شخص رؤية المجتمع والمشاركة فيه.</span>
              </div>
            </label>
            
            <div className="h-px bg-slate-800 w-full my-1"></div>
            
            <label className="flex items-start gap-3 cursor-pointer group">
              <input type="radio" name="privacy" className="mt-1 accent-cyan-500 w-4 h-4" />
              <div className="flex flex-col">
                <span className="text-white font-bold text-[15px] group-hover:text-cyan-400 transition-colors">مغلق</span>
                <span className="text-slate-400 text-[13px]">يتطلب الانضمام موافقة مسبقة من المشرفين.</span>
              </div>
            </label>
          </div>
        </form>
      </main>
    </div>
  );
}
