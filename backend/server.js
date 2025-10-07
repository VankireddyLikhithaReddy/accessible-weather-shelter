import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import weatherRoutes from './routes/weather.js';
import shelterRoutes from './routes/shelters.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/weather', weatherRoutes);
app.use('/api/shelters', shelterRoutes);

app.get('/', (req, res) => res.send('Accessible Weather & Shelter Finder API is running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
