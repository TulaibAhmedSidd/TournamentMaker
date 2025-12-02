import dbConnect from '@/app/lib/db';
import User from '@/app/models/User';
import { NextResponse } from 'next/server';

// GET /api/admin/player/list - Get a list of all registered users (players)
export async function GET() {
  await dbConnect();

  try {
    // Fetch all users. You might want to filter out 'isAdmin: true' later,
    // but for a general "player list," fetching all is usually a safe start.
    const players = await User.find({}).select('-password'); // Exclude password field for security

    if (!players || players.length === 0) {
      // If the User collection is empty
      return NextResponse.json({ success: true, players: [], message: 'No players found.' }, { status: 200 });
    }

    // Return the list of players
    return NextResponse.json({ 
      success: true, 
      count: players.length,
      players 
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching player list:", error);
    return NextResponse.json({ success: false, error: 'Server error occurred while fetching players.' }, { status: 500 });
  }
}