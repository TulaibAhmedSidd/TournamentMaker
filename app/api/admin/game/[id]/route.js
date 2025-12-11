import mongoose from 'mongoose';
import dbConnect from '@/app/lib/db';
import Game from '@/app/models/Game';
import Match from '@/app/models/Match';
import { NextResponse } from 'next/server';
/**
 * Handles the DELETE request to permanently remove a tournament (Game) and all associated Matches.
 */
export async function DELETE(request, { params }) {
    await dbConnect();

    const gameId = params.id;

    if (!mongoose.Types.ObjectId.isValid(gameId)) {
        return NextResponse.json({ success: false, error: 'Invalid Game ID provided.' }, { status: 400 });
    }

    try {
        // Find the game first to ensure it exists
        const game = await Game.findById(gameId);
        if (!game) {
            return NextResponse.json({ success: false, error: 'Tournament not found.' }, { status: 404 });
        }
        
        // 1. Delete all matches associated with this game
        const matchDeleteResult = await Match.deleteMany({ game: gameId });
        
        // 2. Delete the game itself
        const gameDeleteResult = await Game.deleteOne({ _id: gameId });

        if (gameDeleteResult.deletedCount === 0) {
            // Should not happen if the check above passed, but good for safety
             return NextResponse.json({ success: false, error: 'Failed to delete tournament record.' }, { status: 500 });
        }

        const message = `Tournament "${game.name}" successfully deleted. Deleted ${matchDeleteResult.deletedCount} associated match(es).`;

        return NextResponse.json({ 
            success: true, 
            message: message,
            deletedMatchesCount: matchDeleteResult.deletedCount
        }, { status: 200 });

    } catch (error) {
        console.error('Delete Tournament Error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Server error during tournament deletion.' }, { status: 500 });
    }
}

// NOTE: You can optionally add a GET handler here to fetch game details if needed for an edit/view page.
// export async function GET(request, { params }) { ... }