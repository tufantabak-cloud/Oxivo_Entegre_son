/**
 * Vercel Edge Middleware - Multi-User Basic Authentication
 * Pure Web Standards API (works with Vite/React)
 * 
 * 🔐 SECURITY BEST PRACTICE:
 * Set these environment variables in Vercel Dashboard to override defaults:
 * 
 * Vercel Dashboard → Settings → Environment Variables:
 * ┌─────────────────────────────────┬───────────────────┬──────────────────────────┐
 * │ Variable Name                   │ Value (Example)   │ Environment              │
 * ├─────────────────────────────────┼───────────────────┼──────────────────────────┤
 * │ BASIC_AUTH_USER                 │ admin             │ Production, Preview, Dev │
 * │ BASIC_AUTH_PASSWORD             │ Qaz1071           │ Production, Preview, Dev │
 * │ BASIC_AUTH_VIEWER_USER          │ viewer            │ Production, Preview, Dev │
 * │ BASIC_AUTH_VIEWER_PASSWORD      │ Viewer2025!       │ Production, Preview, Dev │
 * └─────────────────────────────────┴───────────────────┴──────────────────────────┘
 * 
 * 🎯 DEFAULT USERS (if no environment variables set):
 * 👤 admin / Qaz1071 (Full Access - CRUD)
 * 👁️ viewer / Viewer2025! (Read-Only)
 * 
 * ⚠️ WARNING: Default passwords are for development only!
 *    Set environment variables in production for security.
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
  
  // 🔐 Define users from environment variables (fallback to defaults for development)
  const users = [
    {
      username: process.env.BASIC_AUTH_USER || 'admin',
      password: process.env.BASIC_AUTH_PASSWORD || 'Qaz1071',
      role: 'admin'
    },
    {
      username: process.env.BASIC_AUTH_VIEWER_USER || 'viewer',
      password: process.env.BASIC_AUTH_VIEWER_PASSWORD || 'Viewer2025!',
      role: 'viewer'
    }
  ];

  if (authHeader) {
    try {
      // Parse "Basic <base64>" header
      const base64Credentials = authHeader.split(' ')[1];
      const credentials = atob(base64Credentials);
      const [username, password] = credentials.split(':');

      // Find matching user
      const user = users.find(u => u.username === username && u.password === password);

      if (user) {
        // ✅ Authentication successful - Inject role into response
        const response = new Response(null, {
          headers: {
            'X-User-Role': user.role,
            'X-Username': user.username
          }
        });
        return response;
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