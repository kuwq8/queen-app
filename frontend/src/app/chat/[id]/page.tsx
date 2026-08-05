'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Send, Phone, Video, MoreVertical, Image as ImageIcon } from 'lucide-react';

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const [message, setMessage] = useState('');

  // Mock messages for preview
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hey there! How are you doing?', sender: 'them', time: '10:00 AM' },
    { id: 2, text: 'I am doing great, just working on the new social media app!', sender: 'me', time: '10:05 AM' },
    { id: 3, text: 'That sounds amazing. Let me know when it is ready to test.', sender: 'them', time: '10:10 AM' },
  ]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
    }
  }, [router]);

  const handleSend = () => {
    if (message.trim()) {
      setMessages([...messages, { 
        id: Date.now(), 
        text: message, 
        sender: 'me', 
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
      }]);
      setMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex justify-center selection:bg-cyan-500/30">
      <div className="w-full max-w-[600px] flex flex-col relative border-x border-slate-800 min-h-screen">
        
        {/* Header */}
        <header className="sticky top-0 z-20 bg-black/80 backdrop-blur-md p-3 px-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <button onClick={() => router.back()} className="text-white p-2 -ml-2 rounded-full hover:bg-slate-800 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-lg text-slate-300">
                U
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-white leading-tight">User / Group Name</h2>
                <p className="text-xs text-green-500 font-medium">Online</p>
              </div>
            </div>
          </div>
          <div className="flex space-x-1">
            <button className="text-slate-300 p-2 rounded-full hover:bg-slate-800 transition-colors"><Phone size={18} /></button>
            <button className="text-slate-300 p-2 rounded-full hover:bg-slate-800 transition-colors"><Video size={18} /></button>
            <button className="text-slate-300 p-2 rounded-full hover:bg-slate-800 transition-colors"><MoreVertical size={18} /></button>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col pb-[80px]">
          <div className="text-center text-xs text-slate-500 my-4">Today</div>
          
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-[15px] ${
                msg.sender === 'me' 
                  ? 'bg-cyan-600 text-white rounded-br-sm' 
                  : 'bg-slate-800 text-white rounded-bl-sm'
              }`}>
                <p>{msg.text}</p>
                <div className={`text-[10px] mt-1 text-right ${msg.sender === 'me' ? 'text-cyan-200' : 'text-slate-400'}`}>
                  {msg.time}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="fixed bottom-0 w-full max-w-[600px] bg-black border-t border-slate-800 p-3">
          <div className="flex items-center space-x-2 bg-slate-900 rounded-full px-2 py-1 border border-slate-800 focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500 transition-all">
            <button className="p-2 text-cyan-500 hover:bg-slate-800 rounded-full transition-colors flex-shrink-0">
              <ImageIcon size={20} />
            </button>
            <input 
              type="text" 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Start a new message" 
              className="flex-1 bg-transparent text-white focus:outline-none text-[15px] py-2"
            />
            <button 
              onClick={handleSend}
              disabled={!message.trim()}
              className="p-2 text-white bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-800 disabled:text-slate-500 rounded-full transition-colors flex-shrink-0"
            >
              <Send size={18} className={message.trim() ? "ml-1" : ""} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
