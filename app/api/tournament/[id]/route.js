import dbConnect from '@/app/lib/db';
import Game from '@/app/models/Game';
import Match from '@/app/models/Match';
import { NextResponse } from 'next/server';

// GET /api/tournament/[id] - Get comprehensive data for a single tournament (game and all matches)
export async function GET(request, { params }) {
  await dbConnect();
  const gameId = params.id;

  try {
    const game = await Game.findById(gameId)
        .populate({
            path: 'registeredPlayers',
            select: 'name' // Only need player name for the bracket
        })
        .select('-__v'); // Exclude mongoose internal version key

    if (!game) {
      return NextResponse.json({ success: false, error: 'Tournament not found.' }, { status: 404 });
    }

    // Fetch all matches related to this game, populating participants and sorting by round
    const matches = await Match.find({ game: gameId })
        .populate({
            path: 'participants',
            select: 'name'
        })
        .populate({
            path: 'winner',
            select: 'name'
        })
        .sort({ round: 1, scheduledTime: 1 })
        .select('-__v');

    return NextResponse.json({ 
        success: true, 
        data: {
            game: game,
            matches: matches
        }
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching tournament data:", error);
    return NextResponse.json({ success: false, error: 'Server error occurred while fetching tournament data.' }, { status: 500 });
  }
}