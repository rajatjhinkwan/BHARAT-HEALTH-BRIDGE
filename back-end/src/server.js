import dotenv from 'dotenv'
import express from 'express'
import mongoose from 'mongoose'
import morgan from 'morgan'
import cors from 'cors'
import { Server } from 'socket.io'
import http from 'http'
import { notFound, errorHandler } from './middleware/errorHandler.js'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const CLIENT_URL = process.env.CLIENT_URL || '*'
const allowedOrigins = CLIENT_URL === '*' 
  ? ['http://localhost:5173', 'http://127.0.0.1:5173']
  : CLIENT_URL.split(',').map((s) => s.trim());

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
})

const PORT = process.env.PORT || 4000
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bhb'

app.use(cors({ origin: CLIENT_URL === '*' ? true : allowedOrigins }))
app.use(express.json())
app.use(morgan('dev'))
app.use('/uploads', express.static('uploads'))

const frontendDist = path.join(__dirname, '../../front-end/dist')
app.use(express.static(frontendDist))

// Attach io to app to use in routes
app.set('io', io)

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id)

  socket.on('joinPatient', (patientId) => {
    if (patientId) {
      socket.join(`patient:${patientId}`)
      console.log(`Socket ${socket.id} joined patient:${patientId}`)
    }
  })

  socket.on('leavePatient', (patientId) => {
    if (patientId) socket.leave(`patient:${patientId}`)
  })

  socket.on('joinPharmacy', () => {
    socket.join('pharmacy')
    console.log(`Socket ${socket.id} joined pharmacy room`)
  })

  socket.on('leavePharmacy', () => {
    socket.leave('pharmacy')
  })

  socket.on('disconnect', () => console.log('Client disconnected'))
})

mongoose
  .connect(MONGO_URI, { dbName: 'bhb' })
  .then(async () => {
    console.log('MongoDB connected')
    try {
      const { ensureBootstrapData } = await import('./lib/bootstrapData.js')
      await ensureBootstrapData()
      
      // Initialize Scheduled Jobs (OSM Data Sync)
      const { initCronJobs } = await import('./jobs/cron.js')
      initCronJobs()
    } catch (e) {
      console.warn('Bootstrap data skipped:', e.message)
    }
  })
  .catch((err) => {
    console.warn('MongoDB connection error (check IP Whitelist!):', err.message);
  })

// Root entrypoint message
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Welcome to Bharat Health Bridge API. Please use /api/health for checking service status.',
    docs: 'https://github.com/rajatjhinkwan/BHARAT-HEALTH-BRIDGE'
  })
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'Bharat Health Bridge API', version: '1.0.0' })
})

// Modular routes
app.use('/api', (await import('./routes/index.js')).default)

// Fallback wildcard to serve built frontend SPA index.html for all subroutes
app.get(/.*/, (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next()
  }
  res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
    if (err) {
      next()
    }
  })
})

app.use(notFound)
app.use(errorHandler)

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT} (externally accessible)`)
})

