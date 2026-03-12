import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM vlans ORDER BY vlan_id');
    res.json(rows);
  } catch (error) {
    console.error('Get VLANs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { vlan_id, name, description, subnet, gateway, status } = req.body;

    const [result] = await db.execute(
      'INSERT INTO vlans (vlan_id, name, description, subnet, gateway, status) VALUES (?, ?, ?, ?, ?, ?)',
      [vlan_id, name, description, subnet, gateway, status || 'active']
    );

    await logAudit(req.user.id, 'create', 'vlan', result.insertId, { vlan_id, name }, req);

    const [newVlan] = await db.execute('SELECT * FROM vlans WHERE id = ?', [result.insertId]);
    res.status(201).json(newVlan[0]);
  } catch (error) {
    console.error('Create VLAN error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { vlan_id, name, description, subnet, gateway, status } = req.body;

    await db.execute(
      'UPDATE vlans SET vlan_id = ?, name = ?, description = ?, subnet = ?, gateway = ?, status = ?, updated_at = NOW() WHERE id = ?',
      [vlan_id, name, description, subnet, gateway, status, req.params.id]
    );

    await logAudit(req.user.id, 'update', 'vlan', req.params.id, { vlan_id, name }, req);

    const [updated] = await db.execute('SELECT * FROM vlans WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('Update VLAN error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await logAudit(req.user.id, 'delete', 'vlan', req.params.id, {}, req);
    await db.execute('DELETE FROM vlans WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    console.error('Delete VLAN error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
