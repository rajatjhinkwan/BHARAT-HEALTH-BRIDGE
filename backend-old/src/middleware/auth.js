import jwt from 'jsonwebtoken'
import { User } from '../models/index.js'

export const protect = async (req, res, next) => {
    const auth = req.headers.authorization
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
        const token = auth.split(' ')[1]
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev')
        const user = await User.findById(decoded.sub).select('-password')
        if (!user) return res.status(401).json({ error: 'User not found' })

        req.user = user
        next()
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' })
    }
}
