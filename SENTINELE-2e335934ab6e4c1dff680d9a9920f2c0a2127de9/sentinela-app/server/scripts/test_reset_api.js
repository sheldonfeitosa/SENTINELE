/**
 * Teste de Reset de Senha via API de Produção
 * Chama o endpoint /auth/reset-password e mostra a resposta
 * Uso: node scripts/test_reset_api.js
 */

const https = require('https');

const API_BASE = 'https://sentinelaai.com.br/api';
const EMAIL = 'sheldonfeitosa@gmail.com';

function postJson(url, body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function run() {
    console.log('🔍 Diagnóstico de Reset de Senha - Sentinela AI');
    console.log('================================================');
    console.log(`📧 Email: ${EMAIL}`);
    console.log(`🌐 API: ${API_BASE}\n`);

    console.log('📡 Chamando endpoint /auth/reset-password...');

    try {
        const result = await postJson(`${API_BASE}/auth/reset-password`, { email: EMAIL });

        console.log(`\n📊 Status HTTP: ${result.status}`);
        console.log('📦 Resposta:', JSON.stringify(result.data, null, 2));

        if (result.status === 200) {
            console.log('\n✅ API respondeu com SUCESSO!');
            console.log('   Isso significa que:');
            console.log('   1. O usuário foi encontrado no banco');
            console.log('   2. O token foi gerado e salvo');
            console.log('   3. O email FOI enviado pelo Resend (sem erro)');
            console.log('\n⚠️  Se o email não chegou, o problema está no:');
            console.log('   → Resend usando "onboarding@resend.dev" como remetente');
            console.log('   → Esse endereço SÓ entrega para o dono da conta Resend');
            console.log('   → OU o domínio sentinelaai.com.br ainda não está verificado no Resend');
            console.log('\n💡 SOLUÇÃO: Verifique as configurações DNS do Resend em:');
            console.log('   https://resend.com/domains');
        } else if (result.status === 400) {
            console.log('\n❌ Erro:', result.data?.error);
            if (result.data?.error?.includes('não encontrado')) {
                console.log('   → O usuário NÃO existe no banco de produção!');
            }
        } else {
            console.log('\n⚠️  Status inesperado:', result.status);
        }
    } catch (err) {
        console.log('\n❌ Erro de conexão:', err.message);
        console.log('   → Verifique se a API está online em sentinelaai.com.br');
    }

    console.log('\n================================================');
    console.log('📌 DICA: Para redefinir a senha AGORA sem depender do email,');
    console.log('   use o script de reset direto no banco de dados.');
}

run();
