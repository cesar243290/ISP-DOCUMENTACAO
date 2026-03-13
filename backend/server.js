import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = process.env.DB_PATH || './data/ispnoc.db';

if (!fs.existsSync(DB_PATH)) {
  console.error('❌ Banco de dados não encontrado!');
  console.error('Execute: npm run init-db');
  process.exit(1);
}

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

console.log('✓ Conectado ao banco de dados');

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Muitas requisições deste IP, tente novamente mais tarde.'
});

app.use('/api/', limiter);

app.get('/api/health', (req, res) => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'connected',
    users: userCount.count
  });
});

import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import popsRoutes from './routes/pops.js';
import equipmentsRoutes from './routes/equipments.js';
import interfacesRoutes from './routes/interfaces.js';
import vlansRoutes from './routes/vlans.js';
import ipamRoutes from './routes/ipam.js';
import circuitsRoutes from './routes/circuits.js';
import servicesRoutes from './routes/services.js';
import runbooksRoutes from './routes/runbooks.js';
import checklistsRoutes from './routes/checklists.js';
import auditRoutes from './routes/audit.js';
import monitoringRoutes from './routes/monitoring.js';

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/pops', popsRoutes);
app.use('/api/equipments', equipmentsRoutes);
app.use('/api/interfaces', interfacesRoutes);
app.use('/api/vlans', vlansRoutes);
app.use('/api/ipam', ipamRoutes);
app.use('/api/circuits', circuitsRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/runbooks', runbooksRoutes);
app.use('/api/checklists', checklistsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/monitoring', monitoringRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 ISP NOC Backend rodando na porta ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

process.on('SIGINT', () => {
  console.log('\n\n📴 Fechando servidor...');
  db.close();
  process.exit(0);
});
