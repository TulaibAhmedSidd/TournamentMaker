import dbConnect from '@/app/lib/db';
import Game from '@/app/models/Game';
import Match from '@/app/models/Match';
import { NextResponse } from 'next/server';

// Utility function to shuffle an array (Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// POST /api/admin/game/[id]/draft - Creates random matchups for Round 1
export async function POST(request, { params }) {
    await dbConnect();
    const gameId = params.id;

    try {
        const game = await Game.findById(gameId);
        if (!game) {
            return NextResponse.json({ success: false, error: 'Game not found.' }, { status: 404 });
        }

        // 1. Check if drafting has already occurred or registration is closed
        if (game.status !== 'Registration Open') {
            return NextResponse.json({ success: false, error: `Cannot draft. Game status is ${game.status}.` }, { status: 400 });
        }

        let players = game.registeredPlayers.map(id => id.toString());

        if (players.length < 2) {
            return NextResponse.json({ success: false, error: 'Need at least 2 players to draft matches.' }, { status: 400 });
        }

        // 2. Randomly shuffle the players
        const shuffledPlayers = shuffleArray(players);
        const newMatches = [];

        // Handle Byes (if odd number of players)
        let byePlayerId = null;
        if (shuffledPlayers.length % 2 !== 0) {
            // The last player gets a bye
            byePlayerId = shuffledPlayers.pop();

            newMatches.push({
                game: gameId,
                participants: [byePlayerId], // Only one participant
                isBye: true,
                status: 'Completed',
                winner: byePlayerId, // Player with bye automatically wins the round
                round: 1,
                scheduledTime: game.scheduledTime, // Use game scheduled time
            });
        }

        // 3. Create 1v1 pairings for the remaining players
        for (let i = 0; i < shuffledPlayers.length; i += 2) {
            newMatches.push({
                game: gameId,
                participants: [shuffledPlayers[i], shuffledPlayers[i + 1]],
                isBye: false,
                round: 1,
                scheduledTime: game.scheduledTime,
            });
        }

        // 4. Insert all new matches into the database
        const createdMatches = await Match.insertMany(newMatches);

        // 5. Update Game status and potentially link the matches (optional, but useful)
        // NOTE: For now, we update status to 'Active'. We can introduce a 'Drafted' status later.
        game.status = 'Active';
        await game.save();

        const draftedCount = createdMatches.length;

        return NextResponse.json({
            success: true,
            message: `Successfully drafted ${draftedCount} matches for Round 1 (including ${byePlayerId ? 1 : 0} bye).`,
            matches: createdMatches,
            headers: {
                'Cache-Control': 'no-store, max-age=0',
            }
        }, { status: 200 });

    } catch (error) {
        console.error("Error during drafting:", error);
        return NextResponse.json({ success: false, error: 'Server error occurred during drafting.' }, { status: 500 });
    }
}