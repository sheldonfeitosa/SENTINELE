import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Swal from 'sweetalert2';
import axios from 'axios';

export default function ReportingForm() {
    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const [loading, setLoading] = useState(false);
    const [setores, setSetores] = useState([]);

    // Simulação de lista de setores (pode vir do backend depois)
    useEffect(() => {
        setSetores([
            "PRONTO ATENDIMENTO", "RECEPÇÃO", "ENFERMARIA", "UTI", "CENTRO CIRÚRGICO",
            "FARMÁCIA", "NUTRIÇÃO", "HIGIENE E LIMPEZA", "MANUTENÇÃO", "ADMINISTRATIVO"
        ]);
    }, []);

    const onSubmit = async (data) => {
        if (data.descricao.length < 10) {
            Swal.fire('Atenção', 'A descrição deve ter pelo menos 10 caracteres.', 'warning');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post('http://localhost:3001/api/events', data);

            if (response.data.success) {
                Swal.fire({
                    title: 'Sucesso!',
                    text: response.data.message,
                    icon: 'success',
                    confirmButtonText: 'OK'
                }).then(() => {
                    reset();
                });
            } else {
                Swal.fire('Erro', response.data.message, 'error');
            }
        } catch (error) {
            Swal.fire('Erro', 'Falha na comunicação: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            {loading && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(255,255,255,0.95)', zIndex: 9999, display: 'flex',
                    flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}>
                    <h3>💾 Enviando notificação...</h3>
                    <p>Aguarde enquanto processamos sua solicitação.</p>
                </div>
            )}

            <div className="header">
                <h1>🔔 SENTINELA AI</h1>
                <p>Sistema de Notificação de Eventos</p>
            </div>

            <div className="form-content">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="form-group">
                        <label className="label">Nome do Paciente *</label>
                        <input
                            {...register("paciente", { required: true })}
                            placeholder="Nome completo do paciente"
                        />
                        {errors.paciente && <span className="error-message">Campo obrigatório</span>}
                    </div>

                    <div className="form-group">
                        <label className="label">Nome da Mãe</label>
                        <input {...register("nome_mae")} placeholder="Nome completo da mãe" />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="label">Data de Nascimento</label>
                            <input type="date" {...register("nascimento")} />
                        </div>
                        <div className="form-group">
                            <label className="label">Sexo</label>
                            <select {...register("sexo")}>
                                <option value="">Selecione</option>
                                <option value="Masculino">Masculino</option>
                                <option value="Feminino">Feminino</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="label">Data de Internação</label>
                        <input type="date" {...register("data_internacao")} />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="label">Data do Evento *</label>
                            <input type="date" {...register("data_evento", { required: true })} />
                            {errors.data_evento && <span className="error-message">Campo obrigatório</span>}
                        </div>
                        <div className="form-group">
                            <label className="label">Período</label>
                            <select {...register("periodo")}>
                                <option value="">Selecione</option>
                                <option value="Manhã">Manhã</option>
                                <option value="Tarde">Tarde</option>
                                <option value="Noite">Noite</option>
                                <option value="Madrugada">Madrugada</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="label">Setor do Evento *</label>
                        <input list="listaSetores" {...register("setor", { required: true })} placeholder="Onde ocorreu o evento" />
                        {errors.setor && <span className="error-message">Campo obrigatório</span>}
                    </div>

                    <div className="form-group">
                        <label className="label" style={{ color: '#d32f2f' }}>Setor a Notificar *</label>
                        <input list="listaSetores" {...register("setor_notificado", { required: true })} placeholder="Setor responsável pela tratativa" />
                        <small style={{ color: '#666' }}>Este setor receberá a notificação</small>
                        {errors.setor_notificado && <span className="error-message">Campo obrigatório</span>}
                    </div>

                    <datalist id="listaSetores">
                        {setores.map((s, i) => <option key={i} value={s} />)}
                    </datalist>

                    <div className="form-group">
                        <label className="label">Descrição Detalhada do Evento *</label>
                        <textarea
                            rows="6"
                            {...register("descricao", { required: true })}
                            placeholder="Descreva com detalhes o que aconteceu..."
                        ></textarea>
                        {errors.descricao && <span className="error-message">Campo obrigatório</span>}
                    </div>

                    <button type="submit" className="btn">📨 ENVIAR NOTIFICAÇÃO</button>
                </form>
            </div>
        </div>
    );
}
