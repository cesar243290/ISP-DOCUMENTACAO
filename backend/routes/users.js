import express from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { db } from '../server.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', requireRole('ADMIN'), (req, res) => {
  try {
    const users = db.prepare('SELECT id, email, full_name, role, active, created_at, updated_at FROM users ORDER BY created_at DESC').all();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', requireRole('ADMIN'), (req, res) => {
  try {
    const user = db.prepare('SELECT id, email, full_name, role, active, created_at, updated_at FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', requireRole('ADMIN'), (req, res) => {
  const { email, password, full_name, role } = req.body;
  if (!email || !password || !full_name || !role) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }

  try {
    const id = randomUUID();
    const password_hash = bcrypt.hashSync(password, 10);

    db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, role, active)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(id, email, password_hash, full_name, role);

    const user = db.prepare('SELECT id, email, full_name, role, active, created_at FROM users WHERE id = ?').get(id);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', requireRole('ADMIN'), (req, res) => {
  const { email, full_name, role, active } = req.body;

  try {
    db.prepare(`
      UPDATE users
      SET email = ?, full_name = ?, role = ?, active = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(email, full_name, role, active, req.params.id);

    const user = db.prepare('SELECT id, email, full_name, role, active, created_at, updated_at FROM users WHERE id = ?').get(req.params.id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', requireRole('ADMIN'), (req, res) => {
  try {
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
