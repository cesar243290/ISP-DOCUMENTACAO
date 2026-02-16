import jwt from 'jsonwebtoken';
import { db } from '../server.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const session = db.prepare('SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")').get(token);

    if (!session) {
      return res.status(401).json({ error: 'Sessão expirada ou inválida' });
    }

    const user = db.prepare('SELECT id, email, full_name, role, active FROM users WHERE id = ?').get(decoded.userId);

    if (!user || !user.active) {
      return res.status(401).json({ error: 'Usuário inválido ou inativo' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Sem permissão para esta ação' });
    }

    next();
  };
};

export const logAudit = (action, entityType) => {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        try {
          const entityId = data?.id || req.params?.id || null;
          const changes = JSON.stringify({
            body: req.body,
            params: req.params,
            query: req.query
          });

          db.prepare(`
            INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, changes, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            crypto.randomUUID(),
            req.user.id,
            action,
            entityType,
            entityId,
            changes,
            req.ip,
            req.get('user-agent')
          );
        } catch (error) {
          console.error('Erro ao registrar auditoria:', error);
        }
      }

      return originalJson(data);
    };

    next();
  };
};
