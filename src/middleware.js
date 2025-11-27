/**
 * Vercel Edge Middleware - Basic Authentication
 * 
 * USAGE:
 * - Set environment variables in Vercel dashboard:
 *   BASIC_AUTH_USER=admin
 *   BASIC_AUTH_PASSWORD=Qaz1071
 * 
 * - Or use default credentials if env vars not set
 */

export const config = {
  matcher: '/:path*',
};

export default function middleware(request) {
  const basicAuth = request.headers.get('authorization');
  const url = request.url;

  // Get credentials from environment variables or use defaults
  const expectedUser = process.env.BASIC_AUTH_USER || 'admin';
  const expectedPassword = process.env.BASIC_AUTH_PASSWORD || 'Qaz1071';

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    try {
      const [user, pwd] = atob(authValue).split(':');

      if (user === expectedUser && pwd === expectedPassword) {
        // Authentication successful - allow request
        return Response.next();
      }
    } catch (error) {
      // Invalid base64 or malformed auth header
      console.error('Auth parsing error:', error);
    }
  }

  // Authentication failed or not provided - request credentials
  return new Response('Authentication Required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Oxivo - Secure Area", charset="UTF-8"',
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
