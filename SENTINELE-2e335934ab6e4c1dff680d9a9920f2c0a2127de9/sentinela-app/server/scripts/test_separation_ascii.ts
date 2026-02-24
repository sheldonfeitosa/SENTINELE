/**
 * TEST: Notification SEPARATED from Risk Management (ASCII-safe version)
 */

const BASE_URL = process.env.API_URL || 'https://sentinela-app.vercel.app';
const TENANT_SLUG = process.env.TENANT_SLUG || 'inmceb';

async function run() {
    console.log('\n========================================================');
    console.log('  TEST: Notification SEPARATED from Risk Management');
    console.log('  API Base: ' + BASE_URL);
    console.log('  Tenant Slug: ' + TENANT_SLUG);
    console.log('========================================================\n');

    let passed = 0;
    let failed = 0;

    // ─── TEST 1: Create notification WITHOUT login (anonymous, via slug) ───
    console.log('TEST 1: Create anonymous notification (no login, using slug)...');
    let createdId: number | null = null;
    try {
        const response = await fetch(`${BASE_URL}/api/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tenantSlug: TENANT_SLUG,
                paciente: 'Paciente Teste Script',
                nome_mae: 'Mae Teste',
                nascimento: '1970-01-01',
                sexo: 'M',
                data_internacao: '2026-02-20',
                data_evento: '2026-02-23',
                periodo: 'Manha',
                setor: 'UTI',
                descricao: '[SCRIPT TEST] Patient fall while attempting to get to bathroom without ringing bell.',
                tipo_notificacao: 'EVENTO ADVERSO',
            })
        });

        const body = await response.json();

        if (response.status === 201 && body.id) {
            createdId = body.id;
            console.log('   PASS - Notification created with ID #' + createdId + ' (status ' + response.status + ')');
            passed++;
        } else {
            console.log('   FAIL - Status: ' + response.status + ', Body: ' + JSON.stringify(body).substring(0, 200));
            failed++;
        }
    } catch (err: any) {
        console.log('   FAIL - Network error: ' + err.message);
        failed++;
    }

    // ─── TEST 2: GET notifications WITHOUT token must be blocked (401) ───
    console.log('\nTEST 2: GET all notifications WITHOUT token (must return 401)...');
    try {
        const response = await fetch(`${BASE_URL}/api/notifications`, {
            method: 'GET'
            // no Authorization header
        });

        if (response.status === 401) {
            console.log('   PASS - Blocked correctly (401 Unauthorized)');
            passed++;
        } else {
            const body = await response.json().catch(() => ({}));
            console.log('   FAIL - Expected 401, got ' + response.status + '. Body: ' + JSON.stringify(body).substring(0, 200));
            failed++;
        }
    } catch (err: any) {
        console.log('   FAIL - Network error: ' + err.message);
        failed++;
    }

    // ─── TEST 3: GET notification by ID WITHOUT token must be blocked ───
    if (createdId) {
        console.log('\nTEST 3: GET notification #' + createdId + ' WITHOUT token (must return 401)...');
        try {
            const response = await fetch(`${BASE_URL}/api/notifications/${createdId}`, {
                method: 'GET'
            });

            if (response.status === 401) {
                console.log('   PASS - Detail blocked correctly (401 Unauthorized)');
                passed++;
            } else {
                console.log('   FAIL - Expected 401, got ' + response.status);
                failed++;
            }
        } catch (err: any) {
            console.log('   FAIL - Network error: ' + err.message);
            failed++;
        }
    } else {
        console.log('\nTEST 3: SKIPPED (notification was not created in Test 1)');
    }

    // ─── TEST 4: Invalid slug must return error ───
    console.log('\nTEST 4: Create notification with INVALID slug (must return 4xx/5xx)...');
    try {
        const response = await fetch(`${BASE_URL}/api/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tenantSlug: 'hospital-that-does-not-exist-xyz123',
                paciente: 'Test',
                data_evento: '2026-02-23',
                setor: 'UTI',
                descricao: 'Test with invalid slug',
                tipo_notificacao: 'EVENTO ADVERSO',
            })
        });

        const body = await response.json().catch(() => ({}));

        if (response.status >= 400) {
            console.log('   PASS - Invalid slug rejected (status ' + response.status + ')');
            if (body.details) console.log('   Message: ' + body.details);
            passed++;
        } else {
            console.log('   FAIL - Should have returned error, but got status ' + response.status);
            failed++;
        }
    } catch (err: any) {
        console.log('   FAIL - Network error: ' + err.message);
        failed++;
    }

    // ─── TEST 5: No slug + no token must return error ───
    console.log('\nTEST 5: Create notification WITHOUT slug AND WITHOUT token (must return error)...');
    try {
        const response = await fetch(`${BASE_URL}/api/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                // tenantSlug missing - no login and no slug: must fail
                paciente: 'Test without context',
                data_evento: '2026-02-23',
                setor: 'Emergency',
                descricao: 'Test without hospital context',
                tipo_notificacao: 'EVENTO ADVERSO',
            })
        });

        const body = await response.json().catch(() => ({}));

        if (response.status >= 400) {
            console.log('   PASS - Blocked without context (status ' + response.status + ')');
            if (body.details) console.log('   Message: ' + body.details);
            passed++;
        } else {
            console.log('   FAIL - Should have returned error, but got status ' + response.status);
            failed++;
        }
    } catch (err: any) {
        console.log('   FAIL - Network error: ' + err.message);
        failed++;
    }

    // ─── SUMMARY ───
    console.log('\n========================================================');
    console.log('  FINAL RESULT: ' + passed + ' PASSED | ' + failed + ' FAILED');
    console.log('========================================================');

    if (failed === 0) {
        console.log('\nALL TESTS PASSED!');
        console.log('  -> Public notification form: SEPARATED from risk management [OK]');
        console.log('  -> Risk management protected by authentication [OK]');
        console.log('  -> Invalid contexts rejected correctly [OK]');
    } else {
        console.log('\nSOME TESTS FAILED - check details above.');
        process.exit(1);
    }
}

run().catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
});
