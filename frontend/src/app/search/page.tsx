'use client';


import { API_URL, getToken } from '@/lib/api';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search as SearchIcon, ArrowLeft } from 'lucide-react';
import BottomNav from '../../components/BottomNav';

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/');
    }
  }, [router]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim()) {
        setIsSearching(true);
        const token = getToken();
        try {
          const res = await fetch(`${API_URL}/users/search?q=${encodeURIComponent(query)}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setResults(data);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsSearching(false);
        }
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="min-h-screen bg-black text-white flex justify-center selection:bg-cyan-500/30">
      <div className="w-full max-w-[600px] flex flex-col relative pb-[60px] border-x border-slate-800 min-h-screen">
        
        {/* Header */}
        <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-md p-3 px-4 flex items-center space-x-4">
          <button onClick={() => router.back()} className="text-white p-2 rounded-full hover:bg-slate-800 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <SearchIcon size={18} />
            </div>
            <input 
              type="text"
              placeholder="Search users..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-full py-2 pl-10 pr-4 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-sm"
              autoFocus
            />
          </div>
        </header>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {isSearching && (
            <div className="p-4 text-center text-slate-500 text-sm animate-pulse">Searching...</div>
          )}
          
          {!isSearching && query.trim() !== '' && results.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              <p className="font-bold text-lg text-white mb-2">No results for "{query}"</p>
              <p className="text-sm">Try searching for something else.</p>
            </div>
          )}

          {!isSearching && results.map((user) => (
            <div 
              key={user.id} 
              onClick={() => router.push(`/${user.username}`)}
              className="p-4 border-b border-slate-800 hover:bg-[#111] transition-colors cursor-pointer flex items-center space-x-3"
            >
              <div className="w-12 h-12 rounded-full bg-slate-800 flex-shrink-0 flex items-center justify-center font-bold text-lg text-slate-300 border border-slate-700 overflow-hidden">
                {user.profile?.avatarUrl ? (
                  <img src={user.profile.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  user.username.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white truncate text-[15px] hover:underline">
                  {user.profile?.firstName ? `${user.profile.firstName} ${user.profile.lastName || ''}` : user.username}
                </div>
                <div className="text-slate-500 text-sm truncate">@{user.username}</div>
                {user.profile?.bio && (
                  <p className="text-slate-300 text-sm mt-1 truncate">{user.profile.bio}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <BottomNav activeTab="explore" />
      </div>
    </div>
  );
}
