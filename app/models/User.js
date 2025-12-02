import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name.'],
    maxlength: [60, 'Name cannot be more than 60 characters'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email.'],
    unique: true,
  },
  // Role differentiation: True for Admin, False for Player
  isAdmin: {
    type: Boolean,
    default: false,
  },
  // Used for tracking matches they have participated in (optional for now, can be added later)
  // matchesPlayed: [{
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Match',
  // }],
}, { timestamps: true });

// Use existing model or create a new one
export default mongoose.models.User || mongoose.model('User', UserSchema);