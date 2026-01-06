import dbConnect from '@/app/lib/db';
import Game from '@/app/models/Game'; // Assuming this is your Mongoose model for tournaments
import { NextResponse } from 'next/server';

// GET /api/tournament - Fetch all tournaments
export async function GET() {
  await dbConnect();

  try {
    // Fetch all Game documents. We use select() to only include essential fields for the list view,
    // avoiding fetching large populated arrays unnecessarily.
    const tournaments = await Game.find({})
      .select('name status startDate registeredPlayers') // Select essential fields
      .sort({ startDate: 1 }); // Sort by start date

    // Map and transform the result to include the count of registered players
    const tournamentList = tournaments.map(game => ({
      _id: game._id,
      name: game.name,
      status: game.status,
      startDate: game.startDate,
      playerCount: game.registeredPlayers ? game.registeredPlayers.length : 0, // Get the count
    }));

    return NextResponse.json({
      success: true,
      tournaments: tournamentList,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching all tournaments:", error);
    return NextResponse.json({
      success: false,
      error: 'Server error occurred while fetching tournaments.'
    }, { status: 500 });
  }
}