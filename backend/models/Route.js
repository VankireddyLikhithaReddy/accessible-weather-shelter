import mongoose from 'mongoose';

const { Schema } = mongoose;

const StepSchema = new Schema({
  order: { type: Number, required: true },
  instruction: { type: String, required: true },
  distanceMeters: { type: Number, default: 0 },
  start: {
    lat: { type: Number },
    lon: { type: Number },
  },
  end: {
    lat: { type: Number },
    lon: { type: Number },
  },
}, { _id: false });

const RouteSchema = new Schema({
  name: { type: String, required: true, index: true },
  origin: {
    shelterId: { type: Schema.Types.ObjectId, ref: 'Shelter' },
    lat: { type: Number },
    lon: { type: Number },
    address: { type: String },
  },
  destination: {
    shelterId: { type: Schema.Types.ObjectId, ref: 'Shelter' },
    lat: { type: Number },
    lon: { type: Number },
    address: { type: String },
  },
  steps: { type: [StepSchema], default: [] },
  totalDistanceMeters: { type: Number, default: 0 },
  estimatedTimeSeconds: { type: Number, default: 0 },
}, {
  timestamps: true,
});

export const Route = mongoose.models.Route || mongoose.model('Route', RouteSchema);
