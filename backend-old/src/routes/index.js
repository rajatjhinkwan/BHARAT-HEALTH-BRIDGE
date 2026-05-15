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


export default api
