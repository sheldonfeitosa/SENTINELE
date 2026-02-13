import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
    ClipboardList, User, Calendar, Activity, AlertTriangle,
    CheckCircle, FileText, Printer, Save, ArrowRight, Brain, Mail, Layers
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function TratativaPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [causa, setCausa] = useState('');
    const [plano, setPlano] = useState('');
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState([]);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const res = await axios.post(`http://localhost:3001/api/events/${id}/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                setUploadedFiles([...uploadedFiles, res.data.file]);
                setFile(null); // Limpar input
                // Opcional: Adicionar ao texto do plano de ação automaticamente
                setPlano(prev => prev + `\n[ANEXO: ${res.data.file.filename}]`);
                Swal.fire('Sucesso', 'Arquivo anexado!', 'success');
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Erro', 'Falha no upload.', 'error');
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const res = await axios.get(`http://localhost:3001/api/events/${id}`);
            setData(res.data);
        } catch (error) {
            console.error("Erro ao buscar dados", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            await axios.post(`http://localhost:3001/api/events/${id}/tratativa`, {
                analise_causa: causa,
                plano_acao: plano
            });
            Swal.fire('Sucesso', 'Tratativa salva com sucesso!', 'success');
            fetchData();
        } catch (error) {
            console.error('Erro ao salvar tratativa:', error);
            Swal.fire('Erro', 'Falha ao salvar tratativa.', 'error');
        }
    };

    const handleForwardEmail = async () => {
        try {
            // 1. Buscar gestores para encontrar o responsável
            const managersRes = await axios.get('http://localhost:3001/api/managers');
            const managers = managersRes.data;

            const normalize = (str) => str ? str.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
            const sectorNotified = normalize(data.sector_notified);

            const responsibleManager = managers.find(m =>
                m.sectors && m.sectors.some(s => normalize(s) === sectorNotified)
            );

            if (!responsibleManager) {
                Swal.fire({
                    title: 'Gestor não encontrado',
                    text: `Nenhum gestor responsável pelo setor: ${data.sector_notified}`,
                    icon: 'warning',
                    footer: '<a href="/managers">Cadastrar Gestor</a>'
                });
                return;
            }

            const result = await Swal.fire({
                title: 'Encaminhar para Gestor?',
                html: `
                    <div style="text-align: left; font-size: 14px; color: #555;">
                        <p>Isso enviará um email para o gestor responsável:</p>
                        <div style="background: #f0f4f8; padding: 10px; border-radius: 5px; margin-top: 10px;">
                            <p style="margin: 0; font-weight: bold; color: #003366;">${responsibleManager.name}</p>
                            <p style="margin: 5px 0 0; font-size: 12px;">Setores: ${responsibleManager.sectors.join(', ')}</p>
                        </div>
                    </div>
                `,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sim, encaminhar!'
            });

            if (result.isConfirmed) {
                const response = await axios.post(`http://localhost:3001/api/events/${id}/forward`);
                Swal.fire('Enviado!', response.data.message, 'success');
            }
        } catch (error) {
            console.error("Erro ao encaminhar:", error);
            Swal.fire('Erro', 'Falha ao processar solicitação.', 'error');
        }
    };

    const renderCauseAnalysis = (text) => {
        if (!text) return null;

        try {
            const data = JSON.parse(text);
            // Check if it's the structured Ishikawa object (not an array, not null)
            if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
                return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                        {Object.entries(data).map(([key, causes]) => (
                            <div key={key} style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', textTransform: 'uppercase', color: '#003366', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
                                    {key.replace(/_/g, ' ')}
                                </h3>
                                <ul style={{ margin: 0, paddingLeft: '0', listStyle: 'none', fontSize: '13px', color: '#555' }}>
                                    {causes.map((c, i) => (
                                        <li key={i} style={{ marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                            <CheckCircle size={14} color="#2E7D32" style={{ marginTop: '2px', flexShrink: 0 }} />
                                            <span>{c}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                );
            }
        } catch (e) {
            // Not JSON, fall back to plain text list
        }

        const lines = text.split('\n').filter(line => line.trim() !== '');
        return (
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#333', fontSize: '14px' }}>
                {lines.map((line, i) => (
                    <li key={i} style={{ marginBottom: '5px' }}>{line}</li>
                ))}
            </ul>
        );
    };

    const renderActionPlan = (text) => {
        if (!text) return null;

        // Check if it's in 5W2H format
        if (text.includes('O QUE:') && text.includes('|')) {
            const rows = text.split('\n\n').filter(row => row.trim() !== '');
            return (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ background: '#f8f9fa', color: '#333' }}>
                                <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>O QUE</th>
                                <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>QUEM</th>
                                <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>QUANDO</th>
                                <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>COMO</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, i) => {
                                const parts = row.split('|').reduce((acc, part) => {
                                    const [key, val] = part.split(':').map(s => s.trim());
                                    if (key && val) acc[key] = val;
                                    return acc;
                                }, {});

                                return (
                                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fcfcfc' }}>
                                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{parts['O QUE'] || '-'}</td>
                                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{parts['QUEM'] || '-'}</td>
                                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{parts['QUANDO'] || '-'}</td>
                                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{parts['COMO'] || '-'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            );
        }

        // Fallback for plain text
        return <div style={{ whiteSpace: 'pre-wrap', color: '#333' }}>{text}</div>;
    };

    const generatePDF = () => {
        const input = document.getElementById('tratativa-content');

        // Esconder botões temporariamente para o PDF
        const buttons = document.querySelectorAll('.no-print');
        buttons.forEach(btn => btn.style.display = 'none');

        html2canvas(input, { scale: 2 }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position -= pageHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`tratativa_evento_${id}.pdf`);

            // Restaurar botões
            buttons.forEach(btn => btn.style.display = '');
        });
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#003366' }}>
            <Activity className="animate-spin" size={48} />
            <span style={{ marginLeft: '10px', fontSize: '18px' }}>Carregando...</span>
        </div>
    );

    if (!data) return <div style={{ padding: '40px', textAlign: 'center' }}>Evento não encontrado.</div>;

    const isTratado = data.status.includes('TRATADO');

    return (
        <div style={{ fontFamily: "'Roboto', sans-serif", background: '#F4F6F9', padding: '20px', display: 'flex', justifyContent: 'center', minHeight: '100vh' }}>
            <div id="tratativa-content" style={{ background: '#fff', width: '100%', maxWidth: '800px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', overflow: 'hidden', transition: 'all 0.3s ease' }}>

                {/* Header */}
                <div style={{ background: 'linear-gradient(135deg, #003366 0%, #004080 100%)', color: 'white', padding: '30px', textAlign: 'center', borderBottom: '5px solid #2E7D32' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}>
                        <ClipboardList size={32} />
                        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>PORTAL DE TRATATIVA</h1>
                    </div>
                    <p style={{ margin: '5px 0 0', opacity: 0.9, fontSize: '14px', background: 'rgba(255,255,255,0.1)', display: 'inline-block', padding: '4px 12px', borderRadius: '20px' }}>
                        ID do Evento: <strong>{data.id}</strong>
                    </p>
                </div>

                <div style={{ padding: '40px' }}>

                    {/* Status Banner */}
                    {isTratado && (
                        <div id="print-area" style={{ textAlign: 'center', marginBottom: '30px', padding: '20px', background: '#E8F5E9', borderRadius: '8px', border: '1px solid #C8E6C9' }}>
                            <CheckCircle size={48} color="#2E7D32" style={{ marginBottom: '10px' }} />
                            <h3 style={{ color: '#2E7D32', margin: '0 0 5px 0', fontSize: '22px' }}>TRATATIVA CONCLUÍDA</h3>
                            <p style={{ color: '#555', fontSize: '14px', margin: 0 }}>
                                Finalizado em: <strong>{new Date(data.closed_at).toLocaleString()}</strong>
                            </p>
                        </div>
                    )}

                    {/* Info Cards Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                        <div style={{ background: '#f8f9fa', border: '1px solid #e9ecef', padding: '20px', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                            <User size={24} color="#003366" style={{ marginTop: '2px' }} />
                            <div>
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Paciente</span>
                                <div style={{ fontSize: '16px', color: '#333', fontWeight: '500' }}>{data.patient_name}</div>
                            </div>
                        </div>

                        <div style={{ background: '#f8f9fa', border: '1px solid #e9ecef', padding: '20px', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                            <Calendar size={24} color="#003366" style={{ marginTop: '2px' }} />
                            <div>
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Data do Evento</span>
                                <div style={{ fontSize: '16px', color: '#333', fontWeight: '500' }}>{new Date(data.created_at).toLocaleDateString()}</div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div style={{ background: '#f8f9fa', border: '1px solid #e9ecef', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            <FileText size={20} color="#003366" />
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>Descrição do Evento</span>
                        </div>
                        <div style={{ fontSize: '15px', color: '#444', lineHeight: '1.6' }}>{data.description}</div>
                    </div>

                    {/* AI Recommendation */}
                    {!isTratado && (
                        <div style={{ background: '#E3F2FD', border: '1px solid #BBDEFB', padding: '20px', borderRadius: '8px', marginBottom: '30px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1 }}>
                                <Activity size={100} color="#0288D1" />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', position: 'relative', zIndex: 1 }}>
                                <Activity size={20} color="#0277BD" />
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#0277BD', textTransform: 'uppercase' }}>Recomendação IA</span>
                            </div>
                            <div style={{ fontSize: '15px', color: '#01579B', lineHeight: '1.6', position: 'relative', zIndex: 1 }}>{data.recommendations}</div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="no-print" style={{ marginBottom: '40px', display: 'flex', justifyContent: 'center', gap: '15px' }}>
                        <button
                            onClick={() => navigate(`/acr/${id}`)}
                            style={{
                                padding: '15px 30px', fontSize: '16px', background: '#003366', color: 'white',
                                border: 'none', borderRadius: '8px', cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', gap: '10px', fontWeight: 'bold',
                                boxShadow: '0 4px 10px rgba(0,51,102,0.3)', transition: 'transform 0.2s'
                            }}
                        >
                            <Brain size={20} />
                            REALIZAR ACR (IA)
                        </button>
                    </div>

                    {isTratado ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

                            {/* Análise de Causa Section */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                                    <Layers size={24} color="#003366" />
                                    <h3 style={{ margin: 0, color: '#003366', fontSize: '20px' }}>Análise de Causa Raiz</h3>
                                </div>
                                <div style={{ background: '#fff', border: '1px solid #ddd', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                                    {renderCauseAnalysis(data.analysis_cause)}
                                </div>
                            </div>

                            {/* AI Conclusion Section */}
                            {data.analysis_conclusion && (
                                <div style={{ background: '#E3F2FD', border: '1px solid #BBDEFB', padding: '20px', borderRadius: '8px', position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                        <Brain size={20} color="#0D47A1" />
                                        <h3 style={{ margin: 0, color: '#0D47A1', fontSize: '16px', fontWeight: 'bold' }}>Conclusão da IA</h3>
                                    </div>
                                    <div style={{ fontSize: '15px', color: '#01579B', lineHeight: '1.6' }}>
                                        {data.analysis_conclusion}
                                    </div>
                                </div>
                            )}

                            {/* Plano de Ação Section */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                                    <AlertTriangle size={24} color="#F57C00" />
                                    <h3 style={{ margin: 0, color: '#F57C00', fontSize: '20px' }}>Plano de Ação (5W2H)</h3>
                                </div>
                                <div style={{ background: '#fff', border: '1px solid #ddd', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                                    {renderActionPlan(data.action_plan)}
                                </div>
                            </div>

                            <button
                                onClick={handleForwardEmail}
                                className="no-print"
                                style={{
                                    width: '100%', padding: '18px', background: '#0288D1', color: 'white', border: 'none',
                                    borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', marginTop: '10px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                    transition: 'background 0.2s'
                                }}
                            >
                                <Mail size={20} />
                                ENCAMINHAR PARA GESTOR
                            </button>

                            <button
                                onClick={generatePDF}
                                className="no-print"
                                style={{
                                    width: '100%', padding: '18px', background: '#003366', color: 'white', border: 'none',
                                    borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', marginTop: '10px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                    transition: 'background 0.2s'
                                }}
                                onMouseOver={(e) => e.target.style.background = '#002244'}
                                onMouseOut={(e) => e.target.style.background = '#003366'}
                            >
                                <Printer size={20} />
                                BAIXAR RELATÓRIO PDF
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555', display: 'block', marginBottom: '8px' }}>
                                    Análise de Causa (O que causou o evento?)
                                </label>
                                <textarea
                                    value={causa}
                                    onChange={e => setCausa(e.target.value)}
                                    placeholder="Descreva a causa raiz do problema..."
                                    style={{
                                        width: '100%', height: '120px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px',
                                        boxSizing: 'border-box', fontFamily: "'Roboto', sans-serif", fontSize: '15px',
                                        transition: 'border-color 0.2s', outline: 'none'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#003366'}
                                    onBlur={(e) => e.target.style.borderColor = '#ccc'}
                                ></textarea>
                            </div>

                            <div>
                                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555', display: 'block', marginBottom: '8px' }}>
                                    Ação Corretiva (O que será feito?)
                                </label>
                                <textarea
                                    value={plano}
                                    onChange={e => setPlano(e.target.value)}
                                    placeholder="Descreva o plano de ação para evitar recorrência..."
                                    style={{
                                        width: '100%', height: '120px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px',
                                        boxSizing: 'border-box', fontFamily: "'Roboto', sans-serif", fontSize: '15px',
                                        transition: 'border-color 0.2s', outline: 'none'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#003366'}
                                    onBlur={(e) => e.target.style.borderColor = '#ccc'}
                                ></textarea>
                            </div>

                            {/* Seção de Upload de Evidências */}
                            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px dashed #ccc' }}>
                                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555', display: 'block', marginBottom: '8px' }}>
                                    Anexar Evidências (Fotos, Listas, Documentos)
                                </label>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        style={{ fontSize: '14px' }}
                                    />
                                    <button
                                        onClick={handleUpload}
                                        disabled={!file || uploading}
                                        style={{
                                            padding: '8px 15px', background: uploading ? '#ccc' : '#003366', color: 'white',
                                            border: 'none', borderRadius: '4px', cursor: uploading ? 'not-allowed' : 'pointer',
                                            fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px'
                                        }}
                                    >
                                        {uploading ? <Activity size={14} className="animate-spin" /> : <Save size={14} />}
                                        {uploading ? 'Enviando...' : 'Anexar'}
                                    </button>
                                </div>
                                {uploadedFiles.length > 0 && (
                                    <div style={{ marginTop: '10px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#2E7D32' }}>Arquivos Anexados:</span>
                                        <ul style={{ margin: '5px 0 0 20px', padding: 0, fontSize: '13px', color: '#555' }}>
                                            {uploadedFiles.map((f, idx) => (
                                                <li key={idx}>
                                                    <a href={f.url} target="_blank" rel="noopener noreferrer" style={{ color: '#003366', textDecoration: 'none' }}>
                                                        {f.filename}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleSave}
                                style={{
                                    width: '100%', padding: '18px', background: '#2E7D32', color: 'white', border: 'none',
                                    borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                    boxShadow: '0 4px 6px rgba(46, 125, 50, 0.2)', transition: 'transform 0.1s, background 0.2s'
                                }}
                                onMouseOver={(e) => e.target.style.background = '#1B5E20'}
                                onMouseOut={(e) => e.target.style.background = '#2E7D32'}
                                onMouseDown={(e) => e.target.style.transform = 'scale(0.98)'}
                                onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
                            >
                                <Save size={20} />
                                FINALIZAR TRATATIVA
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>

    );
}
