import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJwtToken } from '@/lib/jwt';

// Simple in-memory rate limiting map
// Maps IP to { count, resetTime }
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Rate limit settings
const RATE_LIMIT_MAX = 50; // max requests
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

export async function middleware(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  
  // 1. Rate Limiting for all Admin APIs (DDoS Protection)
  if (request.nextUrl.pathname.startsWith('/api/admin')) {
    const now = Date.now();
    const rateLimitInfo = rateLimitMap.get(ip);
    
    if (rateLimitInfo) {
      if (now > rateLimitInfo.resetTime) {
        // Reset window
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
      } else {
        rateLimitInfo.count++;
        if (rateLimitInfo.count > RATE_LIMIT_MAX) {
          return NextResponse.json(
            { ok: false, error: 'Too many requests. Please try again later.' },
            { status: 429 } // 429 Too Many Requests
          );
        }
      }
    } else {
      rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    }
  }

  // 2. JWT Authentication for protected Admin APIs
  // Skip auth check for the login endpoint itself
  if (request.nextUrl.pathname.startsWith('/api/admin') && !request.nextUrl.pathname.startsWith('/api/admin/auth')) {
    const token = request.cookies.get('admin_token')?.value;

    if (!token) {
      return NextResponse.json({ ok: false, error: 'Unauthorized Access' }, { status: 401 });
    }

    const payload = await verifyJwtToken(token);
    
    if (!payload || !payload.isAdmin) {
      return NextResponse.json({ ok: false, error: 'Invalid or Expired Token' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/admin/:path*'],
};
