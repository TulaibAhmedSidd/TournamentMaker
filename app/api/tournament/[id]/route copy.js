import dbConnect from '@/app/lib/db';
import Game from '@/app/models/Game';
import Match from '@/app/models/Match';
import User from '@/app/models/User'; // <-- ADDED: Need to import the User model to ensure it is registered with Mongoose
import { NextResponse } from 'next/server';

// GET /api/tournament/[id] - Get comprehensive data for a single tournament (game and all matches)
export async function GET(request, { params }) {
  await dbConnect();
  const gameId = params.id;

  try {
    const game = await Game.findById(gameId)
        .populate({
            path: 'registeredPlayers',
            model: 'User', // <-- FIX: Explicitly use the 'User' model to populate player data
            select: 'name'
        })
        .select('-__v');

    if (!game) {
      return NextResponse.json({ success: false, error: 'Tournament not found.' }, { status: 404 });
    }

    // Fetch all matches related to this game, populating participants and sorting by round
    const matches = await Match.find({ game: gameId })
        .populate({
            path: 'participants',
            model: 'User', // <-- FIX: Explicitly use 'User' model for participants
            select: 'name'
        })
        .populate({
            path: 'winner',
            model: 'User', // <-- FIX: Explicitly use 'User' model for the winner
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
    // Updated status to 500 (Internal Server Error) and included the error message for better debugging
    return NextResponse.json({ 
        success: false, 
        error: `Server error occurred while fetching tournament data: ${error.message || error}` 
    }, { status: 500 });
  }
}