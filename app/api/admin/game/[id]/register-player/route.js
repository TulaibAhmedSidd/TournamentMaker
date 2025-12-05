import dbConnect from '@/app/lib/db';
import Game from '@/app/models/Game';
import User from '@/app/models/User';
import { NextResponse } from 'next/server';
// Utility to ensure a player (User) exists or is created

import bcrypt from 'bcryptjs';


const  DEFAULT_PLAYER_PASSWORD = '12345'

async function findOrCreateUser(email, name) {
  let user = await User.findOne({ email });
  if (!user) {
    const hashedPassword = await bcrypt.hash(DEFAULT_PLAYER_PASSWORD, 10);
    user = await User.create({ 
        email, 
        name, 
        password: hashedPassword, // Set the hashed default password
        isAdmin: false 
    });
  }
  return user;
}

// POST /api/admin/game/[id]/register-player - Register a player to a specific game
export async function POST(request, { params }) {
  await dbConnect();

  const gameId = params.id;

  try {
    const { players: newPlayersData } = await request.json(); // newPlayersData is an array of { email, name }

    if (!newPlayersData || newPlayersData.length === 0) {
      return NextResponse.json({ success: false, error: 'No player data provided.' }, { status: 400 });
    }

    const game = await Game.findById(gameId);
    if (!game) {
      return NextResponse.json({ success: false, error: 'Game not found.' }, { status: 404 });
    }

    // Process each new player
    const newPlayerIds = [];
    for (const { email, name } of newPlayersData) {
      const user = await findOrCreateUser(email, name);
      // Add player ID if they are not already registered for this game
      if (!game.registeredPlayers.includes(user._id)) {
        newPlayerIds.push(user._id);
      }
    }

    // Update the game with the new players
    game.registeredPlayers.push(...newPlayerIds);
    await game.save();

    return NextResponse.json({
      success: true,
      message: `${newPlayerIds.length} new players registered for ${game.name}.`,
      game
    }, { status: 200 });

  } catch (error) {
    console.error("Error registering players:", error);
    return NextResponse.json({ success: false, error: 'Server error occurred during registration.' }, { status: 500 });
  }
}