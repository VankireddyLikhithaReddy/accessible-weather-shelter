import mongoose from 'mongoose';
import { Shelter } from './models/Shelter.js';

const DEFAULT_SEED = [
    {
        name: 'Community Emergency Shelter',
        address: '123 Main St',
        phone: '(555) 123-4567',
        capacity: 100,
        info: 'Open 24/7',
        accessibility: { wheelchairAccessible: true, signLanguageSupport: false, brailleSignage: true },
        location: { type: 'Point', coordinates: [-95.3698, 29.7604] },
    },
    {
        name: 'Safe Haven Shelter',
        address: '456 Oak Ave',
        phone: '(555) 987-6543',
        capacity: 80,
        info: 'Capacity 150',
        accessibility: { wheelchairAccessible: true, signLanguageSupport: true, brailleSignage: false },
        location: { type: 'Point', coordinates: [-95.3670, 29.7620] },
    },
    {
        name: 'Central High Gym',
        address: '789 Center Rd',
        phone: '(555) 555-1212',
        capacity: 200,
        info: 'Pet-friendly',
        accessibility: { wheelchairAccessible: false, signLanguageSupport: false, brailleSignage: false },
        location: { type: 'Point', coordinates: [-95.3620, 29.7580] },
    },
];

export async function connectDB() {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
        console.log('MONGODB_URI not set, skipping DB connect.');
        return null;
    }

    try {
        await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || undefined });
        console.log('✅ Connected to MongoDB');

        // Seed if empty
        const count = await Shelter.countDocuments();
        if (count === 0) {
            console.log('Seeding shelters collection with default data...');
            await Shelter.insertMany(DEFAULT_SEED);
            console.log('Seeding complete.');
        } else {
            console.log(`Shelters collection contains ${count} documents; skipping seed.`);
        }

        return mongoose;
    } catch (err) {
        console.error('MongoDB connection error:', err && err.message ? err.message : err);
        return null;
    }
}
