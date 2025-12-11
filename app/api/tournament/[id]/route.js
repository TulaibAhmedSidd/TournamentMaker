import dbConnect from '@/app/lib/db';
import Game from '@/app/models/Game';
import Match from '@/app/models/Match';
import User from '@/app/models/User';
import { NextResponse } from 'next/server';

// GET /api/tournament/[id] - Get comprehensive data for a single tournament (game and all matches)
export async function GET(request, { params }) {
  await dbConnect();
  const gameId = params.id;

  try {
    // Fetch the main game details
    const game = await Game.findById(gameId)
      .populate({
        path: 'registeredPlayers',
        model: 'User', // Explicitly use the 'User' model
        select: 'name'
      })
      .populate({
        path: 'winner',
        model: 'User', // Explicitly use the 'User' model for game winner
        select: 'name'
      })
      .select('-__v');

    if (!game) {
      return NextResponse.json({ success: false, error: 'Tournament not found.' }, { status: 404 });
    }

    // Fetch all matches related to this game, populating participants and winner
    const matches = await Match.find({ game: gameId })
      .populate({
        path: 'participants',
        model: 'User', // Explicitly use 'User' model for participants
        select: 'name'
      })
      .populate({
        path: 'winner',
        model: 'User', // Explicitly use 'User' model for the match winner
        select: 'name'
      })
      .sort({ round: 1, matchNumber: 1 }) // Sort by round and then match number
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
    return NextResponse.json({
      success: false,
      error: `Server error occurred while fetching tournament data: ${error.message || error}`
    }, { status: 500 });
  }
}