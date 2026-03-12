import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT c.*,
        pa.name as a_side_pop_name,
        pz.name as z_side_pop_name
      FROM circuits c
      LEFT JOIN pops pa ON c.a_side_pop_id = pa.id
      LEFT JOIN pops pz ON c.z_side_pop_id = pz.id
      ORDER BY c.circuit_id
    `);
    res.json(rows);
  } catch (error) {
    console.error('Get circuits error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { circuit_id, provider, type, bandwidth, a_side_pop_id, z_side_pop_id, a_side_interface_id, z_side_interface_id, status, monthly_cost, contract_start, contract_end, notes } = req.body;

    const [result] = await db.execute(
      `INSERT INTO circuits (circuit_id, provider, type, bandwidth, a_side_pop_id, z_side_pop_id, a_side_interface_id, z_side_interface_id, status, monthly_cost, contract_start, contract_end, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [circuit_id, provider, type, bandwidth, a_side_pop_id, z_side_pop_id, a_side_interface_id, z_side_interface_id, status || 'active', monthly_cost, contract_start, contract_end, notes]
    );

    await logAudit(req.user.id, 'create', 'circuit', result.insertId, { circuit_id, provider }, req);

    const [newCircuit] = await db.execute('SELECT * FROM circuits WHERE id = ?', [result.insertId]);
    res.status(201).json(newCircuit[0]);
  } catch (error) {
    console.error('Create circuit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { circuit_id, provider, type, bandwidth, a_side_pop_id, z_side_pop_id, a_side_interface_id, z_side_interface_id, status, monthly_cost, contract_start, contract_end, notes } = req.body;

    await db.execute(
      `UPDATE circuits SET circuit_id = ?, provider = ?, type = ?, bandwidth = ?, a_side_pop_id = ?, z_side_pop_id = ?, a_side_interface_id = ?, z_side_interface_id = ?, status = ?, monthly_cost = ?, contract_start = ?, contract_end = ?, notes = ?, updated_at = NOW()
       WHERE id = ?`,
      [circuit_id, provider, type, bandwidth, a_side_pop_id, z_side_pop_id, a_side_interface_id, z_side_interface_id, status, monthly_cost, contract_start, contract_end, notes, req.params.id]
    );

    await logAudit(req.user.id, 'update', 'circuit', req.params.id, { circuit_id, provider }, req);

    const [updated] = await db.execute('SELECT * FROM circuits WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('Update circuit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await logAudit(req.user.id, 'delete', 'circuit', req.params.id, {}, req);
    await db.execute('DELETE FROM circuits WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    console.error('Delete circuit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
