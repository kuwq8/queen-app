import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. favicon.ico)
     */
    '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};

export default function middleware(req: NextRequest) {
  const url = req.nextUrl;
  
  // Get hostname of request (e.g. demo.localhost:3000)
  const hostname = req.headers.get('host') || 'localhost:3000';

  // Define allowed root domains (including localhost for dev)
  // In production, you would add your render.com domain or custom domain here
  const rootDomains = ['localhost:3000', 'gemini-social.onrender.com'];
  
  // Extract the subdomain (if any)
  let currentHost = hostname.replace(`:${url.port}`, '');
  
  // If we are on localhost, remove the root domain to get the subdomain
  // e.g. test.localhost -> test
  // If we are on production, extract subdomain from gemini-social.onrender.com
  let subdomain = '';
  
  if (
    currentHost !== 'localhost' && 
    currentHost !== 'gemini-social.onrender.com' &&
    !currentHost.endsWith('.vercel.app')
  ) {
    if (currentHost.endsWith('.localhost')) {
      subdomain = currentHost.replace('.localhost', '');
    } else if (currentHost.endsWith('.gemini-social.onrender.com')) {
      subdomain = currentHost.replace('.gemini-social.onrender.com', '');
    } else {
      // It might be a completely custom domain! (e.g. www.mycustomchat.com)
      // For now, if it's not our root domains, we can treat the whole host as a custom domain
      subdomain = currentHost; 
    }
  }

  // If there's a valid subdomain and it's not 'www', rewrite to the community page
  if (subdomain && subdomain !== 'www' && subdomain !== 'localhost') {
    // Check if they are trying to access a community directly via path while on a subdomain
    if (url.pathname.startsWith('/c/')) {
       // Prevent /c/slug/c/slug loops
       return NextResponse.next();
    }
    
    // We rewrite everything on the subdomain to be under /c/subdomain/
    // Example: mychat.localhost:3000/chat -> localhost:3000/c/mychat/chat
    // If they hit the root of the subdomain (mychat.localhost:3000/), we should probably map it to /c/mychat/entry or /c/mychat/chat
    // The safest is to rewrite to /c/subdomain and let the app handle it.
    
    // If the path is exactly '/', let's map it to the entry page
    let targetPath = url.pathname;
    if (targetPath === '/') {
       targetPath = '/entry';
    }
    
    return NextResponse.rewrite(new URL(`/c/${subdomain}${targetPath}`, req.url));
  }

  return NextResponse.next();
}
