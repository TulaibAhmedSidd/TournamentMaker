import dbConnect from '@/app/lib/db';
import User from '@/app/models/User';
import { NextResponse } from 'next/server';
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

async function insertMockPlayers() {
    await User.insertMany(MOCK_PLAYERS);
    return NextResponse.json({ success: true, error: 'mockplayerAdded' }, { status: 200 });
}
// POST /api/admin/game/[id]/register-player - Register a player to a specific game
export async function POST() {
    await dbConnect();
    try {
        insertMockPlayers()
        return NextResponse.json({
            success: true,
            message: `Mock players added.`,
        }, { status: 200 });

    } catch (error) {
        console.error("Error registering players:", error);
        return NextResponse.json({ success: false, error: 'Server error occurred during registration.' }, { status: 500 });
    }
}