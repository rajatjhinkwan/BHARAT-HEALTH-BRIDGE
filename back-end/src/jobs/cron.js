import cron from 'node-cron';
import { fetchHospitalsFromOSM } from '../services/osmService.js';

// Define regions to keep synced
const SYNC_REGIONS = ['Dehradun', 'Delhi', 'Uttarakhand'];

export function initCronJobs() {
  console.log('[Cron] Initializing scheduled jobs...');

  // Run at 2:00 AM every day
  cron.schedule('0 2 * * *', async () => {
    console.log('[Cron] Starting daily OSM hospital sync...');
    
    for (const region of SYNC_REGIONS) {
      try {
        await fetchHospitalsFromOSM(region);
        // Wait 30 seconds between regions to respect Overpass API rate limits
        await new Promise(resolve => setTimeout(resolve, 30000));
      } catch (err) {
        console.error(`[Cron] Failed to sync region ${region}:`, err.message);
      }
    }
    
    console.log('[Cron] Daily OSM hospital sync completed.');
  });
}
