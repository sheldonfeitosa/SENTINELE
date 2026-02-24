const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const { Resend } = require('resend');

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';
const APP_URL = process.env.APP_URL || 'https://sentinelaai.com.br';

async function run() {
    const email = 'sheldonfeitosa@gmail.com';

    // 1. Busca o usuário
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.log('❌ Usuário não encontrado:', email);
        await prisma.$disconnect();
        return;
    }
    console.log('✅ Usuário encontrado:', user.name, '| Role:', user.role);

    // 2. Gera token e salva no banco
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hora

    await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: token, resetTokenExpiry: expiry }
    });

    const resetLink = `${APP_URL}/reset-password?token=${token}`;
    console.log('\n🔗 Link de reset gerado (válido por 1h):');
    console.log(resetLink);

    // 3. Testa envio do email
    console.log('\n📧 Tentando enviar email via Resend...');
    console.log('   FROM:', EMAIL_FROM);
    console.log('   TO:', email);

    try {
        const { data, error } = await resend.emails.send({
            from: EMAIL_FROM,
            to: email,
            subject: 'Redefinição de Senha - Sentinela AI',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #003366;">Recuperação de Senha - Sentinela AI</h2>
                    <p>Olá <strong>${user.name}</strong>,</p>
                    <p>Clique no botão abaixo para redefinir sua senha. O link expira em 1 hora.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" style="background-color: #003366; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                            REDEFINIR MINHA SENHA
                        </a>
                    </div>
                    <p style="color: #666; font-size: 13px;">Se o botão não funcionar, copie e cole este link:</p>
                    <p style="color: #003366; font-size: 12px; word-break: break-all;">${resetLink}</p>
                    <hr style="margin-top: 30px; border: 0; border-top: 1px solid #eee;">
                    <p style="color: #888; font-size: 12px; text-align: center;">Equipe Sentinela AI</p>
                </div>
            `
        });

        if (error) {
            console.log('❌ Resend retornou erro:', JSON.stringify(error));
            console.log('\n⚠️  Tente o link acima diretamente no navegador.');
        } else {
            console.log('✅ Email enviado! ID Resend:', data.id);
            console.log('   Verifique a caixa de entrada e SPAM de:', email);
        }
    } catch (err) {
        console.log('❌ Exceção ao enviar email:', err.message);
        console.log('\n⚠️  Use o link acima diretamente no navegador para resetar a senha.');
    }

    await prisma.$disconnect();
}

run().catch(console.error);
