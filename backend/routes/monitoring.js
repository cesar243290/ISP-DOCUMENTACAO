import express from 'express';
import { randomUUID } from 'crypto';
import { db } from '../server.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/configs', (req, res) => {
  try {
    const configs = db.prepare('SELECT * FROM monitoring_configs ORDER BY created_at DESC').all();
    res.json(configs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/status', (req, res) => {
  try {
    const status = db.prepare(`
      SELECT ms.*, mc.equipment_id, mc.monitor_type, mc.target
      FROM monitoring_status ms
      JOIN monitoring_configs mc ON ms.config_id = mc.id
      ORDER BY ms.last_check DESC
    `).all();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/configs', requireRole('ADMIN', 'NOC'), (req, res) => {
  const { equipment_id, monitor_type, enabled, interval_seconds, timeout_seconds, target, port, threshold_warning, threshold_critical } = req.body;
  try {
    const id = randomUUID();
    db.prepare(`
      INSERT INTO monitoring_configs (id, equipment_id, monitor_type, enabled, interval_seconds, timeout_seconds, target, port, threshold_warning, threshold_critical)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, equipment_id, monitor_type, enabled, interval_seconds, timeout_seconds, target, port, threshold_warning, threshold_critical);
    res.status(201).json(db.prepare('SELECT * FROM monitoring_configs WHERE id = ?').get(id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/acknowledge/:statusId', requireRole('ADMIN', 'NOC'), (req, res) => {
  const { notes } = req.body;
  try {
    const id = randomUUID();
    db.prepare('INSERT INTO alert_acknowledgements (id, monitoring_status_id, acknowledged_by, notes) VALUES (?, ?, ?, ?)')
      .run(id, req.params.statusId, req.user.id, notes);
    res.status(201).json({ message: 'Alerta reconhecido' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/configs/:id', requireRole('ADMIN', 'NOC'), (req, res) => {
  try {
    db.prepare('DELETE FROM monitoring_configs WHERE id = ?').run(req.params.id);
    res.json({ message: 'Configuração deletada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
