const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const DB_URL = 'postgresql://neondb_owner:npg_9JCwW1azkXPM@ep-divine-rain-ac8cy96b-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const TARGET_EMAIL = 'sheldonfeitosa@gmail.com';
const NEW_PASSWORD = process.argv[2] || 'Sentinela@2024';

async function run() {
    const client = new Client({ connectionString: DB_URL });
    await client.connect();
    console.log('Conectado ao banco de producao (Neon).');

    // Verify user exists
    const check = await client.query('SELECT id, email, name, role FROM "User" WHERE email = $1', [TARGET_EMAIL]);
    if (check.rows.length === 0) {
        console.log('ERRO: Usuario nao encontrado:', TARGET_EMAIL);
        await client.end();
        return;
    }
    const user = check.rows[0];
    console.log('Usuario encontrado:', user.name, '| Role:', user.role, '| ID:', user.id);

    // Hash new password
    const hash = await bcrypt.hash(NEW_PASSWORD, 10);

    // Update password
    const result = await client.query(
        'UPDATE "User" SET password = $1, "resetToken" = NULL, "resetTokenExpiry" = NULL WHERE email = $2 RETURNING id, email',
        [hash, TARGET_EMAIL]
    );

    if (result.rows.length > 0) {
        console.log('\n=================================');
        console.log('  SENHA RESETADA COM SUCESSO!');
        console.log('=================================');
        console.log('  Email: ', TARGET_EMAIL);
        console.log('  Senha: ', NEW_PASSWORD);
        console.log('  Login: https://sentinelaai.com.br');
        console.log('=================================');
    } else {
        console.log('ERRO: Update nao afetou nenhuma linha.');
    }

    await client.end();
}

run().catch(err => {
    console.error('Erro fatal:', err.message);
    process.exit(1);
});
