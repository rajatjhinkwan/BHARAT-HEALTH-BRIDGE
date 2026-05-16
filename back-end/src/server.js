import dotenv from 'dotenv'
import express from 'express'
import mongoose from 'mongoose'
import morgan from 'morgan'
import cors from 'cors'
import { Server } from 'socket.io'
import http from 'http'

dotenv.config()

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*',
  }
})

const PORT = process.env.PORT || 4000
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bhb'

app.use(cors())
app.use(express.json())
app.use(morgan('dev'))
app.use('/uploads', express.static('uploads'))

// Attach io to app to use in routes
app.set('io', io)

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id)
  socket.on('disconnect', () => console.log('Client disconnected'))
})

mongoose
  .connect(MONGO_URI, { dbName: 'bhb' })
  .then(() => {
    console.log('MongoDB connected')
  })
  .catch((err) => {
    console.warn('MongoDB connection error (check IP Whitelist!):', err.message);
  })

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'Bharat Health Bridge API', version: '1.0.0' })
})

// Modular routes
app.use('/api', (await import('./routes/index.js')).default)

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
})

