import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Link } from 'react-router-dom';
import { Trash2, Edit2, ArrowLeft, Save, X } from 'lucide-react';

export default function ManagerRegistration() {
    const [managers, setManagers] = useState([]);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [sectors, setSectors] = useState([]); // Array for multi-sector
    const [editingId, setEditingId] = useState(null);

    const availableSectors = [
        "ENFERMARIA",
        "UTI",
        "FARMACIA",
        "RECEPCAO",
        "EMERGENCIA",
        "CENTRO CIRURGICO"
    ];

    useEffect(() => {
        fetchManagers();
    }, []);

    const fetchManagers = async () => {
        try {
            const res = await axios.get('http://localhost:3001/api/managers');
            setManagers(res.data);
        } catch (error) {
            console.error("Erro ao buscar gestores", error);
        }
    };

    const handleSectorToggle = (sector) => {
        setSectors(prev => {
            if (prev.includes(sector)) {
                return prev.filter(s => s !== sector);
            } else {
                return [...prev, sector];
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (sectors.length === 0) {
            Swal.fire('Erro', 'Selecione pelo menos um setor.', 'error');
            return;
        }

        try {
            if (editingId) {
                await axios.put(`http://localhost:3001/api/managers/${editingId}`, { name, email, sectors });
                Swal.fire('Sucesso', 'Gestor atualizado com sucesso!', 'success');
                setEditingId(null);
            } else {
                await axios.post('http://localhost:3001/api/managers', { name, email, sectors });
                Swal.fire('Sucesso', 'Gestor cadastrado com sucesso!', 'success');
            }
            setName('');
            setEmail('');
            setSectors([]);
            fetchManagers();
        } catch (error) {
            Swal.fire('Erro', error.response?.data?.message || 'Erro ao salvar gestor', 'error');
        }
    };

    const handleEdit = (manager) => {
        setEditingId(manager.id);
        setName(manager.name);
        setEmail(manager.email);
        setSectors(manager.sectors || []);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setName('');
        setEmail('');
        setSectors([]);
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Tem certeza?',
            text: "Você não poderá reverter isso!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sim, deletar!'
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`http://localhost:3001/api/managers/${id}`);
                Swal.fire('Deletado!', 'O gestor foi removido.', 'success');
                fetchManagers();
            } catch (error) {
                Swal.fire('Erro', 'Erro ao deletar gestor.', 'error');
            }
        }
    };

    return (
        <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto', fontFamily: 'Roboto, sans-serif', color: '#333' }}>

            <div style={{ marginBottom: '30px' }}>
                <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: '#003366', fontWeight: 'bold', fontSize: '16px' }}>
                    <ArrowLeft size={20} />
                    Voltar ao Dashboard
                </Link>
            </div>

            <h2 style={{ color: '#003366', borderBottom: '2px solid #003366', paddingBottom: '10px', marginBottom: '30px' }}>
                {editingId ? 'Editar Gestor' : 'Cadastro de Gestores'}
            </h2>

            <form onSubmit={handleSubmit} style={{ background: '#f9f9f9', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '40px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>Nome do Gestor</label>
                        <input
                            type="text"
                            placeholder="Ex: Dr. João Silva"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '16px' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>Email Corporativo</label>
                        <input
                            type="email"
                            placeholder="joao.silva@hospital.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '16px' }}
                        />
                    </div>
                </div>

                <div style={{ marginBottom: '25px' }}>
                    <label style={{ display: 'block', marginBottom: '12px', fontWeight: 'bold', color: '#555' }}>Setores Responsáveis</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {availableSectors.map(sector => (
                            <button
                                key={sector}
                                type="button"
                                onClick={() => handleSectorToggle(sector)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    border: `2px solid ${sectors.includes(sector) ? '#003366' : '#ccc'}`,
                                    background: sectors.includes(sector) ? '#003366' : 'white',
                                    color: sectors.includes(sector) ? 'white' : '#555',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {sector}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                    <button
                        type="submit"
                        style={{
                            padding: '12px 30px',
                            background: editingId ? '#F1C232' : '#2E7D32',
                            color: editingId ? '#333' : 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            flex: 1,
                            justifyContent: 'center'
                        }}
                    >
                        {editingId ? <Save size={20} /> : null}
                        {editingId ? 'Salvar Alterações' : 'Cadastrar Gestor'}
                    </button>

                    {editingId && (
                        <button
                            type="button"
                            onClick={handleCancelEdit}
                            style={{
                                padding: '12px 20px',
                                background: '#e0e0e0',
                                color: '#333',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <X size={20} />
                            Cancelar
                        </button>
                    )}
                </div>
            </form>

            <h3 style={{ color: '#003366', marginBottom: '20px' }}>Gestores Cadastrados</h3>
            <div style={{ overflowX: 'auto', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderRadius: '10px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                    <thead>
                        <tr style={{ background: '#003366', color: 'white' }}>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Nome</th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Email</th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Setores</th>
                            <th style={{ padding: '15px', textAlign: 'center' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {managers.map(manager => (
                            <tr key={manager.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '15px' }}>{manager.name}</td>
                                <td style={{ padding: '15px' }}>{manager.email}</td>
                                <td style={{ padding: '15px' }}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                        {manager.sectors && manager.sectors.map((s, i) => (
                                            <span key={i} style={{ background: '#e3f2fd', color: '#0277bd', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td style={{ padding: '15px', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                                        <button
                                            onClick={() => handleEdit(manager)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F1C232' }}
                                            title="Editar"
                                        >
                                            <Edit2 size={20} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(manager.id)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d33' }}
                                            title="Excluir"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {managers.length === 0 && (
                            <tr>
                                <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#777' }}>
                                    Nenhum gestor cadastrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
