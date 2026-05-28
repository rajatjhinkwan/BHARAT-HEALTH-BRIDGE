import axios from 'axios';
import { Hospital } from '../models/index.js';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

/**
 * Fetch hospitals for a given region (e.g., 'Dehradun', 'Delhi')
 */
export async function fetchHospitalsFromOSM(regionName) {
  try {
    console.log(`[OSM] Fetching hospitals for ${regionName}...`);
    
    // Dynamic Overpass Query
    const query = `
      [out:json][timeout:25];
      area["name"="${regionName}"]->.searchArea;
      (
        node["amenity"="hospital"](area.searchArea);
        way["amenity"="hospital"](area.searchArea);
        relation["amenity"="hospital"](area.searchArea);
        
        node["amenity"="clinic"](area.searchArea);
        way["amenity"="clinic"](area.searchArea);
        
        node["healthcare"="hospital"](area.searchArea);
        node["emergency"="yes"](area.searchArea);
      );
      out center;
    `;

    const response = await axios.post(OVERPASS_URL, `data=${encodeURIComponent(query)}`, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 30000
    });

    if (!response.data || !response.data.elements) {
      throw new Error('Invalid response from Overpass API');
    }

    const elements = response.data.elements;
    console.log(`[OSM] Found ${elements.length} raw medical facilities in ${regionName}.`);

    return processOSMData(elements, regionName);
  } catch (error) {
    console.error(`[OSM] Error fetching data for ${regionName}:`, error.message);
    throw error;
  }
}

/**
 * Process raw OSM elements into Hospital documents
 */
async function processOSMData(elements, defaultCity) {
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const el of elements) {
    try {
      const tags = el.tags || {};
      
      // Must have a name to be useful for the UI
      if (!tags.name) {
        skipped++;
        continue;
      }

      // Determine Coordinates
      const lat = el.lat || (el.center && el.center.lat);
      const lon = el.lon || (el.center && el.center.lon);
      
      if (!lat || !lon) {
        skipped++;
        continue;
      }

      // Determine Type
      let type = 'Private';
      if (tags.operator && (tags.operator.toLowerCase().includes('government') || tags.operator.toLowerCase().includes('municipal'))) {
        type = 'Govt';
      }

      // Determine Emergency Support
      const emergency_support = tags.emergency === 'yes' || tags['healthcare:speciality']?.includes('emergency');

      // Facilities
      const facilities = [];
      if (tags.emergency === 'yes') facilities.push('Emergency Center');
      if (tags.wheelchair === 'yes') facilities.push('Wheelchair Accessible');
      if (tags['amenity'] === 'clinic') facilities.push('Clinic');

      // Parse Address
      const city = tags['addr:city'] || defaultCity;
      const district = tags['addr:district'] || '';
      const state = tags['addr:state'] || '';
      const pincode = tags['addr:postcode'] || '';
      
      let fullAddress = '';
      if (tags['addr:full']) fullAddress = tags['addr:full'];
      else {
        const parts = [tags['addr:housenumber'], tags['addr:street'], tags['addr:suburb'], city, pincode].filter(Boolean);
        fullAddress = parts.join(', ');
      }

      // Detect Duplicates
      // 1. Check by OSM ID
      const osm_id = `${el.type}/${el.id}`;
      let existingHospital = await Hospital.findOne({ osm_id });

      // 2. Check by close proximity + exact name
      if (!existingHospital) {
        existingHospital = await Hospital.findOne({
          name: tags.name,
          location: {
            $near: {
              $geometry: { type: "Point", coordinates: [lon, lat] },
              $maxDistance: 200 // 200 meters
            }
          }
        });
      }

      const updateData = {
        name: tags.name,
        city,
        district,
        state,
        pincode,
        type,
        latitude: lat,
        longitude: lon,
        location: {
          type: 'Point',
          coordinates: [lon, lat]
        },
        address: fullAddress || city,
        contact_phone: tags.phone || tags['contact:phone'] || '',
        website: tags.website || tags['contact:website'] || '',
        emergency_support,
        facilities,
        source: 'osm'
      };

      if (existingHospital) {
        // Update only empty fields to not overwrite manual edits
        const fieldsToUpdate = {};
        for (const [k, v] of Object.entries(updateData)) {
          if (!existingHospital[k] && v) {
            fieldsToUpdate[k] = v;
          }
        }
        
        if (Object.keys(fieldsToUpdate).length > 0) {
          await Hospital.updateOne({ _id: existingHospital._id }, { $set: fieldsToUpdate });
          updated++;
        } else {
          skipped++;
        }
      } else {
        // Insert new
        updateData.osm_id = osm_id;
        // Generate random mock stats if needed since OSM doesn't provide them reliably
        updateData.bed_count = Math.floor(Math.random() * 200) + 20;
        updateData.ICU_count = Math.floor(updateData.bed_count * 0.15);
        updateData.doctors_available = Math.floor(updateData.bed_count * 0.2);
        updateData.rating = (Math.random() * 2 + 3).toFixed(1); // 3.0 - 5.0
        
        await Hospital.create(updateData);
        inserted++;
      }
    } catch (err) {
      console.warn(`[OSM] Skipped element ${el.id} due to error:`, err.message);
      skipped++;
    }
  }

  console.log(`[OSM] Sync Complete for ${defaultCity}: Inserted ${inserted}, Updated ${updated}, Skipped ${skipped}`);
  return { inserted, updated, skipped };
}
