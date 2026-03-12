import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';
import { encrypt, decrypt } from '../utils/encryption.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT e.*, p.name as pop_name
      FROM equipment e
      LEFT JOIN pops p ON e.pop_id = p.id
      ORDER BY e.name
    `);
    res.json(rows);
  } catch (error) {
    console.error('Get equipment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT e.*, p.name as pop_name
      FROM equipment e
      LEFT JOIN pops p ON e.pop_id = p.id
      WHERE e.id = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Get equipment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { pop_id, name, type, manufacturer, model, serial_number, ip_address, management_ip, status, location, rack_position, notes } = req.body;

    const [result] = await db.execute(
      `INSERT INTO equipment (pop_id, name, type, manufacturer, model, serial_number, ip_address, management_ip, status, location, rack_position, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [pop_id, name, type, manufacturer, model, serial_number, ip_address, management_ip, status || 'active', location, rack_position, notes]
    );

    await logAudit(req.user.id, 'create', 'equipment', result.insertId, { name, type }, req);

    const [newEquipment] = await db.execute('SELECT * FROM equipment WHERE id = ?', [result.insertId]);
    res.status(201).json(newEquipment[0]);
  } catch (error) {
    console.error('Create equipment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { pop_id, name, type, manufacturer, model, serial_number, ip_address, management_ip, status, location, rack_position, notes } = req.body;

    await db.execute(
      `UPDATE equipment SET pop_id = ?, name = ?, type = ?, manufacturer = ?, model = ?, serial_number = ?,
       ip_address = ?, management_ip = ?, status = ?, location = ?, rack_position = ?, notes = ?, updated_at = NOW()
       WHERE id = ?`,
      [pop_id, name, type, manufacturer, model, serial_number, ip_address, management_ip, status, location, rack_position, notes, req.params.id]
    );

    await logAudit(req.user.id, 'update', 'equipment', req.params.id, { name, type }, req);

    const [updated] = await db.execute('SELECT * FROM equipment WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('Update equipment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await logAudit(req.user.id, 'delete', 'equipment', req.params.id, {}, req);
    await db.execute('DELETE FROM equipment WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    console.error('Delete equipment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/credentials', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, equipment_id, username, credential_type, port, notes, created_at FROM equipment_credentials WHERE equipment_id = ?',
      [req.params.id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Get credentials error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/credentials', authenticateToken, async (req, res) => {
  try {
    const { username, password, credential_type, port, notes } = req.body;
    const encryptedPassword = encrypt(password);

    const [result] = await db.execute(
      'INSERT INTO equipment_credentials (equipment_id, username, password_encrypted, credential_type, port, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [req.params.id, username, encryptedPassword, credential_type || 'ssh', port || 22, notes]
    );

    await logAudit(req.user.id, 'create_credential', 'equipment_credential', result.insertId, { equipment_id: req.params.id, username }, req);

    const [newCred] = await db.execute(
      'SELECT id, equipment_id, username, credential_type, port, notes, created_at FROM equipment_credentials WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json(newCred[0]);
  } catch (error) {
    console.error('Create credential error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:equipmentId/credentials/:id/decrypt', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can decrypt passwords' });
    }

    const [rows] = await db.execute(
      'SELECT password_encrypted FROM equipment_credentials WHERE id = ? AND equipment_id = ?',
      [req.params.id, req.params.equipmentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    const decryptedPassword = decrypt(rows[0].password_encrypted);

    await logAudit(req.user.id, 'decrypt_password', 'equipment_credential', req.params.id, { equipment_id: req.params.equipmentId }, req);

    res.json({ password: decryptedPassword });
  } catch (error) {
    console.error('Decrypt password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:equipmentId/credentials/:id', authenticateToken, async (req, res) => {
  try {
    await logAudit(req.user.id, 'delete', 'equipment_credential', req.params.id, { equipment_id: req.params.equipmentId }, req);
    await db.execute('DELETE FROM equipment_credentials WHERE id = ? AND equipment_id = ?', [req.params.id, req.params.equipmentId]);
    res.status(204).send();
  } catch (error) {
    console.error('Delete credential error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
