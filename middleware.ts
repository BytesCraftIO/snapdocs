import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default withAuth(
  function middleware(req) {
    // This function is called if the token exists
    // You can access the token via req.nextauth.token
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname
        
        // Allow access to public routes
        const publicRoutes = ['/login', '/signup', '/api/auth', '/', '/demo', '/forgot-password']
        const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
        
        if (isPublicRoute) {
          return true
        }
        
        // Allow access to static files and Next.js internals
        if (pathname.startsWith('/_next') || pathname.startsWith('/api/_next')) {
          return true
        }
        
        // For API routes, check token and return false to trigger 403
        if (pathname.startsWith('/api/')) {
          if (!token) {
            // This will trigger a 403 response for API routes
            return false
          }
          return true
        }
        
        // For protected pages, check if token exists
        if (!token) {
          // For non-API routes, returning false will redirect to login
          return false
        }
        
        return true
      },
    },
    pages: {
      signIn: '/login',
      error: '/login',
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}