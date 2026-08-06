import { API_URL } from '@/lib/api';
import { Metadata } from 'next';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const res = await fetch(`${API_URL}/community/${slug}`);
    if (!res.ok) {
      return {
        title: 'شات غير معروف',
        description: 'هذا الشات غير موجود.',
      };
    }
    const server = await res.json();

    return {
      title: `شات ${server.name} - شات كل العرب`,
      description: server.description || `مرحباً بك في شات ${server.name}، انضم الآن للدردشة وتكوين صداقات جديدة.`,
      keywords: `شات, دردشة, تعارف, ${server.name}, شات عربي, شات كتابي, شات جوال`,
      openGraph: {
        title: `شات ${server.name} - شات كل العرب`,
        description: server.description || 'أفضل شات عربي للتعارف والدردشة المجانية.',
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
