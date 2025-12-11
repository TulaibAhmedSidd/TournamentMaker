import { NextResponse } from 'next/server';

/**
 * Middleware to disable caching for all admin API endpoints.
 * This prevents the Vercel CDN and browsers from returning a 304 Not Modified
 * response when fetching volatile data like match lists.
 */
export function middleware(request) {
  // We use NextResponse.next() to allow the request to proceed to the handler.
  const response = NextResponse.next();

  // Set Cache-Control headers to completely disable caching.
  // 'no-store, no-cache' is the critical part to prevent 304 responses on volatile data.
  response.headers.set(
    'Cache-Control', 
    'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
  );
  
  return response;
}

// Configuration to specify which paths the middleware should run on.
// This ensures it only runs on your admin API routes: /api/admin/match, /api/admin/game, etc.
export const config = {
  matcher: [
    '/api/admin/:path*',
  ],
};