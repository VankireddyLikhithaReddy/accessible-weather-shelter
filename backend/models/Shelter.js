import mongoose from 'mongoose';

const { Schema } = mongoose;

const AccessibilitySchema = new Schema({
  wheelchairAccessible: { type: Boolean, default: false },
  signLanguageSupport: { type: Boolean, default: false },
  brailleSignage: { type: Boolean, default: false },
}, { _id: false });

const ShelterSchema = new Schema({
  name: { type: String, required: true, index: true },
  address: { type: String },
  phone: { type: String },
  capacity: { type: Number },
  info: { type: String },
  accessibility: { type: AccessibilitySchema, default: {} },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
}, {
  timestamps: true,
});

ShelterSchema.index({ location: '2dsphere' });

export const Shelter = mongoose.models.Shelter || mongoose.model('Shelter', ShelterSchema);
