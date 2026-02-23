const axios = require('axios');

const API_URL = 'http://localhost:3001/api/managers';

async function testApi() {
    try {
        console.log('1. Creating Manager (ALTA_GESTAO)...');
        const createRes = await axios.post(API_URL, {
            name: 'Diretor Teste',
            email: 'diretor.teste@gmail.com',
            role: 'ALTA_GESTAO',
            sectors: ['Diretoria']
        });
        console.log('Created:', createRes.data);
        const id = createRes.data.id;

        console.log('2. Updating Manager (Change to ADMIN)...');
        const updateRes = await axios.put(`${API_URL}/${id}`, {
            id: id, // Frontend sends ID in body too
            name: 'Diretor Editado',
            email: 'diretor.teste@gmail.com',
            role: 'ADMIN',
            sectors: ['Diretoria', 'Qualidade']
        });
        console.log('Updated:', updateRes.data);

        console.log('3. Deleting Manager...');
        await axios.delete(`${API_URL}/${id}`);
        console.log('Deleted successfully');

    } catch (error) {
        console.error('API Test Failed:', error.response ? error.response.data : error.message);
    }
}

testApi();
