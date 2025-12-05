import { NextResponse } from 'next/server';

// POST /api/admin/logout - Clears the HttpOnly 'token' cookie
export async function POST() {
    // 1. Prepare the response object
    const response = NextResponse.json({ 
        success: true, 
        message: 'Logged out successfully.' 
    });

    // 2. Clear the 'token' cookie by setting its Max-Age to 0 (immediate expiry)
    // The browser will delete the cookie on receiving this header.
    const cookieOptions = [
        `token=deleted`,
        `Max-Age=0`, // Set expiry to 0 seconds
        'Path=/',
        'HttpOnly',
        'SameSite=Lax',
        // 'Secure' // Uncomment in production
    ].join('; ');

    response.headers.set('Set-Cookie', cookieOptions);

    return response;
}