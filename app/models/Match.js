import mongoose from 'mongoose';

const MatchSchema = new mongoose.Schema({
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true,
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // <-- Corrected reference
    required: true,
  }],
  
  isBye: {
    type: Boolean,
    default: false,
  },
  
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // <-- Corrected reference
    default: null, // Null until the match is completed
  },
  
  status: {
    type: String,
    enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Scheduled',
  },

  round: {
    type: Number,
    required: true,
  },
  
  // New: Identifier for the match within its round (e.g., Match 3 of Round 1)
  matchNumber: {
    type: Number,
    required: true,
  },

  scheduledTime: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

export default mongoose.models.Match || mongoose.model('Match', MatchSchema);