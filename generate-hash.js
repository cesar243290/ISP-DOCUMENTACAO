import bcrypt from 'bcryptjs';

async function generateHash() {
  const password = 'Cloudx2025@@';
  const hash = await bcrypt.hash(password, 10);
  console.log('\n=================================');
  console.log('Password Hash Generator');
  console.log('=================================');
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('=================================\n');
  console.log('Use this hash in your seed.sql file');
  console.log('\n');
}

generateHash();
