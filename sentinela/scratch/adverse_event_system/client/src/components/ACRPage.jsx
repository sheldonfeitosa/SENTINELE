import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { ArrowLeft, Brain, Activity, Target, Layers, CheckCircle } from 'lucide-react';

export default function ACRPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [eventData, setEventData] = useState(null);
    const [selectedIshikawa, setSelectedIshikawa] = useState(new Set());
    const [selected5W2H, setSelected5W2H] = useState(new Set());

    useEffect(() => {
        fetchEventData();
    }, [id]);

    const fetchEventData = async () => {
        try {
            const res = await axios.get(`http://localhost:3001/api/events/${id}`);
            setEventData(res.data);
        } catch (error) {
            console.error("Erro ao buscar evento", error);
        }
    };

    const generateAnalysis = async () => {
        setLoading(true);
        try {
            const res = await axios.post(`http://localhost:3001/api/events/${id}/acr`);
            if (res.data.success) {
                setAnalysis(res.data.analysis);
                Swal.fire('Sucesso', 'Análise gerada pela IA!', 'success');
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Erro', 'Falha ao gerar análise.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleIshikawa = (cause) => {
        const newSet = new Set(selectedIshikawa);
        if (newSet.has(cause)) newSet.delete(cause);
        else newSet.add(cause);
        setSelectedIshikawa(newSet);
    };

    const toggle5W2H = (index) => {
        const newSet = new Set(selected5W2H);
        if (newSet.has(index)) newSet.delete(index);
        else newSet.add(index);
        setSelected5W2H(newSet);
    };

    const handleSaveSelection = async () => {
        if (selectedIshikawa.size === 0 && selected5W2H.size === 0) {
            Swal.fire('Atenção', 'Selecione pelo menos um item para gravar.', 'warning');
            return;
        }

        const structuredCauses = {};
        if (analysis && analysis.ishikawa) {
            Object.entries(analysis.ishikawa).forEach(([key, causes]) => {
                const selectedInCategory = causes.filter(c => selectedIshikawa.has(c));
                if (selectedInCategory.length > 0) {
                    structuredCauses[key] = selectedInCategory;
                }
            });
        }
        const causa = JSON.stringify(structuredCauses);

        const acao = Array.from(selected5W2H).map(idx => {
            const item = analysis.plano_5w2h[idx];
            return `O QUE: ${item.what} | QUEM: ${item.who} | QUANDO: ${item.when} | COMO: ${item.how}`;
        }).join('\n\n');

        try {
            await axios.post(`http://localhost:3001/api/events/${id}/tratativa`, {
                analise_causa: causa,
                plano_acao: acao,
                analise_conclusiva: analysis.analise_conclusiva
            });

            Swal.fire({
                title: 'Sucesso!',
                text: 'Seleção gravada como tratativa.',
                icon: 'success',
                confirmButtonText: 'Ir para Tratativa'
            }).then(() => {
                navigate(`/tratativa/${id}`);
            });

        } catch (error) {
            console.error("Erro ao salvar:", error);
            Swal.fire('Erro', 'Falha ao gravar tratativa.', 'error');
        }
    };

    if (!eventData) return <div>Carregando evento...</div>;

    return (
        <div style={{ fontFamily: "'Roboto', sans-serif", background: '#F4F6F9', minHeight: '100vh', padding: '20px' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', overflow: 'hidden' }}>

                {/* Header */}
                <div style={{ background: '#003366', color: 'white', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '22px' }}>Análise de Causa Raiz (ACR)</h1>
                            <p style={{ margin: '5px 0 0', opacity: 0.8, fontSize: '14px' }}>Evento #{id} - {eventData.patient_name}</p>
                        </div>
                    </div>
                    <Brain size={32} style={{ opacity: 0.8 }} />
                </div>

                <div style={{ padding: '30px' }}>

                    {/* Descrição do Evento */}
                    <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '30px', borderLeft: '4px solid #003366' }}>
                        <strong style={{ display: 'block', marginBottom: '5px', color: '#555' }}>Descrição do Evento:</strong>
                        <p style={{ margin: 0, color: '#333' }}>{eventData.description}</p>
                    </div>

                    {!analysis && (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <Activity size={64} color="#ccc" style={{ marginBottom: '20px' }} />
                            <p style={{ color: '#666', marginBottom: '20px' }}>Nenhuma análise gerada ainda.</p>
                            <button
                                onClick={generateAnalysis}
                                disabled={loading}
                                style={{
                                    padding: '15px 30px', fontSize: '16px', background: loading ? '#ccc' : '#2E7D32',
                                    color: 'white', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer',
                                    display: 'inline-flex', alignItems: 'center', gap: '10px', fontWeight: 'bold'
                                }}
                            >
                                {loading ? <Activity className="animate-spin" /> : <Brain />}
                                {loading ? 'IA Analisando...' : 'GERAR ANÁLISE COM IA'}
                            </button>
                        </div>
                    )}

                    {analysis && (
                        <div className="animate-fade-in">

                            {/* Ishikawa Diagram (Visual Representation) */}
                            <div style={{ marginBottom: '40px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                                    <Layers size={24} color="#003366" />
                                    <h2 style={{ margin: 0, color: '#003366' }}>Diagrama de Ishikawa (6M)</h2>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                                    {Object.entries(analysis.ishikawa).map(([key, causes]) => (
                                        <div key={key} style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', textTransform: 'uppercase', color: '#003366', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
                                                {key.replace(/_/g, ' ')}
                                            </h3>
                                            <ul style={{ margin: 0, paddingLeft: '0', listStyle: 'none', fontSize: '13px', color: '#555' }}>
                                                {causes.map((c, i) => (
                                                    <li
                                                        key={i}
                                                        onClick={() => toggleIshikawa(c)}
                                                        style={{
                                                            marginBottom: '8px',
                                                            padding: '8px 12px',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s ease',
                                                            background: selectedIshikawa.has(c) ? '#E3F2FD' : 'transparent',
                                                            border: selectedIshikawa.has(c) ? '1px solid #2196F3' : '1px solid transparent',
                                                            color: selectedIshikawa.has(c) ? '#0D47A1' : '#555',
                                                            fontWeight: selectedIshikawa.has(c) ? 'bold' : 'normal',
                                                            display: 'flex',
                                                            alignItems: 'flex-start',
                                                            gap: '8px'
                                                        }}
                                                    >
                                                        <span style={{ flex: 1 }}>{c}</span>
                                                        {selectedIshikawa.has(c) && <CheckCircle size={16} color="#2196F3" />}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ marginTop: '20px', padding: '15px', background: '#E3F2FD', borderRadius: '8px', border: '1px solid #90CAF9' }}>
                                    <strong style={{ color: '#0D47A1' }}>Conclusão da IA:</strong> {analysis.analise_conclusiva}
                                </div>
                            </div>

                            {/* 5W2H Table */}
                            <div style={{ marginBottom: '80px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                                    <Target size={24} color="#C62828" />
                                    <h2 style={{ margin: 0, color: '#C62828' }}>Plano de Ação (5W2H)</h2>
                                </div>

                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                        <thead>
                                            <tr style={{ background: '#f8f9fa', color: '#333' }}>
                                                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>O QUE (What)</th>
                                                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>POR QUE (Why)</th>
                                                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>QUEM (Who)</th>
                                                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>QUANDO (When)</th>
                                                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>COMO (How)</th>
                                                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>QUANTO (How Much)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {analysis.plano_5w2h.map((item, index) => (
                                                <tr
                                                    key={index}
                                                    onClick={() => toggle5W2H(index)}
                                                    style={{
                                                        background: selected5W2H.has(index) ? '#E3F2FD' : (index % 2 === 0 ? '#fff' : '#fcfcfc'),
                                                        transition: 'all 0.2s ease',
                                                        cursor: 'pointer',
                                                        borderLeft: selected5W2H.has(index) ? '4px solid #2196F3' : '4px solid transparent',
                                                        fontWeight: selected5W2H.has(index) ? 'bold' : 'normal',
                                                        color: selected5W2H.has(index) ? '#0D47A1' : '#333'
                                                    }}
                                                >
                                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.what}</td>
                                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.why}</td>
                                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.who}</td>
                                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.when}</td>
                                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.how}</td>
                                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.how_much}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Floating Save Button */}
                            <div style={{
                                position: 'fixed', bottom: '30px', right: '30px', zIndex: 1000,
                                display: (selectedIshikawa.size > 0 || selected5W2H.size > 0) ? 'block' : 'none'
                            }}>
                                <button
                                    onClick={handleSaveSelection}
                                    style={{
                                        padding: '15px 30px', fontSize: '16px', background: '#2E7D32', color: 'white',
                                        border: 'none', borderRadius: '50px', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold',
                                        boxShadow: '0 4px 20px rgba(46, 125, 50, 0.4)',
                                        animation: 'bounce 0.5s'
                                    }}
                                >
                                    <Target size={20} />
                                    GRAVAR SELEÇÃO COMO TRATATIVA ({selectedIshikawa.size + selected5W2H.size})
                                </button>
                            </div>

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
