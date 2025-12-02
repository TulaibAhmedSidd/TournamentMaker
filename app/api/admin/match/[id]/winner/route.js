import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/app/lib/db';
import Match from '@/app/models/Match';
import { advanceBracket } from '@/app/lib/tournament-logic';

/**
 * Handles the PATCH request to record the winner of a match and trigger bracket advancement logic.
 */
export async function PATCH(request, { params }) {
    await dbConnect();

    const matchId = params.id;
    let data;
    try {
        data = await request.json();
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
    }

    const { winnerId } = data;

    if (!winnerId || !mongoose.Types.ObjectId.isValid(winnerId)) {
        return NextResponse.json({ success: false, error: 'Invalid winner ID provided.' }, { status: 400 });
    }

    try {
        // 1. Find the match and validate winner
        const match = await Match.findById(matchId);
        
        if (!match) {
            return NextResponse.json({ success: false, error: 'Match not found.' }, { status: 404 });
        }
        
        if (match.status === 'Completed') {
            return NextResponse.json({ success: false, error: 'Match is already completed.' }, { status: 400 });
        }
        
        // Ensure the recorded winner is actually a participant
        if (!match.participants.map(p => p.toString()).includes(winnerId)) {
             return NextResponse.json({ success: false, error: 'The winner is not a participant in this match.' }, { status: 400 });
        }

        // 2. Update the match record
        const updatedMatch = await Match.findByIdAndUpdate(matchId, 
            { 
                winner: new mongoose.Types.ObjectId(winnerId), 
                status: 'Completed' 
            }, 
            { new: true }
        );

        // 3. Check for bracket advancement in the parent game
        const advancementResult = await advanceBracket(match.game.toString());

        // 4. Compile response message
        let responseMessage = `Match ${updatedMatch.matchNumber} (Round ${updatedMatch.round}) completed! `;
        responseMessage += advancementResult.message;

        return NextResponse.json({ 
            success: true, 
            message: responseMessage,
            advancement: advancementResult
        }, { status: 200 });

    } catch (error) {
        console.error('Record Winner Error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Server error recording winner.' }, { status: 500 });
    }
}