import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';

const AdminSettings = () => {
    const [email, setEmail] = useState('');
    const [presidencyEmail, setPresidencyEmail] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const [riskRes, presRes] = await Promise.all([
                fetch('http://localhost:3001/api/settings/risk_manager_email'),
                fetch('http://localhost:3001/api/settings/presidency_email')
            ]);

            const riskData = await riskRes.json();
            const presData = await presRes.json();

            if (riskData.success) setEmail(riskData.value);
            if (presData.success) setPresidencyEmail(presData.value);
        } catch (error) {
            console.error("Erro ao buscar configurações:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await Promise.all([
                fetch('http://localhost:3001/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: 'risk_manager_email', value: email })
                }),
                fetch('http://localhost:3001/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: 'presidency_email', value: presidencyEmail })
                })
            ]);

            Swal.fire({
                icon: 'success',
                title: 'Sucesso!',
                text: 'Configurações atualizadas com sucesso.',
                confirmButtonColor: '#003366'
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Erro',
                text: 'Falha ao conectar com o servidor.'
            });
        }
    };

    return (
        <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Roboto, sans-serif', color: '#333' }}>

            <div style={{ marginBottom: '30px' }}>
                <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: '#003366', fontWeight: 'bold', fontSize: '16px' }}>
                    <ArrowLeft size={20} />
                    Voltar ao Dashboard
                </Link>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px', borderBottom: '2px solid #003366', paddingBottom: '15px' }}>
                <Settings size={32} color="#003366" />
                <h1 style={{ margin: 0, color: '#003366', fontSize: '28px' }}>Configurações do Sistema</h1>
            </div>

            <div style={{ background: '#f9f9f9', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', color: '#444' }}>Geral</h2>

                {loading ? (
                    <p style={{ color: '#666' }}>Carregando...</p>
                ) : (
                    <form onSubmit={handleSave}>
                        <div style={{ marginBottom: '25px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
                                Email do Gestor de Risco
                            </label>
                            <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                                Este email receberá todos os alertas de novos eventos classificados como risco.
                            </p>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '6px',
                                    border: '1px solid #ccc',
                                    fontSize: '16px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                placeholder="exemplo@hospital.com"
                                required
                            />
                        </div>

                        <div style={{ marginBottom: '25px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
                                Email da Presidência / Alta Gestão
                            </label>
                            <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                                Este email receberá os escalonamentos de eventos críticos não tratados.
                            </p>
                            <input
                                type="email"
                                value={presidencyEmail}
                                onChange={(e) => setPresidencyEmail(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '6px',
                                    border: '1px solid #ccc',
                                    fontSize: '16px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                placeholder="presidencia@hospital.com"
                                required
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px' }}>
                            <button
                                type="submit"
                                style={{
                                    background: '#003366',
                                    color: 'white',
                                    padding: '12px 30px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    transition: 'background 0.2s'
                                }}
                                onMouseOver={(e) => e.target.style.background = '#002244'}
                                onMouseOut={(e) => e.target.style.background = '#003366'}
                            >
                                <Save size={20} />
                                Salvar Alterações
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AdminSettings;
