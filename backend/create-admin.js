require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const pool = require('./db');

async function main() {
  if (process.env.ALLOW_SCHEMA_MIGRATION !== 'true') throw new Error('Admin provisioning requires ALLOW_SCHEMA_MIGRATION=true');
  const email = process.env.PROVISION_ADMIN_EMAIL;
  const password = process.env.PROVISION_ADMIN_PASSWORD;
  if (!email || !password) throw new Error('PROVISION_ADMIN_EMAIL and PROVISION_ADMIN_PASSWORD are required');
  const passwordHash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO users (name, email, password_hash, role, tenant_id)
     VALUES ('Runtime Administrator', $1, $2, 'admin', $3)
     ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name, password_hash=EXCLUDED.password_hash, role='admin', tenant_id=EXCLUDED.tenant_id`,
    [email, passwordHash, process.env.GOVERNANCE_TENANT_ID || 'runtime-tenant']
  );
  await pool.end();
}

main().catch(async (error) => {
  console.error(`Admin provisioning failed: ${error.message}`);
  try { await pool.end(); } catch {}
  process.exit(1);
});
