'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface FollowButtonProps {
  targetUserId: string;
  initialIsFollowing: boolean;
  initialFollowStatus?: string; // 'none' | 'pending' | 'accepted'
  onToggle?: (isFollowing: boolean, status: string) => void;
  className?: string;
}

export default function FollowButton({ targetUserId, initialIsFollowing, initialFollowStatus = 'none', onToggle, className = '' }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followStatus, setFollowStatus] = useState(initialFollowStatus);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setIsFollowing(initialIsFollowing);
    setFollowStatus(initialFollowStatus);
  }, [initialIsFollowing, initialFollowStatus]);

  const handleToggleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsLoading(false);
        return;
      }

      if (followStatus === 'accepted' || followStatus === 'pending') {
        // Unfollow or Cancel Request
        const { error } = await supabase
          .from('follows')
          .delete()
          .match({ follower_id: session.user.id, following_id: targetUserId });
          
        if (error) throw error;
        setIsFollowing(false);
        setFollowStatus('none');
        if (onToggle) onToggle(false, 'none');
      } else {
        // Follow or Request
        const { error, data } = await supabase
          .from('follows')
          .insert({ follower_id: session.user.id, following_id: targetUserId })
          .select()
          .single();
          
        if (error) throw error;
        const newStatus = data.status;
        setIsFollowing(newStatus === 'accepted');
        setFollowStatus(newStatus);
        if (onToggle) onToggle(newStatus === 'accepted', newStatus);
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (followStatus === 'pending') {
    return (
      <button
        onClick={handleToggleFollow}
        disabled={isLoading}
        className={`group font-bold text-[15px] px-4 py-1.5 rounded-full transition-colors border border-slate-500 bg-transparent text-white hover:border-red-500 hover:text-red-500 hover:bg-red-500/10 min-w-[110px] ${className}`}
      >
        <span className="hidden group-hover:inline">إلغاء الطلب</span>
        <span className="inline group-hover:hidden">مطلوب</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleToggleFollow}
      disabled={isLoading}
      className={`group font-bold text-[15px] px-4 py-1.5 rounded-full transition-colors ${
        followStatus === 'accepted' || isFollowing
          ? 'bg-transparent text-white border border-slate-500 hover:border-red-500 hover:text-red-500 hover:bg-red-500/10 min-w-[110px]'
          : 'bg-white text-black hover:bg-slate-200'
      } ${className}`}
    >
      <span className={followStatus === 'accepted' || isFollowing ? 'hidden group-hover:inline' : 'inline'}>
        {(followStatus === 'accepted' || isFollowing) ? 'إلغاء المتابعة' : 'متابعة'}
      </span>
      <span className={followStatus === 'accepted' || isFollowing ? 'inline group-hover:hidden' : 'hidden'}>
        متابَع
      </span>
    </button>
  );
}
