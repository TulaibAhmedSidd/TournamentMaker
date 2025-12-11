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
export async function createFirstRoundOld(gameId, playerIds, scheduledTime) {
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
export async function createFirstRound(gameId, playerIds, scheduledTime, teamSize = 1) { // <-- ADD teamSize parameter
    if (playerIds.length < teamSize * 2) {
        throw new Error(`Insufficient players to draft the first round (minimum ${teamSize * 2} for team size ${teamSize}).`);
    }

    // 1. Shuffle players for random seeding
    const shuffledPlayers = shuffleArray([...playerIds]);
    
    // --- NEW LOGIC: CHUNK PLAYERS INTO SIDES (TEAMS) ---
    const allSides = [];
    for (let i = 0; i < shuffledPlayers.length; i += teamSize) {
        // Each 'side' is an array of player IDs (e.g., [playerA, playerB])
        allSides.push(shuffledPlayers.slice(i, i + teamSize));
    }
    const numSides = allSides.length; // The total number of entities to be paired
    // --- END NEW LOGIC ---

    // 2. Determine matches and byes based on the nearest power of 2
    let powerOfTwo = 1;
    while (powerOfTwo < numSides) { // <-- USE numSides for pairing logic
        powerOfTwo *= 2;
    }

    const numByes = powerOfTwo - numSides;
    const sidesInMatchesCount = numSides - numByes;
    const matchesToCreate = sidesInMatchesCount / 2; // Matches are pairs of sides

    const matches = [];
    let matchCounter = 1;

    // 3. Process Byes (if any): These sides automatically advance
    const byeSides = allSides.slice(0, numByes);
    
    for (const side of byeSides) {
        // Match participants is the entire side of players
        matches.push({
            game: gameId,
            round: 1,
            matchNumber: matchCounter++,
            // Map all player IDs in the side to ObjectIds for the participants array
            participants: side.map(id => new mongoose.Types.ObjectId(id)), 
            isBye: true,
            // For team play, we designate the first player in the side as the representative winner ID
            winner: new mongoose.Types.ObjectId(side[0]), 
            status: 'Completed',
            scheduledTime: scheduledTime,
        });
    }

    // 4. Process Actual Matches: The remaining sides are paired
    const sidesInMatches = allSides.slice(numByes);
    for (let i = 0; i < matchesToCreate; i++) {
        const side1 = sidesInMatches[i * 2];
        const side2 = sidesInMatches[i * 2 + 1];

        // Combine all players from both sides into the match participants array
        const allParticipants = side1.concat(side2).map(id => new mongoose.Types.ObjectId(id));

        matches.push({
            game: gameId,
            round: 1,
            matchNumber: matchCounter++,
            participants: allParticipants, // <-- Now contains 4 players for 2v2
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
export async function advanceBracket2(gameId) {
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
    const winners = currentRoundMatches.map(match => match.winner); // This is still a single Player ID

    if (winners.length === 1) {
        // Tournament is complete (Only one winner remains after the final match)
        await Game.findByIdAndUpdate(gameId, {
            status: 'Completed',
            winner: winners[0]
        });
        return { advanced: true, isFinal: true, totalNewMatches: 0, winnerId: winners[0], message: "Tournament completed! The winner has been crowned." };
    }
    
    // --- ADVANCEMENT FIX FOR TEAM MATCHES ---
    // We need the original match participants to reconstruct the winning side/team
    const winningSides = [];
    const teamSizeMatch = game.matchFormat.match(/^(\d+)v\d+$/);
    const teamSize = teamSizeMatch ? parseInt(teamSizeMatch[1]) : 1;
    
    // Iterate through completed matches and identify the full winning team
    for (const match of currentRoundMatches) {
        if (!match.winner) continue; // Should not happen here, but safety check

        const winnerIdString = match.winner.toString();
        
        // Find the players who were on the same side as the winner ID
        // This assumes participants are ordered [Side 1 Players..., Side 2 Players...]
        const side1 = match.participants.slice(0, teamSize).map(id => id.toString());
        const side2 = match.participants.slice(teamSize, teamSize * 2).map(id => id.toString());

        if (side1.includes(winnerIdString)) {
            winningSides.push(side1);
        } else if (side2.includes(winnerIdString)) {
            winningSides.push(side2);
        }
        // If it was a bye match, side 2 is empty, and side 1 is the winner.
    }
    
    // 4. Draft the next round based on winningSides
    const nextRound = currentRound + 1;
    const newMatches = [];
    let matchCounter = 1;

    for (let i = 0; i < winningSides.length; i += 2) {
        // Pair consecutive winning sides
        const side1 = winningSides[i];
        const side2 = winningSides[i + 1];
        
        if (side1 && side2) {
            // Combine all players from both sides into the match participants array
            const allParticipants = side1.concat(side2).map(id => new mongoose.Types.ObjectId(id));

            newMatches.push({
                game: gameId,
                round: nextRound,
                matchNumber: matchCounter++,
                participants: allParticipants,
                isBye: false,
                status: 'Scheduled',
                scheduledTime: game.scheduledTime,
            });
        }
        // Note: There is no bye logic here because we only draft matches that will happen (even number of sides).
        // If the tournament advances to a round with an odd number of sides, a bye should be automatically awarded 
        // to one of the winning sides (typically the winner of the first match pair, which is side1 here).
        // Since this requires a more complex check on winners.length vs power of two, we'll keep it simple for now, 
        // assuming the advancement only happens when sides are perfectly paired.
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