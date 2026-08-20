import { Metadata, ResolvingMetadata } from 'next';
import ClientPage from './ClientPage';
import { createClient } from '@supabase/supabase-js';



type Props = {
  params: { id: string }
};

export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const resolvedParams = await params;
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
  
  let title = 'Gemini Social';
  let description = 'شبكة تواصل اجتماعية متكاملة';
  let imageUrl = '/icon-512x512.png';

  try {
    
    const { data: post } = await supabase
      .from('posts')
      .select('content, media_url, author:profiles!posts_user_id_fkey(username, first_name)')
      .eq('id', resolvedParams.id)
      .single();
      
    if (post) {
      const authorName = (post.author as any)?.first_name || (post.author as any)?.username;
      title = `${authorName} on Gemini Social`;
      description = post.content ? (post.content.substring(0, 100) + (post.content.length > 100 ? '...' : '')) : 'صورة/مقطع';
      if (post.media_url) imageUrl = post.media_url;
    }
    
  } catch(e) {
    console.error('Error generating metadata:', e);
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [imageUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    }
  };
}

export default function Page({ params }: Props) {
  return <ClientPage />;
}
