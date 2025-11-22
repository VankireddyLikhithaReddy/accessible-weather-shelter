import { User } from '../models/User.js';
import bcrypt from 'bcrypt';

export async function createUser(username, password, emergencyEmail = '') {
  if (!username || !password) throw new Error('Missing username or password');
  const existing = await User.findOne({ username }).lean();
  if (existing) {
    const err = new Error('User already exists');
    err.code = 'EEXISTS';
    throw err;
  }
  const hash = await bcrypt.hash(password, 10);
  const user = new User({ username, passwordHash: hash, emergencyEmail });
  await user.save();
  return user;
}

export async function verifyUser(username, password) {
  if (!username || !password) return false;
  const user = await User.findOne({ username });
  if (!user) return false;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user : false;
}

export async function findUserByUsername(username) {
  return await User.findOne({ username }).select('-passwordHash').lean();
}