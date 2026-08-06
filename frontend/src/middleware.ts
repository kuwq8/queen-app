import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from './utils/supabase/middleware';

export const config = {
  matcher: [
    '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || 'localhost:3000';
  
  let currentHost = hostname.replace(`:${url.port}`, '');
  let subdomain = '';
  
  if (
    currentHost !== 'localhost' && 
    !currentHost.endsWith('.vercel.app')
  ) {
    if (currentHost.endsWith('.localhost')) {
      subdomain = currentHost.replace('.localhost', '');
    } else {
      subdomain = currentHost; 
    }
  }

  let response = NextResponse.next();

  if (subdomain && subdomain !== 'www' && subdomain !== 'localhost') {
    if (url.pathname.startsWith('/c/')) {
       // Prevent loop
       response = NextResponse.next();
    } else {
       let targetPath = url.pathname;
       if (targetPath === '/') {
          targetPath = '/entry';
       }
       response = NextResponse.rewrite(new URL(`/c/${subdomain}${targetPath}`, req.url));
    }
  }

  // Ensure session is updated in the cookie
  return await updateSession(req, response);
}
