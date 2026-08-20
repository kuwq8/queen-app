import { Metadata, ResolvingMetadata } from 'next';
import ClientPage from './ClientPage';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type Props = {
  params: { username: string }
};

export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const resolvedParams = await params;
  let title = 'Gemini Social';
  let description = 'شبكة تواصل اجتماعية متكاملة';
  let imageUrl = '/icon-512x512.png';

  try {
    
    let username = decodeURIComponent(resolvedParams.username);
    if (username.startsWith('@')) username = username.substring(1);
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, first_name, last_name, bio, avatar_url')
      .eq('username', username)
      .single();
      
    if (profile) {
      title = `${profile.first_name ? profile.first_name + ' ' + (profile.last_name || '') : profile.username} (@${profile.username})`;
      if (profile.bio) description = profile.bio;
      if (profile.avatar_url) imageUrl = profile.avatar_url;
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
