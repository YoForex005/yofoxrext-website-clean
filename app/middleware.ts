import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Note: Import directly from server files - Next.js middleware runs in Edge runtime
// We'll fetch controls via API instead
async function getPageControls(request: NextRequest): Promise<any[] | null> {
  try {
    // Use request URL to construct API endpoint (works in all environments)
    const apiUrl = new URL('/api/public/page-controls', request.url);
    const response = await fetch(apiUrl, {
      next: { revalidate: 60 }, // Use Next.js cache with 60s revalidation
    });
    
    if (!response.ok) {
      console.error('[Middleware] Failed to fetch page controls:', response.statusText);
      return null; // Fail closed - will trigger fail-safe behavior
    }
    
    return await response.json();
  } catch (error) {
    console.error('[Middleware] Error fetching page controls - failing closed:', error);
    return null; // Fail closed - will trigger fail-safe behavior
  }
}

function matchRoute(pathname: string, controls: any[]) {
  for (const control of controls) {
    if (control.status === 'live') continue;

    const pattern = control.routePattern;

    // Exact match
    if (pattern === pathname) return control;

    // Wildcard match: /admin/* matches /admin/users
    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -2);
      if (pathname.startsWith(prefix + '/')) return control;
    }

    // Prefix match: /discussions* matches /discussions, /discussions/new
    if (pattern.endsWith('*') && !pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -1);
      if (pathname.startsWith(prefix)) return control;
    }
  }

  return null;
}

async function checkCategoryRedirect(pathname: string, request: NextRequest): Promise<NextResponse | null> {
  try {
    const apiUrl = new URL('/api/public/category-redirect', request.url);
    apiUrl.searchParams.set('path', pathname);
    const response = await fetch(apiUrl, {
      next: { revalidate: 300 }, // Cache redirects for 5 minutes
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.redirect) {
        console.log(`[Middleware] Redirecting ${pathname} to ${data.newUrl}`);
        return NextResponse.redirect(new URL(data.newUrl, request.url), data.type === 301 ? 301 : 302);
      }
    }
  } catch (error) {
    console.error('[Middleware] Error checking redirects:', error);
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for specific paths
  if (
    pathname.startsWith('/_next') || // Next.js internals
    pathname.startsWith('/api') || // API routes
    pathname.startsWith('/static') || // Static files
    pathname === '/coming-soon' || // Don't redirect coming-soon page itself
    pathname === '/maintenance' || // Don't redirect maintenance page itself
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2|ttf|eot|webp|gif)$/) // File extensions
  ) {
    return NextResponse.next();
  }

  // Check for category redirects first
  const redirectResponse = await checkCategoryRedirect(pathname, request);
  if (redirectResponse) {
    return redirectResponse;
  }

  // Fetch page controls
  const controls = await getPageControls(request);
  
  // Fail-safe: If controls cannot be fetched, show maintenance page (fail closed)
  if (controls === null) {
    console.log(`[Middleware] Failed to fetch controls - showing maintenance page for ${pathname}`);
    const url = request.nextUrl.clone();
    url.pathname = '/maintenance';
    
    const response = NextResponse.rewrite(url);
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    response.headers.set('Retry-After', '300'); // 5 minutes
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    return response;
  }
  
  const control = matchRoute(pathname, controls);

  if (!control) {
    return NextResponse.next(); // No control, page is live
  }

  // Check admin bypass cookie (optional)
  const isAdmin = request.cookies.get('admin_bypass')?.value === 'true';
  if (isAdmin && control.metadata?.allowAdminBypass) {
    console.log(`[Middleware] Admin bypass enabled for ${pathname}`);
    return NextResponse.next();
  }

  // Redirect to coming soon page
  if (control.status === 'coming_soon') {
    console.log(`[Middleware] Redirecting ${pathname} to coming-soon`);
    const url = request.nextUrl.clone();
    url.pathname = '/coming-soon';
    
    return NextResponse.rewrite(url, {
      headers: {
        'X-Robots-Tag': 'noindex, nofollow',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }

  // Redirect to maintenance page
  if (control.status === 'maintenance') {
    console.log(`[Middleware] Redirecting ${pathname} to maintenance`);
    const url = request.nextUrl.clone();
    url.pathname = '/maintenance';
    
    const response = NextResponse.rewrite(url);
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    response.headers.set('Retry-After', '3600'); // 1 hour
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    // Note: Cannot set status to 503 with rewrite, but headers will indicate maintenance
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};
