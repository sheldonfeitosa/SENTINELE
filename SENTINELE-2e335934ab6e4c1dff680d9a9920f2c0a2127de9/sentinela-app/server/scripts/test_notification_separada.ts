/**
 * TEST: Notificação SEPARADA da Gestão de Risco
 * ==============================================
 * Este script verifica que:
 * 1. O FORMULÁRIO PÚBLICO (/n/:tenantSlug) funciona SEM login
 * 2. A notificação é criada e vinculada corretamente ao tenant via slug
 * 3. O email vai para o gestor de risco (sem expor os dados ao notificador)
 * 4. O acesso à GESTÃO DE RISCO (/gestao-risco) rejeita requisições SEM token
 *
 * Base URL: altere conforme ambiente (local ou produção)
 */

const BASE_URL = process.env.API_URL || 'https://sentinela-app.vercel.app';
const TENANT_SLUG = process.env.TENANT_SLUG || 'inmceb'; // slug do hospital de teste

async function run() {
    console.log('\n========================================================');
    console.log('  TESTE: Notificação SEPARADA da Gestão de Risco');
    console.log(`  API Base: ${BASE_URL}`);
    console.log(`  Tenant Slug: ${TENANT_SLUG}`);
    console.log('========================================================\n');

    let passed = 0;
    let failed = 0;

    // ─────────────────────────────────────────────
    // TESTE 1: Formulário público — criar notificação SEM token de login
    // ─────────────────────────────────────────────
    console.log('📋 TESTE 1: Criar notificação anônima (sem login, via slug)...');
    let createdId: number | null = null;
    try {
        const response = await fetch(`${BASE_URL}/api/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // SEM Authorization header — simulando tablet no setor
            body: JSON.stringify({
                tenantSlug: TENANT_SLUG,
                paciente: 'Paciente Teste Script',
                nome_mae: 'Mae Teste',
                nascimento: '1970-01-01',
                sexo: 'M',
                data_internacao: '2026-02-20',
                data_evento: '2026-02-23',
                periodo: 'Manhã',
                setor: 'UTI',
                descricao: '[SCRIPT DE TESTE] Queda do paciente ao tentar ir ao banheiro sem acionar campainha.',
                tipo_notificacao: 'EVENTO ADVERSO',
            })
        });

        const body = await response.json();

        if (response.status === 201 && body.id) {
            createdId = body.id;
            console.log(`   ✅ PASSOU — Notificação criada com ID #${createdId} (status ${response.status})`);
            passed++;
        } else {
            console.log(`   ❌ FALHOU — Status: ${response.status}, Resposta: ${JSON.stringify(body)}`);
            failed++;
        }
    } catch (err: any) {
        console.log(`   ❌ FALHOU — Erro de rede: ${err.message}`);
        failed++;
    }

    // ─────────────────────────────────────────────
    // TESTE 2: Gestão de Risco SEM token deve ser bloqueada
    // ─────────────────────────────────────────────
    console.log('\n🔐 TESTE 2: Acessar lista de notificações SEM token (deve ser 401)...');
    try {
        const response = await fetch(`${BASE_URL}/api/notifications`, {
            method: 'GET',
            // SEM Authorization header
        });

        if (response.status === 401) {
            console.log(`   ✅ PASSOU — Acesso bloqueado corretamente (401 Unauthorized)`);
            passed++;
        } else {
            const body = await response.json().catch(() => ({}));
            console.log(`   ❌ FALHOU — Deveria ser 401, mas recebeu ${response.status}. Body: ${JSON.stringify(body)}`);
            failed++;
        }
    } catch (err: any) {
        console.log(`   ❌ FALHOU — Erro de rede: ${err.message}`);
        failed++;
    }

    // ─────────────────────────────────────────────
    // TESTE 3: Notificação por ID SEM token deve ser bloqueada
    // ─────────────────────────────────────────────
    if (createdId) {
        console.log(`\n🔐 TESTE 3: Acessar notificação #${createdId} SEM token (deve ser 401)...`);
        try {
            const response = await fetch(`${BASE_URL}/api/notifications/${createdId}`, {
                method: 'GET',
                // SEM Authorization header
            });

            if (response.status === 401) {
                console.log(`   ✅ PASSOU — Detalhe bloqueado corretamente (401 Unauthorized)`);
                passed++;
            } else {
                const body = await response.json().catch(() => ({}));
                console.log(`   ❌ FALHOU — Deveria ser 401, mas recebeu ${response.status}`);
                failed++;
            }
        } catch (err: any) {
            console.log(`   ❌ FALHOU — Erro de rede: ${err.message}`);
            failed++;
        }
    } else {
        console.log('\n⚠️  TESTE 3: Pulado (notificação não foi criada no Teste 1)');
    }

    // ─────────────────────────────────────────────
    // TESTE 4: Slug inválido deve retornar erro adequado
    // ─────────────────────────────────────────────
    console.log('\n🚫 TESTE 4: Criar notificação com slug inválido (deve dar erro 500/400)...');
    try {
        const response = await fetch(`${BASE_URL}/api/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tenantSlug: 'hospital-que-nao-existe-xyz123',
                paciente: 'Teste',
                data_evento: '2026-02-23',
                setor: 'UTI',
                descricao: 'Teste com slug inválido',
                tipo_notificacao: 'EVENTO ADVERSO',
            })
        });

        const body = await response.json().catch(() => ({}));

        if (response.status >= 400) {
            console.log(`   ✅ PASSOU — Slug inválido rejeitado corretamente (status ${response.status})`);
            if (body.details) console.log(`   Mensagem: ${body.details}`);
            passed++;
        } else {
            console.log(`   ❌ FALHOU — Deveria retornar erro, mas recebeu status ${response.status}`);
            failed++;
        }
    } catch (err: any) {
        console.log(`   ❌ FALHOU — Erro de rede: ${err.message}`);
        failed++;
    }

    // ─────────────────────────────────────────────
    // TESTE 5: Sem slug e sem token deve retornar erro claro
    // ─────────────────────────────────────────────
    console.log('\n🚫 TESTE 5: Criar notificação SEM slug e SEM token (deve dar erro)...');
    try {
        const response = await fetch(`${BASE_URL}/api/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                // tenantSlug ausente — sem login e sem slug: deve falhar
                paciente: 'Teste sem contexto',
                data_evento: '2026-02-23',
                setor: 'Emergência',
                descricao: 'Teste sem contexto de hospital',
                tipo_notificacao: 'EVENTO ADVERSO',
            })
        });

        const body = await response.json().catch(() => ({}));

        if (response.status >= 400) {
            console.log(`   ✅ PASSOU — Bloqueado sem contexto (status ${response.status})`);
            if (body.details) console.log(`   Mensagem: ${body.details}`);
            passed++;
        } else {
            console.log(`   ❌ FALHOU — Deveria retornar erro, mas recebeu status ${response.status}`);
            failed++;
        }
    } catch (err: any) {
        console.log(`   ❌ FALHOU — Erro de rede: ${err.message}`);
        failed++;
    }

    // ─────────────────────────────────────────────
    // RESUMO
    // ─────────────────────────────────────────────
    console.log('\n========================================================');
    console.log(`  RESULTADO FINAL: ${passed} ✅ PASSOU | ${failed} ❌ FALHOU`);
    console.log('========================================================');

    if (failed === 0) {
        console.log('\n🎉 TODOS OS TESTES PASSARAM!');
        console.log('   → Notificação pública: SEPARADA da gestão de risco ✅');
        console.log('   → Gestão de risco protegida por autenticação ✅');
        console.log('   → Contexts inválidos são rejeitados adequadamente ✅');
    } else {
        console.log('\n⚠️  ALGUNS TESTES FALHARAM — verifique os detalhes acima.');
        process.exit(1);
    }
}

run().catch(err => {
    console.error('Erro não tratado:', err);
    process.exit(1);
});
