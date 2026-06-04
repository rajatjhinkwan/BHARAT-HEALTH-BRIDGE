import users from './users.js'
import hospitals from './hospitals.js'
import bills from './bills.js'
import emergency from './emergency.js'
import clinical from './clinical.js'
import beds from './beds.js'
import queue from './queueRoutes.js'
import workflow from './workflow.js'
import appointments from './appointments.js'
import criticalCare from './criticalCare.js'
import medicalHistory from './medicalHistory.js'
import premium from './premium.js'
import catalog from './catalog.js'
import donors from './donors.js'
import patientPortal from './patientPortal.js'
import laboratory from './laboratory.js'
import radiology from './radiology.js'
import pharmacy from './pharmacy.js'
import doctors from './doctors.js'
import machines from './machines.js'
import admin from './admin.js'
import registrations from './registrations.js'
import blockchain from './blockchain.js'
import hr from './hr.js'
import { Router } from 'express'

const api = Router()
api.use('/users', users)
api.use('/hospitals', hospitals)
api.use('/bills', bills)
api.use('/emergency', emergency)
api.use('/clinical', clinical)
api.use('/beds', beds)
api.use('/queue', queue)
api.use('/workflow', workflow)
api.use('/appointments', appointments)
api.use('/critical', criticalCare)
api.use('/history', medicalHistory)
api.use('/premium', premium)
api.use('/donors', donors)
api.use('/patient', patientPortal)
api.use('/laboratory', laboratory)
api.use('/radiology', radiology)
api.use('/pharmacy', pharmacy)
api.use('/doctors', doctors)
api.use('/machines', machines)
api.use('/admin', admin)
api.use('/registrations', registrations)
api.use('/blockchain', blockchain)
api.use('/hr', hr)
api.use('/', catalog)


export default api
