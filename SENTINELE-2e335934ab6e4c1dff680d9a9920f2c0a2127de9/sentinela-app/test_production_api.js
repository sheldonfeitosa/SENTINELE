const jwt = require('./server/node_modules/jsonwebtoken');

async function main() {
    const JWT_SECRET = "sentinela-secret-key-change-me";
    
    // User data for qualidade@inmceb.med.br
    const userPayload = {
        userId: 62,
        email: 'qualidade@inmceb.med.br',
        role: 'TENANT_ADMIN',
        tenantId: '0ca52289-b1bf-431f-8790-bff3749420be'
    };

    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '1d' });
    
    console.log("Token:", token);

    const response = await fetch('https://sentinelaai.com.br/api/notifications', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        console.log("Error status:", response.status);
        console.log("Error body:", await response.text());
        return;
    }

    const data = await response.json();
    console.log("Total notifications returned by prod API:", data.length);
    if (data.length > 0) {
        console.log("First item:", data[0].id);
    }
}

main().catch(console.error);
