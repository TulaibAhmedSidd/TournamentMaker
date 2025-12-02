import Match from '../models/Match';
import Game from '../models/Game';
import mongoose from 'mongoose';

/**
 * Shuffles an array in place using the Fisher-Yates algorithm.
 * @param {Array} a - The array to shuffle.
 */
const shuffleArray = (a) => {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

/**
 * Creates the first round of matches, handling byes if player count is not a power of 2.
 * This is the drafting function used when starting a new tournament.
 * * @param {string} gameId - The MongoDB ID of the Game.
 * @param {Array<string>} playerIds - Array of registered Player IDs.
 * @param {Date} scheduledTime - The tournament's scheduled start time.
 * @returns {Promise<number>} The number of matches created.
 */
export async function createFirstRound(gameId, playerIds, scheduledTime) {
    if (playerIds.length < 2) {
        throw new Error("Insufficient players to draft the first round (minimum 2).");
    }

    // 1. Shuffle players for random seeding
    const shuffledPlayers = shuffleArray([...playerIds]);
    const numPlayers = shuffledPlayers.length;

    // 2. Determine matches and byes based on the nearest power of 2
    let powerOfTwo = 1;
    while (powerOfTwo < numPlayers) {
        powerOfTwo *= 2;
    }

    const numByes = powerOfTwo - numPlayers;
    const playersInMatchesCount = numPlayers - numByes;
    const matchesToCreate = playersInMatchesCount / 2;

    const matches = [];
    let matchCounter = 1;

    // 3. Process Byes (if any): These players automatically advance
    const byePlayers = shuffledPlayers.slice(0, numByes);
    
    for (const playerId of byePlayers) {
        // Create a completed 'bye' match in round 1 where the player is the automatic winner
        matches.push({
            game: gameId,
            round: 1,
            matchNumber: matchCounter++,
            participants: [new mongoose.Types.ObjectId(playerId)],
            isBye: true,
            winner: new mongoose.Types.ObjectId(playerId),
            status: 'Completed',
            scheduledTime: scheduledTime,
        });
    }

    // 4. Process Actual Matches: The remaining players are paired
    const playersInMatches = shuffledPlayers.slice(numByes);
    for (let i = 0; i < matchesToCreate; i++) {
        const player1Id = playersInMatches[i * 2];
        const player2Id = playersInMatches[i * 2 + 1];

        matches.push({
            game: gameId,
            round: 1,
            matchNumber: matchCounter++,
            participants: [
                new mongoose.Types.ObjectId(player1Id),
                new mongoose.Types.ObjectId(player2Id)
            ],
            isBye: false,
            status: 'Scheduled',
            scheduledTime: scheduledTime,
        });
    }

    // Save all matches and update Game status
    await Match.insertMany(matches);

    await Game.findByIdAndUpdate(gameId, {
        status: 'Active',
        currentRound: 1,
    });

    return matches.length;
}

/**
 * Checks if the current round is complete and, if so, drafts the next round.
 * This is the core logic for advancing the single-elimination bracket.
 * * @param {string} gameId - The MongoDB ID of the Game.
 * @returns {Promise<{advanced: boolean, isFinal: boolean, totalNewMatches: number, message: string}>} Advancement status.
 */
export async function advanceBracket(gameId) {
    const game = await Game.findById(gameId);
    if (!game) {
        throw new Error("Game not found.");
    }

    const currentRound = game.currentRound;

    // 1. Get all matches for the current round, sorted by match number
    const currentRoundMatches = await Match.find({ 
        game: gameId, 
        round: currentRound 
    }).sort({ matchNumber: 1 });

    if (currentRoundMatches.length === 0) {
        return { advanced: false, isFinal: true, totalNewMatches: 0, message: "Tournament has ended (no matches found for current round)." };
    }

    // 2. Check for pending matches
    const pendingMatches = currentRoundMatches.filter(match => match.status !== 'Completed');
    
    if (pendingMatches.length > 0) {
        return { advanced: false, isFinal: false, totalNewMatches: 0, message: `Waiting for ${pendingMatches.length} match(es) in Round ${currentRound} to finish.` };
    }

    // 3. Collect winners in order (this order determines correct pairing for the next round)
    const winners = currentRoundMatches.map(match => match.winner);
    
    if (winners.length === 1) {
        // Tournament is complete (Only one winner remains after the final match)
        await Game.findByIdAndUpdate(gameId, {
            status: 'Completed',
            winner: winners[0]
        });
        return { advanced: true, isFinal: true, totalNewMatches: 0, winnerId: winners[0], message: "Tournament completed! The winner has been crowned." };
    }

    // 4. Draft the next round
    const nextRound = currentRound + 1;
    const newMatches = [];
    let matchCounter = 1;

    for (let i = 0; i < winners.length; i += 2) {
        // Pair consecutive winners
        const player1Id = winners[i];
        const player2Id = winners[i + 1];
        
        if (player1Id && player2Id) {
             newMatches.push({
                game: gameId,
                round: nextRound,
                matchNumber: matchCounter++,
                participants: [player1Id, player2Id],
                isBye: false,
                status: 'Scheduled',
                scheduledTime: game.scheduledTime,
            });
        }
    }
    
    await Match.insertMany(newMatches);

    // Update Game status
    await Game.findByIdAndUpdate(gameId, {
        currentRound: nextRound,
    });

    return { 
        advanced: true, 
        isFinal: false, 
        totalNewMatches: newMatches.length, 
        message: `Round ${currentRound} completed! ${newMatches.length} match(es) successfully drafted for Round ${nextRound}.` 
    };
}