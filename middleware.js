/**
 * Vercel Edge Middleware - Basic Authentication
 * Pure Web Standards API (works with Vite/React)
 * 
 * Environment Variables:
 * - BASIC_AUTH_USER (default: admin)
 * - BASIC_AUTH_PASSWORD (default: Qaz1071)
 */

export const config = {
  matcher: '/:path*',
};

export default function middleware(request) {
  const url = new URL(request.url);
  
  // Skip auth for static assets
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|woff|woff2|ttf|eot)$/i)
  ) {
    return;
  }

  const authHeader = request.headers.get('authorization');
  
  // Credentials from environment (Vercel will inject these)
  const BASIC_USER = process.env.BASIC_AUTH_USER || 'admin';
  const BASIC_PASS = process.env.BASIC_AUTH_PASSWORD || 'Qaz1071';

  if (authHeader) {
    try {
      // Parse "Basic <base64>" header
      const base64Credentials = authHeader.split(' ')[1];
      const credentials = atob(base64Credentials);
      const [username, password] = credentials.split(':');

      // Verify credentials
      if (username === BASIC_USER && password === BASIC_PASS) {
        // ✅ Authentication successful
        return;
      }
    } catch (e) {
      // Invalid auth header format
    }
  }

  // ❌ Request authentication
  return new Response('Authentication Required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}
