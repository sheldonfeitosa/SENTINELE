/**
 * Reset de senha via endpoint admin da API de produção
 * 
 * Fluxo:
 * 1. Loga com credenciais de SUPER_ADMIN
 * 2. Busca o userId do usuário alvo
 * 3. Usa o endpoint /admin/reset-password para definir nova senha
 * 
 * Uso:
 *   node scripts/admin_reset_senha.js <email-alvo> <nova-senha> <admin-token>
 * 
 * Exemplo:
 *   node scripts/admin_reset_senha.js sheldonfeitosa@gmail.com Sentinela@2024 eyJhbGci...
 */

const https = require('https');

const API_BASE = 'https://sentinelaai.com.br/api';

function request(method, path, body, token) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : undefined;
        const urlObj = new URL(`https://sentinelaai.com.br${path}`);

        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (data) headers['Content-Length'] = Buffer.byteLength(data);

        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + (urlObj.search || ''),
            method,
            headers
        };

        const req = https.request(options, (res) => {
            let resBody = '';
            res.on('data', chunk => resBody += chunk);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, data: JSON.parse(resBody) }); }
                catch { resolve({ status: res.statusCode, data: resBody }); }
            });
        });

        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function run() {
    const targetEmail = process.argv[2];
    const newPassword = process.argv[3];
    const adminToken = process.argv[4];

    if (!targetEmail || !newPassword || !adminToken) {
        console.log('');
        console.log('🔐 Admin Reset de Senha - Sentinela AI');
        console.log('======================================');
        console.log('');
        console.log('Uso: node scripts/admin_reset_senha.js <email> <nova-senha> <admin-jwt-token>');
        console.log('');
        console.log('Como obter o token:');
        console.log('  1. Faça login em sentinelaai.com.br com uma conta SUPER_ADMIN');
        console.log('  2. Abra o DevTools (F12) → Application → Local Storage');
        console.log('  3. Procure por "token" e copie o valor');
        console.log('');
        console.log('Exemplo:');
        console.log('  node scripts/admin_reset_senha.js sheldonfeitosa@gmail.com Sentinela@2024 eyJhbGci...');
        console.log('');
        process.exit(0);
    }

    console.log('');
    console.log('🔐 Admin Reset de Senha - Sentinela AI');
    console.log('======================================');
    console.log(`📧 Email alvo: ${targetEmail}`);
    console.log(`🔑 Nova senha: ${'*'.repeat(newPassword.length)}`);
    console.log('');

    // Passo 1: Buscar lista de usuários (para obter o userId)
    console.log('📡 Passo 1: Buscando usuários...');
    const tenantsRes = await request('GET', '/api/admin/tenants-detailed', null, adminToken);

    if (tenantsRes.status === 401 || tenantsRes.status === 403) {
        console.log('❌ Token inválido ou sem permissão de SUPER_ADMIN.');
        console.log('   Certifique-se de usar o token de uma conta com role SUPER_ADMIN.');
        process.exit(1);
    }

    if (tenantsRes.status !== 200) {
        console.log(`❌ Erro ao buscar usuários (status ${tenantsRes.status}):`, tenantsRes.data);
        process.exit(1);
    }

    // Encontrar o userId do email alvo
    let targetUserId = null;
    const tenants = tenantsRes.data;

    for (const tenant of tenants) {
        if (tenant.users) {
            const user = tenant.users.find(u => u.email === targetEmail);
            if (user) {
                targetUserId = user.id;
                console.log(`✅ Usuário encontrado: ${user.name} (ID: ${user.id}) | Tenant: ${tenant.name}`);
                break;
            }
        }
    }

    if (!targetUserId) {
        console.log(`❌ Usuário "${targetEmail}" não encontrado em nenhum tenant.`);
        process.exit(1);
    }

    // Passo 2: Resetar a senha
    console.log('\n📡 Passo 2: Resetando senha...');
    const resetRes = await request('POST', '/api/admin/reset-password', {
        userId: targetUserId,
        newPassword: newPassword
    }, adminToken);

    if (resetRes.status === 200) {
        console.log('\n✅ SENHA RESETADA COM SUCESSO!');
        console.log('======================================');
        console.log(`📧 Email:  ${targetEmail}`);
        console.log(`🔑 Senha:  ${newPassword}`);
        console.log(`🌐 Login:  https://sentinelaai.com.br`);
        console.log('');
        console.log('Acesse o sistema com as credenciais acima.');
    } else {
        console.log(`❌ Erro ao resetar senha (status ${resetRes.status}):`, resetRes.data);
    }
}

run().catch(err => {
    console.error('❌ Erro fatal:', err.message);
    process.exit(1);
});
