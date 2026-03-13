import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || './data/ispnoc.db';
const dataDir = path.dirname(DB_PATH);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`✓ Diretório criado: ${dataDir}`);
}

const db = new Database(DB_PATH);
console.log(`✓ Conectado ao banco: ${DB_PATH}`);

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

const statements = schema
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0);

console.log(`\n📦 Executando ${statements.length} comandos SQL...\n`);

db.exec('BEGIN TRANSACTION');

try {
  for (const statement of statements) {
    if (statement.trim()) {
      db.exec(statement);
    }
  }

  const passwordHash = bcrypt.hashSync('Admin@123', 10);

  const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@ispnoc.local');

  if (!adminExists) {
    db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, role, active)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), 'admin@ispnoc.local', passwordHash, 'Administrador', 'ADMIN', 1);
    console.log('✓ Usuário admin criado');
  } else {
    console.log('✓ Usuário admin já existe');
  }

  db.exec('COMMIT');
  console.log('\n✅ Banco de dados inicializado com sucesso!\n');

  console.log('📊 Estatísticas:');
  const tables = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all();

  console.log(`   - ${tables.length} tabelas criadas`);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  console.log(`   - ${userCount.count} usuário(s) cadastrado(s)`);

  console.log('\n🔐 Credenciais padrão:');
  console.log('   Email: admin@ispnoc.local');
  console.log('   Senha: Admin@123');
  console.log('\n⚠️  IMPORTANTE: Altere a senha após o primeiro login!\n');

} catch (error) {
  db.exec('ROLLBACK');
  console.error('❌ Erro ao inicializar banco:', error);
  process.exit(1);
} finally {
  db.close();
}
