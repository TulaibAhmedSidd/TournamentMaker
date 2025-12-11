import dbConnect from '@/app/lib/db';
import Game from '@/app/models/Game';
import { createFirstRound } from '../../../../../lib/tournament-logic';
import { NextResponse } from 'next/server';

/**
 * Handles the POST request to draft the first round of a tournament.
 * Shuffles registered players and creates initial Match records, handling byes if necessary.
 */
export async function POST(request, { params }) {
    await dbConnect();

    const gameId = params.id;

    try {
        const game = await Game.findById(gameId);

        if (!game) {
            return NextResponse.json({ success: false, error: 'Tournament not found.' }, { status: 404 });
        }

        // Ensure the game is in the correct state for drafting
        if (game.status !== 'Registration Open' && game.status !== 'Drafting') {
            return NextResponse.json({ success: false, error: `Drafting is only allowed when status is 'Registration Open' or 'Drafting'. Current status: ${game.status}` }, { status: 400 });
        }
        
        const playerIds = game.registeredPlayers.map(id => id.toString());
        if (playerIds.length < 2) {
             return NextResponse.json({ success: false, error: 'Cannot draft: Less than 2 players registered.' }, { status: 400 });
        }

        // Execute the core logic to create the matches
        const matchesCreated = await createFirstRound(
            gameId, 
            playerIds, 
            game.scheduledTime
        );

        return NextResponse.json({ 
            success: true, 
            message: `Draft successful! ${matchesCreated} matches created for Round 1. Game status set to 'Active'.` 
        }, { status: 200 });

    } catch (error) {
        console.error('Drafting Error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Server error during drafting.' }, { status: 500 });
    }
}