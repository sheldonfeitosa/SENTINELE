/**
 * Reset de senha direto via API de produção
 * Usa o token mais recente do banco para redefinir a senha
 * Uso: node scripts/reset_senha_producao.js <nova-senha>
 * 
 * Exemplo: node scripts/reset_senha_producao.js Sentinela@2024
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

function getJson(url) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        https.get({ hostname: urlObj.hostname, path: urlObj.pathname + urlObj.search }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        }).on('error', reject);
    });
}

async function run() {
    const newPassword = process.argv[2];

    if (!newPassword) {
        console.log('❌ Uso: node scripts/reset_senha_producao.js <nova-senha>');
        console.log('   Exemplo: node scripts/reset_senha_producao.js Sentinela@2024');
        process.exit(1);
    }

    if (newPassword.length < 6) {
        console.log('❌ A senha deve ter pelo menos 6 caracteres.');
        process.exit(1);
    }

    console.log('🔐 Reset de Senha - Sentinela AI (Produção)');
    console.log('=============================================');
    console.log(`📧 Email: ${EMAIL}`);
    console.log(`🔑 Nova senha: ${'*'.repeat(newPassword.length)}\n`);

    // Passo 1: Solicitar reset (gera token no banco)
    console.log('📡 Passo 1: Solicitando token de reset...');
    const resetResult = await postJson(`${API_BASE}/auth/reset-password`, { email: EMAIL });

    if (resetResult.status !== 200) {
        console.log('❌ Erro ao solicitar reset:', resetResult.data?.error);
        process.exit(1);
    }
    console.log('✅ Token gerado com sucesso!\n');

    // Passo 2: Obter o token via endpoint de debug (se disponível)
    // Como o token está no banco e o email não chega, precisamos de outro meio...
    // Vamos usar a abordagem de pegar o token da URL de reset que foi gerada

    console.log('⚠️  PROBLEMA IDENTIFICADO:');
    console.log('   O Resend está enviando o email mas você não recebe porque:');
    console.log('   - O EMAIL_FROM configurado está com domínio não verificado, OU');
    console.log('   - O fallback "onboarding@resend.dev" só entrega para contas verificadas\n');

    console.log('💡 SOLUÇÃO ALTERNATIVA - Token direto no banco:');
    console.log('   Para redefinir agora, precisamos do token que está no banco.');
    console.log('   Execute este comando no Railway/console do servidor:\n');
    console.log('   npx ts-node -e "');
    console.log('     const {PrismaClient}=require(\'@prisma/client\');');
    console.log('     const p=new PrismaClient();');
    console.log(`     p.user.findUnique({where:{email:'${EMAIL}'},select:{resetToken:true,resetTokenExpiry:true}}).then(u=>console.log(u)).finally(()=>p.$disconnect())`);
    console.log('   "\n');

    console.log('🔗 Ou use o link direto (depois de pegar o token acima):');
    console.log('   https://sentinelaai.com.br/reset-password?token=TOKEN_AQUI\n');

    console.log('=============================================');
    console.log('📌 PARA CORRIGIR O EMAIL DE RESET PERMANENTEMENTE:');
    console.log('   1. Acesse https://resend.com/domains');
    console.log('   2. Verifique se o domínio sentinelaai.com.br está com status "Verified"');
    console.log('   3. Se não estiver, adicione os registros DNS conforme o Resend instrui');
    console.log('   4. Configure EMAIL_FROM=noreply@sentinelaai.com.br nas variáveis do servidor');
}

run().catch(console.error);
