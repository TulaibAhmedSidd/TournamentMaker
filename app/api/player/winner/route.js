import dbConnect from '@/app/lib/db';
import Match from '@/app/models/Match';
import { NextResponse } from 'next/server';

// PATCH /api/admin/match/[id]/winner - Record the winner of a completed match
export async function PATCH(request, { params }) {
  await dbConnect();

  const matchId = params.id;

  try {
    const { winnerId } = await request.json();

    if (!winnerId) {
      return NextResponse.json({ success: false, error: 'Winner ID is required.' }, { status: 400 });
    }

    const match = await Match.findById(matchId);
    if (!match) {
      return NextResponse.json({ success: false, error: 'Match not found.' }, { status: 404 });
    }

    // 1. Validation: Check if the match is not already completed
    if (match.status === 'Completed') {
      return NextResponse.json({ success: false, error: 'Match is already completed. Cannot change winner.' }, { status: 400 });
    }

    // 2. Validation: Check if the winner is one of the participants
    // We convert participant IDs to strings for robust comparison with the winnerId string
    if (!match.participants.map(id => id.toString()).includes(winnerId)) {
      return NextResponse.json({ success: false, error: 'Winner must be one of the participants in this match.' }, { status: 400 });
    }

    // 3. Update the match
    match.winner = winnerId;
    match.status = 'Completed';
    await match.save();

    return NextResponse.json({
      success: true,
      message: `Winner recorded for match ID ${matchId}.`,
      data: match,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Error recording match winner:", error);
    return NextResponse.json({ success: false, error: 'Server error occurred while updating the winner.' }, { status: 500 });
  }
}