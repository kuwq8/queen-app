import { API_URL } from '@/lib/api';
import { Metadata } from 'next';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    
    // Import dynamically so it doesn't cause client-side bundling issues in layout
    const { createClient } = await import('@/utils/supabase/server');
    const supabase = await createClient();
    
    const { data: server, error } = await supabase
      .from('channels')
      .select('name, is_private')
      .eq('slug', slug)
      .single();

    if (error || !server) {
      return {
        title: 'شات غير معروف',
        description: 'هذا الشات غير موجود.',
        robots: { index: false, follow: false },
      };
    }

    if (server.is_private) {
      return {
        title: `شات ${server.name} - شات خاص`,
        description: `انضم إلى شات ${server.name} الخاص على منصة Gemini Social.`,
        robots: { index: false, follow: false },
      };
    }

    return {
      title: `شات ${server.name} - شات كل العرب`,
      description: `مرحباً بك في شات ${server.name}، انضم الآن للدردشة وتكوين صداقات جديدة.`,
      keywords: `شات, دردشة, تعارف, ${server.name}, شات عربي, شات كتابي, شات جوال`,
      robots: { index: true, follow: true },
      openGraph: {
        title: `شات ${server.name} - شات كل العرب`,
        description: `أفضل شات عربي للتعارف والدردشة المجانية في ${server.name}.`,
        type: 'website',
      },
    };
  } catch (error) {
    return {
      title: 'شات - خطأ',
    };
  }
}

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
