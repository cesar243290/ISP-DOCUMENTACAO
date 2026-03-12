import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import popsRoutes from './routes/pops.js';
import equipmentRoutes from './routes/equipment.js';
import vlansRoutes from './routes/vlans.js';
import circuitsRoutes from './routes/circuits.js';
import usersRoutes from './routes/users.js';
import auditRoutes from './routes/audit.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/pops', popsRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/vlans', vlansRoutes);
app.use('/api/circuits', circuitsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/audit', auditRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
