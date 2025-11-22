import mongoose from 'mongoose';

const { Schema } = mongoose;

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  emergencyEmail: { type: String },
}, {
  timestamps: true,
});

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
