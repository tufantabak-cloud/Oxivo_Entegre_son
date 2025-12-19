/**
 * Vercel Edge Middleware - Basic Authentication
 * For Vite/React apps
 */

export default function middleware(req) {
  const basicAuth = req.headers.get('authorization');

  // Credentials from environment variables
  const expectedUser = process.env.BASIC_AUTH_USER || 'admin';
  const expectedPassword = process.env.BASIC_AUTH_PASSWORD || 'Qaz1071';

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    if (authValue) {
      try {
        const [user, pwd] = atob(authValue).split(':');

        if (user === expectedUser && pwd === expectedPassword) {
          // Auth successful
          return;
        }
      } catch (e) {
        // Invalid auth format
      }
    }
  }

  // Request authentication
  return new Response('Authentication Required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}

export const config = {
  matcher: '/:path*',
};
