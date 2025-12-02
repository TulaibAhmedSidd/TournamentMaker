import mongoose from 'mongoose';

const GameSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name for the tournament/game.'],
    maxlength: [100, 'Name cannot be more than 100 characters'],
  },
  type: {
    type: String,
    required: [true, 'Please specify the game type (e.g., "Table Tennis", "Foosball").'],
    enum: ['Table Tennis', 'Foosball', 'Other'],
  },
  matchFormat: {
    type: String,
    required: [true, 'Please specify the match format (e.g., "1v1", "4v4").'],
    enum: ['1v1', '2v2', '4v4', '8v8', 'FFA'], // Added more formats for flexibility
  },
  scheduledTime: {
    type: Date,
    required: [true, 'Please provide the scheduled start time.'],
  },
  status: {
    type: String,
    required: true,
    enum: ['Drafting', 'Registration Open', 'Active', 'Completed', 'Cancelled'],
    default: 'Registration Open',
  },
  currentRound: {
    type: Number,
    default: 0, // 0 means not yet drafted
  },
  // Players registered for this game/tournament. REFERENCE IS NOW 'Player'
  // registeredPlayers: [{
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Player', // <-- Corrected reference
  // }],
  registeredPlayers: [{
        type: mongoose.Schema.Types.ObjectId,
        // *** THIS IS THE CRITICAL LINE ***
        // It must match the model name you used when defining the User schema.
        ref: 'User' // <--- CHANGE THIS FROM 'Player' TO 'User'
    }],
  // Final winner of the tournament
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // <-- Corrected reference
    required: false,
  }
}, { timestamps: true });

export default mongoose.models.Game || mongoose.model('Game', GameSchema);