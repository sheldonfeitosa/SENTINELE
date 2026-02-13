import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Flag, Users, Settings, Filter, PieChart as PieIcon, BarChart as BarIcon, Calendar, AlertTriangle } from 'lucide-react';
import Swal from 'sweetalert2';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

export default function Dashboard() {
    const [events, setEvents] = useState([]);
    const [filterStatus, setFilterStatus] = useState('Todos');
    const [filterSector, setFilterSector] = useState('Todos');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    useEffect(() => {
        fetchEvents();
        const interval = setInterval(fetchEvents, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await axios.get('http://localhost:3001/api/events');
            setEvents(res.data);
        } catch (error) {
            console.error("Erro ao buscar eventos", error);
        }
    };

    const handleEscalate = async (id) => {
        const result = await Swal.fire({
            title: 'Escalar para Presidência?',
            text: "Isso enviará um email formal de risco institucional para a alta gestão.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sim, escalar!',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                const response = await axios.post(`http://localhost:3001/api/events/${id}/escalate`);
                Swal.fire('Escalado!', response.data.message, 'success');
                fetchEvents(); // Recarregar lista
            } catch (error) {
                console.error("Erro ao escalar:", error);
                Swal.fire('Erro', error.response?.data?.message || 'Falha ao escalar evento.', 'error');
            }
        }
    };

    // Filtros
    const filteredEvents = useMemo(() => {
        return events.filter(ev => {
            const matchStatus = filterStatus === 'Todos' ||
                (filterStatus === 'Tratados' && ev.status.includes('TRATADO')) ||
                (filterStatus === 'Abertos' && !ev.status.includes('TRATADO'));

            const matchSector = filterSector === 'Todos' || ev.sector_notified === filterSector;

            const eventDate = new Date(ev.created_at);
            const matchDate = (!dateRange.start || eventDate >= new Date(dateRange.start)) &&
                (!dateRange.end || eventDate <= new Date(dateRange.end));

            return matchStatus && matchSector && matchDate;
        });
    }, [events, filterStatus, filterSector, dateRange]);

    // Dados para Gráficos
    const sectorData = useMemo(() => {
        const counts = {};
        filteredEvents.forEach(ev => {
            counts[ev.sector_notified] = (counts[ev.sector_notified] || 0) + 1;
        });
        return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
    }, [filteredEvents]);

    const statusData = useMemo(() => {
        const counts = { Tratados: 0, Abertos: 0 };
        filteredEvents.forEach(ev => {
            if (ev.status.includes('TRATADO')) counts.Tratados++;
            else counts.Abertos++;
        });
        return [
            { name: 'Tratados', value: counts.Tratados },
            { name: 'Abertos', value: counts.Abertos }
        ];
    }, [filteredEvents]);

    const uniqueSectors = [...new Set(events.map(ev => ev.sector_notified))];
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
    const STATUS_COLORS = ['#2E7D32', '#E06666']; // Verde para Tratados, Vermelho para Abertos

    const getStatusColor = (status) => {
        if (status.includes('TRATADO')) return '#93C47D';
        if (status.includes('Aguardando')) return '#F1C232';
        if (status.includes('Atrasado')) return '#E06666';
        return '#B4A7D6';
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Roboto, sans-serif', background: '#f4f6f9', minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ background: '#003366', color: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '24px' }}>PAINEL DE GESTÃO DE RISCO</h2>
                    <p style={{ margin: '5px 0 0', opacity: 0.8, fontSize: '14px' }}>Monitoramento e Análise de Eventos Adversos</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Link to="/managers" style={{ color: '#003366', background: 'white', textDecoration: 'none', fontWeight: 'bold', padding: '10px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', transition: 'transform 0.2s' }}>
                        <Users size={18} />
                        Gestores
                    </Link>
                    <Link to="/admin/settings" style={{ color: '#003366', background: 'white', textDecoration: 'none', fontWeight: 'bold', padding: '10px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', transition: 'transform 0.2s' }}>
                        <Settings size={18} />
                        Configurações
                    </Link>
                    <Link to="/" style={{ color: 'white', background: '#2E7D32', textDecoration: 'none', fontWeight: 'bold', padding: '10px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
                        + Nova Notificação
                    </Link>
                </div>
            </div>

            {/* Metrics Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', borderLeft: '5px solid #003366' }}>
                    <span style={{ color: '#666', fontSize: '14px', fontWeight: 'bold' }}>TOTAL DE EVENTOS</span>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333', marginTop: '5px' }}>{filteredEvents.length}</div>
                </div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', borderLeft: '5px solid #E06666' }}>
                    <span style={{ color: '#666', fontSize: '14px', fontWeight: 'bold' }}>EM ABERTO</span>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#E06666', marginTop: '5px' }}>
                        {filteredEvents.filter(e => !e.status.includes('TRATADO')).length}
                    </div>
                </div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', borderLeft: '5px solid #2E7D32' }}>
                    <span style={{ color: '#666', fontSize: '14px', fontWeight: 'bold' }}>TRATADOS</span>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2E7D32', marginTop: '5px' }}>
                        {filteredEvents.filter(e => e.status.includes('TRATADO')).length}
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#003366', fontWeight: 'bold' }}>
                    <Filter size={20} />
                    Filtros:
                </div>

                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', outline: 'none' }}
                >
                    <option value="Todos">Todos os Status</option>
                    <option value="Abertos">Em Aberto</option>
                    <option value="Tratados">Tratados</option>
                </select>

                <select
                    value={filterSector}
                    onChange={e => setFilterSector(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', outline: 'none' }}
                >
                    <option value="Todos">Todos os Setores</option>
                    {uniqueSectors.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Calendar size={18} color="#666" />
                    <input
                        type="date"
                        value={dateRange.start}
                        onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
                    />
                    <span style={{ color: '#666' }}>até</span>
                    <input
                        type="date"
                        value={dateRange.end}
                        onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
                    />
                </div>
            </div>

            {/* Charts Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '30px' }}>
                {/* Bar Chart */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <BarIcon size={20} color="#003366" />
                        <h3 style={{ margin: 0, color: '#333' }}>Eventos por Setor</h3>
                    </div>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sectorData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#003366" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <PieIcon size={20} color="#003366" />
                        <h3 style={{ margin: 0, color: '#333' }}>Status Geral</h3>
                    </div>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
                    <h3 style={{ margin: 0, color: '#333' }}>Lista de Eventos</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ background: '#f8f9fa', color: '#555', textAlign: 'left' }}>
                                <th style={{ padding: '15px' }}>ID</th>
                                <th style={{ padding: '15px' }}>Data</th>
                                <th style={{ padding: '15px' }}>Paciente</th>
                                <th style={{ padding: '15px' }}>Setor</th>
                                <th style={{ padding: '15px' }}>Tipo</th>
                                <th style={{ padding: '15px' }}>Classificação</th>
                                <th style={{ padding: '15px' }}>Prazo</th>
                                <th style={{ padding: '15px' }}>Status</th>
                                <th style={{ padding: '15px' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEvents.map(ev => (
                                <tr key={ev.id} style={{ borderBottom: '1px solid #eee', transition: 'background 0.1s' }} onMouseOver={e => e.currentTarget.style.background = '#f9f9f9'} onMouseOut={e => e.currentTarget.style.background = 'white'}>
                                    <td style={{ padding: '15px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <span style={{ fontWeight: 'bold', color: '#003366' }}>#{ev.id}</span>
                                            {ev.manager_notified === 1 && (
                                                <Flag size={14} color="#2E7D32" fill="#2E7D32" title="Gestor Notificado" />
                                            )}
                                            {ev.escalation_alert_sent === 1 && (
                                                <AlertTriangle size={14} color="#C62828" fill="#C62828" title="Escalado para Presidência" />
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '15px' }}>{new Date(ev.created_at).toLocaleDateString()}</td>
                                    <td style={{ padding: '15px', fontWeight: '500' }}>{ev.patient_name}</td>
                                    <td style={{ padding: '15px' }}>{ev.sector_notified}</td>
                                    <td style={{ padding: '15px' }}>{ev.notification_type}</td>
                                    <td style={{ padding: '15px' }}>
                                        <span style={{
                                            padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold',
                                            background: ev.classification === 'Grave' ? '#FFEBEE' : '#E3F2FD',
                                            color: ev.classification === 'Grave' ? '#C62828' : '#1565C0'
                                        }}>
                                            {ev.classification}
                                        </span>
                                    </td>
                                    <td style={{ padding: '15px' }}>{new Date(ev.deadline).toLocaleDateString()}</td>
                                    <td style={{ padding: '15px' }}>
                                        <span style={{
                                            background: getStatusColor(ev.status), color: 'white', padding: '4px 10px',
                                            borderRadius: '12px', fontSize: '11px', fontWeight: 'bold'
                                        }}>
                                            {ev.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <Link
                                            to={`/tratativa/${ev.id}`}
                                            style={{
                                                color: '#003366', fontWeight: 'bold', textDecoration: 'none',
                                                border: '1px solid #003366', padding: '5px 10px', borderRadius: '4px',
                                                fontSize: '12px', transition: 'all 0.2s'
                                            }}
                                            onMouseOver={e => { e.target.style.background = '#003366'; e.target.style.color = 'white'; }}
                                            onMouseOut={e => { e.target.style.background = 'transparent'; e.target.style.color = '#003366'; }}
                                        >
                                            VER DETALHES
                                        </Link>

                                        {/* Botão de Escalonamento */}
                                        {!ev.status.includes('TRATADO') && new Date(ev.deadline) < new Date() && ev.escalation_alert_sent !== 1 && (
                                            <button
                                                onClick={() => handleEscalate(ev.id)}
                                                title="Escalar para Presidência"
                                                style={{
                                                    background: 'transparent', border: '1px solid #C62828', color: '#C62828',
                                                    padding: '5px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center'
                                                }}
                                                onMouseOver={e => { e.currentTarget.style.background = '#C62828'; e.currentTarget.style.color = 'white'; }}
                                                onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#C62828'; }}
                                            >
                                                <AlertTriangle size={16} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
