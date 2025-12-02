import mongoose from 'mongoose';

const PlayerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name for this player.'],
    trim: true,
  },
  email: {
    type: String,
    required: false, // Optional for simplicity
    trim: true,
  },
}, { timestamps: true });

export default mongoose.models.Player || mongoose.model('Player', PlayerSchema);