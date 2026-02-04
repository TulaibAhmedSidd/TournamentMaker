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

        // --- NEW LOGIC: DETERMINE TEAM SIZE ---
        const teamSizeMatch = game.matchFormat.match(/^(\d+)v\d+$/);
        const teamSize = teamSizeMatch ? parseInt(teamSizeMatch[1]) : 1; // e.g., '2' from '2v2'

        const playerIds = game.registeredPlayers.map(id => id.toString());

        // New Validation: Ensure enough players based on format
        let minPlayers = 2;
        if (game.matchFormat === '1v1') minPlayers = 2;
        else if (game.matchFormat === '2v2') minPlayers = 4;
        else if (game.matchFormat === '4v4') minPlayers = 8;
        else if (game.matchFormat === '8v8') minPlayers = 16;

        if (playerIds.length < minPlayers) {
            return NextResponse.json({
                success: false,
                error: `Cannot draft: Need at least ${minPlayers} players for a ${game.matchFormat} tournament. Currently have ${playerIds.length}.`
            }, { status: 400 });
        }

        if (playerIds.length % teamSize !== 0) {
            return NextResponse.json({
                success: false,
                error: `Cannot draft: Total players (${playerIds.length}) must be a multiple of the team size (${teamSize}) for ${game.matchFormat}.`
            }, { status: 400 });
        }
        // --- END NEW LOGIC ---

        // Execute the core logic to create the matches
        const matchesCreated = await createFirstRound(
            gameId,
            playerIds,
            game.scheduledTime,
            teamSize // <--- Pass the determined team size
        );

        return NextResponse.json({
            success: true,
            message: `Draft successful! ${matchesCreated} matches created for Round 1. Game status set to 'Active'.`,
            headers: {
                'Cache-Control': 'no-store, max-age=0',
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Drafting Error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Server error during drafting.' }, { status: 500 });
    }
}