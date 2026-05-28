import mongoose from 'mongoose'
const hospitalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    city: { type: String, required: true },
    type: { type: String, enum: ['Govt', 'Private'], required: true },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    specialties: { type: [String], default: [] },
    aqi: { type: Number },
    // Hospital Finder fields
    latitude: { type: Number },
    longitude: { type: Number },
    facilities: { type: [String], default: [] },
    emergency_support: { type: Boolean, default: false },
    ICU_count: { type: Number, default: 0 },
    bed_count: { type: Number, default: 0 },
    doctors_available: { type: Number, default: 0 },
    contact_phone: { type: String },
    address: { type: String },
    sno: { type: Number },
    // OSM Automated Data fields
    osm_id: { type: String, unique: true, sparse: true },
    district: { type: String },
    state: { type: String },
    pincode: { type: String },
    website: { type: String },
    source: { type: String, enum: ['manual', 'osm'], default: 'manual' },
    location: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number] } // [longitude, latitude]
    }
  },
  { timestamps: true }
)

// Add GeoSpatial Index
hospitalSchema.index({ location: '2dsphere' });

export default mongoose.model('Hospital', hospitalSchema)
