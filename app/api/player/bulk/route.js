import dbConnect from '@/app/lib/db';
import User from '@/app/models/User';
import { NextResponse } from 'next/server';
// Import bcryptjs to hash the default password
import bcrypt from 'bcryptjs';

// Mock data for bulk insertion
const MOCK_PLAYERS = [
    { name: 'Ali Khan', email: 'ali.k@example.com' },
    { name: 'Sana Malik', email: 'sana.m@example.com' },
    { name: 'Omar Hussain', email: 'omar.h@example.com' },
    { name: 'Aisha Saleem', email: 'aisha.s@example.com' },
    { name: 'Fahad Riaz', email: 'fahad.r@example.com' },
    { name: 'Hira Tariq', email: 'hira.t@example.com' },
    { name: 'Zain Abbas', email: 'zain.a@example.com' },
    { name: 'Sara Kamran', email: 'sara.k@example.com' },
    { name: 'Bilal Javed', email: 'bilal.j@example.com' },
    { name: 'Mehak Nasir', email: 'mehak.n@example.com' },
    { name: 'Imran Bhatti', email: 'imran.b@example.com' },
];
const DEFAULT_PLAYER_PASSWORD = '12345';

/**
 * Inserts mock players into the database with a pre-hashed default password.
 * This function is used for bulk creation/testing purposes.
 */
async function insertMockPlayers() {
    // 1. Hash the default password once for efficiency
    const hashedPassword = await bcrypt.hash(DEFAULT_PLAYER_PASSWORD, 10);

    // 2. Map over the mock players and explicitly add the hashed password to each object
    const playersWithPassword = MOCK_PLAYERS.map(player => ({
        ...player,
        password: hashedPassword, // Use the pre-calculated hash
        isAdmin: false, // Ensure they are regular users
    }));

    // 3. Insert all documents into the User collection
    await User.insertMany(playersWithPassword);

    // This function is intended to be used within the POST handler, 
    // so it doesn't return an HTTP response directly.
}

// POST /api/admin/game/[id]/register-player - Use this route temporarily for bulk user creation
export async function POST() {
    await dbConnect();
    try {
        await insertMockPlayers(); // Await the insertion process

        return NextResponse.json({
            success: true,
            message: `Successfully added ${MOCK_PLAYERS.length} mock players with the default password.`,
        }, { status: 200 });

    } catch (error) {
        console.error("Error inserting mock players:", error);
        // Check for duplicate key error (11000) which means the players already exist
        if (error.code === 11000) {
            return NextResponse.json({ success: false, error: 'Players already exist (Duplicate key error).' }, { status: 409 });
        }
        return NextResponse.json({ success: false, error: 'Server error occurred during bulk user creation.' }, { status: 500 });
    }
}