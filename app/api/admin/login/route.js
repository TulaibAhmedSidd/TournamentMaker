import dbConnect from '@/app/lib/db';
import User from '@/app/models/User';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// IMPORTANT: Replace this with a strong, complex secret stored in .env for production
const JWT_SECRET = process.env.JWT_SECRET || ''; 

// POST /api/admin/login
export async function POST(request) {
  await dbConnect();

  try {
    const { email, password } = await request.json();

    // 1. Find the user
    const user = await User.findOne({ email }).select('+password'); // Select password field

    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid credentials or user not found.' }, { status: 401 });
    }

    // 2. Check admin status
    if (!user.isAdmin) {
      return NextResponse.json({ success: false, error: 'Access denied. Must be an administrator.' }, { status: 403 });
    }

    // 3. Verify password
    // NOTE: If you are not storing hashed passwords, replace `bcrypt.compare` with simple string comparison: `if (user.password !== password)`
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json({ success: false, error: 'Invalid credentials.' }, { status: 401 });
    }

    // 4. Generate JWT Token
    const token = jwt.sign(
      { userId: user._id, isAdmin: user.isAdmin },
      JWT_SECRET,
      { expiresIn: '1d' } // Token expires in 1 day
    );

    // 5. Set HTTP-Only Cookie and return success
    const response = NextResponse.json({ 
      success: true, 
      message: 'Login successful.',
      user: { id: user._id, email: user.email, name: user.name, isAdmin: user.isAdmin }
    }, { status: 200 });

    // Set the cookie for authentication. HttpOnly prevents client-side JS access.
    // Secure: true should be used in production over HTTPS.
    const cookieOptions = [
      `token=${token}`,
      `Max-Age=${60 * 60 * 24}`, // 1 day
      'Path=/',
      'HttpOnly',
      'SameSite=Lax',
      // 'Secure' // Uncomment in production
    ].join('; ');

    response.headers.set('Set-Cookie', cookieOptions);

    return response;

  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ success: false, error: 'Server error during login.' }, { status: 500 });
  }
}