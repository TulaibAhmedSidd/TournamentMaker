import dbConnect from '@/app/lib/db';
import Match from '@/app/models/Match';
import { NextResponse } from 'next/server';

// GET /api/admin/match - Get all matches that are active or scheduled
export async function GET() {
  await dbConnect();

  try {
    // Find matches that are not yet completed, populate with Game and User details
    const matches = await Match.find({ 
        status: { $in: ['Scheduled', 'In Progress'] } 
    })
    .populate({ 
        path: 'participants', 
        select: 'name email' // Only fetch name and email of players
    })
    .populate({
        path: 'game',
        select: 'name type matchFormat' // Only fetch name and type of game
    })
    .sort({ 'game.scheduledTime': 1, round: 1 }); // Sort by game time and round

    return NextResponse.json({ success: true, data: matches }, { status: 200 });
  } catch (error) {
    console.error("Error fetching active matches:", error);
    return NextResponse.json({ success: false, error: 'Failed to fetch active matches.' }, { status: 500 });
  }
}