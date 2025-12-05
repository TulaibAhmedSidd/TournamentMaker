import isAdminAuthenticated from '@/app/lib/authChecker';
import dbConnect from '@/app/lib/db';
import Game from '@/app/models/Game';
import Match from '@/app/models/Match';
import { NextResponse } from 'next/server';

// GET /api/admin/tournament/winners - Get a list of all past tournaments and their winners

export async function GET(request) {
    await dbConnect();
    // ----------------------------------------------------
    if (!isAdminAuthenticated(request)) {
        // Log the unauthorized attempt (optional)
        console.warn('Unauthorized attempt to access Admin Winners API');

        // Return 401 Unauthorized immediately if the user is not authenticated
        return NextResponse.json({
            success: false,
            error: 'Unauthorized: Admin privileges required.'
        }, { status: 401 });
    }

    try {
        // 1. Find all completed games
        // Including 'scheduledTime' along with 'startDate' to ensure the time is captured.
        const completedGames = await Game.find({ status: 'Completed' })
            .select('name startDate scheduledTime _id'); // <-- UPDATED: Added scheduledTime

        if (!completedGames || completedGames.length === 0) {
            return NextResponse.json({ success: true, winners: [], message: 'No completed tournaments found.' }, { status: 200 });
        }

        const winnersList = [];

        // 2. For each completed game, find the final match and its winner
        for (const game of completedGames) {
            // Find the match with the highest round number that has a winner set
            const finalMatch = await Match.findOne({
                game: game._id,
                winner: { $exists: true, $ne: null }
            })
                .sort({ round: -1 }) // Sort by round descending to get the final match
                .limit(1)
                .populate({
                    path: 'winner',
                    model: 'User',
                    select: 'name email'
                });

            winnersList.push({
                tournamentId: game._id,
                tournamentName: game.name,
                startDate: game.startDate,
                scheduledTime: game.scheduledTime, // Pass scheduledTime in case it's used
                winner: finalMatch ? finalMatch.winner : { name: 'N/A', email: 'Tournament completed, but final match winner missing.' }
            });
        }

        return NextResponse.json({
            success: true,
            count: winnersList.length,
            winners: winnersList
        }, { status: 200 });

    } catch (error) {
        console.error("Error fetching tournament winners:", error);
        return NextResponse.json({
            success: false,
            error: `Server error occurred while fetching winners: ${error.message || error}`
        }, { status: 500 });
    }
}