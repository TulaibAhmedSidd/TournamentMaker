import Match from '@/app/models/Match';
import Game from '@/app/models/Game';
import mongoose from 'mongoose';

/**
 * Checks if a specific round in a game is complete and, if so, generates the next round.
 * This currently handles 1v1 single-elimination bracket logic.
 * * @param {string} gameId - The ID of the Game/Tournament.
 * @param {number} currentRound - The round number that was just potentially completed.
 * @returns {object} - Status and message regarding the advancement.
 */
export async function advanceTournamentRound(gameId, currentRound) {
    if (!gameId || !currentRound) {
        return { success: false, message: 'Missing gameId or currentRound for advancement.' };
    }

    // 1. Find all matches in the current round for the given game
    const currentRoundMatches = await Match.find({
        game: gameId,
        round: currentRound
    });

    if (currentRoundMatches.length === 0) {
        return { success: true, message: `Round ${currentRound} has no matches.` };
    }

    // 2. Check if all matches in the current round are completed
    const incompleteMatches = currentRoundMatches.filter(match => match.status !== 'Completed');

    if (incompleteMatches.length > 0) {
        return { success: true, message: `Round ${currentRound} is not yet complete. ${incompleteMatches.length} matches remaining.` };
    }
    
    // All matches are complete, proceed to the next round generation
    const winners = currentRoundMatches.map(match => match.winner);
    
    // Check for the tournament winner (only one winner means the tournament is complete)
    if (winners.length === 1) {
        const game = await Game.findById(gameId);
        if (game) {
            game.status = 'Completed';
            game.winner = winners[0]; // Assuming we add a winner field to Game model later
            await game.save();
        }
        return { success: true, message: `Tournament completed! Champion is determined.` };
    }

    // 3. Shuffle winners and create pairings for the next round
    const nextRound = currentRound + 1;
    const shuffledWinners = winners.sort(() => 0.5 - Math.random()); // Simple shuffle for re-pairing
    const newMatches = [];
    const gameDetails = await Game.findById(gameId).select('scheduledTime');

    // Handle Byes for the next round if winners count is odd (should rarely happen after R1 in a full bracket)
    let byePlayerId = null;
    if (shuffledWinners.length % 2 !== 0) {
        byePlayerId = shuffledWinners.pop();
        
        // Player with bye automatically wins and advances to the round after next
        newMatches.push({
            game: gameId,
            participants: [byePlayerId],
            isBye: true,
            status: 'Completed',
            winner: byePlayerId,
            round: nextRound,
            scheduledTime: gameDetails.scheduledTime, // Use game scheduled time as a placeholder
        });
    }
    
    // 4. Create 1v1 pairings for the rest of the winners
    for (let i = 0; i < shuffledWinners.length; i += 2) {
        newMatches.push({
            game: gameId,
            participants: [shuffledWinners[i], shuffledWinners[i + 1]],
            isBye: false,
            round: nextRound,
            scheduledTime: gameDetails.scheduledTime,
        });
    }

    // 5. Insert the new matches
    const createdMatches = await Match.insertMany(newMatches);
    
    let message = `Round ${currentRound} completed. Successfully drafted ${createdMatches.length} matches for Round ${nextRound}.`;
    if (byePlayerId) {
        message += ` (One player advanced via a Bye).`;
    }
    
    // [Image of a single-elimination tournament bracket]
    return { success: true, message };
}