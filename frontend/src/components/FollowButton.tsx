'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

interface FollowButtonProps {
  targetUserId: string;
  initialIsFollowing: boolean;
  onToggle?: (isFollowing: boolean) => void;
  className?: string;
}

export default function FollowButton({ targetUserId, initialIsFollowing, onToggle, className = '' }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleToggleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic UI update
    const previousState = isFollowing;
    const newState = !previousState;
    setIsFollowing(newState);
    if (onToggle) onToggle(newState);
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Revert if not logged in
        setIsFollowing(previousState);
        if (onToggle) onToggle(previousState);
        return;
      }

      if (newState) {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: session.user.id, following_id: targetUserId });
          
        if (error) throw error;
      } else {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .match({ follower_id: session.user.id, following_id: targetUserId });
          
        if (error) throw error;
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
      // Revert optimistic update on failure
      setIsFollowing(previousState);
      if (onToggle) onToggle(previousState);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleFollow}
      disabled={isLoading}
      className={`group font-bold text-[15px] px-4 py-1.5 rounded-full transition-colors ${
        isFollowing
          ? 'bg-transparent text-white border border-slate-500 hover:border-red-500 hover:text-red-500 hover:bg-red-500/10 w-[110px]'
          : 'bg-white text-black hover:bg-slate-200'
      } ${className}`}
    >
      <span className={isFollowing ? 'hidden group-hover:inline' : 'inline'}>
        {isFollowing ? 'إلغاء المتابعة' : 'متابعة'}
      </span>
      <span className={isFollowing ? 'inline group-hover:hidden' : 'hidden'}>
        متابَع
      </span>
    </button>
  );
}
