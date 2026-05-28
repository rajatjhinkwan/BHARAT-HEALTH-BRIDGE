import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BloodDonor from './src/models/BloodDonor.js';
import { BLOOD_DONORS } from './src/lib/bloodDonors.js';

dotenv.config();

const run = async () => {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bhb';
  console.log('Connecting to Mongo at:', MONGO_URI);
  try {
    await mongoose.connect(MONGO_URI, { dbName: 'bhb' });
    console.log('Successfully connected to database!');
    
    console.log('Deleting all existing blood donors...');
    const deleteResult = await BloodDonor.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} blood donors.`);

    console.log(`Mapping and preparing ${BLOOD_DONORS.length} new donors...`);
    const docs = BLOOD_DONORS.map((d) => {
      let lat = 30.0;
      let lng = 79.0;
      if (d.district === 'Almora') { lat = 29.5976; lng = 79.6093; }
      else if (d.district === 'Chamoli') { lat = 30.4075; lng = 79.3187; }
      else if (d.district === 'Bageshwar') { lat = 29.8369; lng = 79.7748; }
      else if (d.district === 'Dehradun') { lat = 30.3165; lng = 78.0322; }
      else if (d.district === 'Haridwar') { lat = 29.9457; lng = 78.1642; }
      else if (d.district === 'Nainital') { lat = 29.3803; lng = 79.4636; }
      else if (d.district === 'Pauri Garhwal') { lat = 30.1470; lng = 78.7782; }
      else if (d.district === 'Pithoragarh') { lat = 29.5829; lng = 80.2179; }
      else if (d.district === 'Rudraprayag') { lat = 30.2847; lng = 78.9815; }
      else if (d.district === 'Tehri Garhwal') { lat = 30.3782; lng = 78.4334; }
      else if (d.district === 'Udham Singh Nagar') { lat = 28.9845; lng = 79.4032; }
      else if (d.district === 'Uttarkashi') { lat = 30.7268; lng = 78.4354; }
      else if (d.district === 'Champawat') { lat = 29.3338; lng = 80.0909; }
      
      // Add small random noise to scatter coordinates
      lat += (Math.random() - 0.5) * 0.05;
      lng += (Math.random() - 0.5) * 0.05;

      return {
        name: d.name,
        phone: d.phone || '9999999999',
        district: d.district,
        city: d.city,
        bloodType: d.bloodType,
        verified: d.verified ?? true,
        latitude: lat,
        longitude: lng,
      };
    });

    console.log('Inserting blood donors into database...');
    const insertResult = await BloodDonor.insertMany(docs);
    console.log(`Successfully seeded ${insertResult.length} blood donors!`);
    
    // Quick double check
    const count = await BloodDonor.countDocuments();
    console.log(`Verified BloodDonors count in database: ${count}`);
  } catch (err) {
    console.error('Error seeding blood donors:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
    process.exit(0);
  }
};

run();
