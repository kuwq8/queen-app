import { Metadata, ResolvingMetadata } from 'next';
import ClientPage from './ClientPage';
import { createClient } from '@supabase/supabase-js';



type Props = {
  params: { id: string }
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
  
  let title = 'Gemini Social';
  let description = 'شبكة تواصل اجتماعية متكاملة';
  let imageUrl = '/icon-512x512.png';

  try {
    
    const { data: comm } = await supabase
      .from('communities')
      .select('name, description, avatar_url')
      .eq('id', params.id)
      .single();
      
    if (comm) {
      title = `${comm.name} - Gemini Social`;
      if (comm.description) description = comm.description;
      if (comm.avatar_url) imageUrl = comm.avatar_url;
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
  return <ClientPage params={params} />;
}
