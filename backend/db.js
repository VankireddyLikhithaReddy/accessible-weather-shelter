import mongoose from 'mongoose';
import { Shelter } from './models/Shelter.js';
import { Route } from './models/Route.js';
import { getDirections } from './services/directionsService.js';

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

        const count = await Shelter.countDocuments();
        if (count === 0) {
            console.log('Seeding shelters collection with default data...');
            await Shelter.insertMany(DEFAULT_SEED);
            console.log('Seeding complete.');
        } else {
            console.log(`Shelters collection contains ${count} documents; skipping seed.`);
        }

        try {
            const routeCount = await Route.countDocuments();
            if (routeCount === 0) {
                console.log('Seeding routes collection with sample routes...');

                const shelters = await Shelter.find().limit(10).lean();
                if (shelters && shelters.length >= 2) {
                    const samples = [];
                    const pairs = [[0, 1], [0, 2], [1, 2]].filter(([a, b]) => shelters[a] && shelters[b]);
                    for (const [a, b] of pairs) {
                        const origin = shelters[a];
                        const destination = shelters[b];
                        const directions = await getDirections(
                            { lat: origin.location.coordinates[1], lon: origin.location.coordinates[0] },
                            { lat: destination.location.coordinates[1], lon: destination.location.coordinates[0] }
                        );

                        const routeDoc = {
                            name: `${origin.name} → ${destination.name}`,
                            origin: { shelterId: origin._id, name: origin.name, lat: origin.location.coordinates[1], lon: origin.location.coordinates[0] },
                            destination: { shelterId: destination._id, name: destination.name, lat: destination.location.coordinates[1], lon: destination.location.coordinates[0] },
                            steps: (directions && directions.steps) ? directions.steps.map((s) => ({ order: s.order, instruction: s.instruction, distanceMeters: s.distanceMeters, start: s.start, end: s.end })) : [],
                            totalDistanceMeters: directions ? directions.totalDistanceMeters : 0,
                            estimatedTimeSeconds: directions ? directions.estimatedTimeSeconds : 0,
                        };
                        samples.push(routeDoc);
                    }

                    if (samples.length > 0) {
                        await Route.insertMany(samples);
                        console.log('Route seeding complete.');
                    } else {
                        console.log('Not enough shelters to create sample routes.');
                    }
                } else {
                    console.log('Not enough shelters found to seed routes.');
                }
            } else {
                console.log(`Routes collection contains ${routeCount} documents; checking for missing steps...`);
                const routes = await Route.find().lean();
                for (const r of routes) {
                    if (!r.steps || r.steps.length === 0) {
                        try {
                            if (r.origin && r.destination && r.origin.lat != null && r.destination.lat != null) {
                                console.log(`Filling steps for route ${r._id} (${r.name})`);
                                const directions = await getDirections({ lat: r.origin.lat, lon: r.origin.lon }, { lat: r.destination.lat, lon: r.destination.lon });
                                if (directions && Array.isArray(directions.steps) && directions.steps.length > 0) {
                                    await Route.updateOne({ _id: r._id }, { $set: { steps: directions.steps.map((s) => ({ order: s.order, instruction: s.instruction, distanceMeters: s.distanceMeters, start: s.start, end: s.end })), totalDistanceMeters: directions.totalDistanceMeters || 0, estimatedTimeSeconds: directions.estimatedTimeSeconds || 0 } });
                                    console.log(`Updated route ${r._id} with ${directions.steps.length} steps.`);
                                }
                            }
                        } catch (e) {
                            console.error('Error filling steps for route', r._id, e && e.message ? e.message : e);
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Error seeding routes:', e && e.message ? e.message : e);
        }

        return mongoose;
    } catch (err) {
        console.error('MongoDB connection error:', err && err.message ? err.message : err);
        return null;
    }
}
