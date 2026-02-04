import isAdminAuthenticated from '@/app/lib/authChecker';
import dbConnect from '@/app/lib/db';
import Game from '@/app/models/Game';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Handles GET request to fetch all games/tournaments.
 * Used by the Admin list view.
 */
export async function GET(request) {
    if (!isAdminAuthenticated(request)) {
        // Log the unauthorized attempt (optional)
        console.warn('Unauthorized attempt to access Admin Winners API');

        // Return 401 Unauthorized immediately if the user is not authenticated
        return NextResponse.json({
            success: false,
            error: 'Unauthorized: Admin privileges required.'
        }, { status: 401 });
    }
    await dbConnect();

    try {
        const games = await Game.find({}).sort({ scheduledTime: -1 });
        return NextResponse.json({ success: true, data: games }, { status: 200 });
    } catch (error) {
        console.error('Error fetching games:', error);
        return NextResponse.json({ success: false, error: 'Error fetching games.' }, { status: 500 });
    }
}

/**
 * Handles POST request to create a new game/tournament.
 * Used by the Admin creation form.
 */
export async function POST(request) {
    await dbConnect();

    try {
        const body = await request.json();

        // Ensure scheduledTime is a valid Date object
        if (body.scheduledTime) {
            body.scheduledTime = new Date(body.scheduledTime);
        }

        const game = await Game.create(body);
        return NextResponse.json({
            success: true, data: game,
            headers: {
                'Cache-Control': 'no-store, max-age=0',
            }
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating game:', error);
        // Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return NextResponse.json({ success: false, error: messages.join(', ') }, { status: 400 });
        }
        return NextResponse.json({ success: false, error: 'Server error creating game.' }, { status: 500 });
    }
}