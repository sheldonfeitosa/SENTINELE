const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');
const aiService = require('./services/aiService');
const emailService = require('./services/emailService');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// Servir arquivos estáticos da pasta uploads
app.use('/uploads', express.static('uploads'));

// Rota de teste
app.get('/', (req, res) => {
    res.send('Sentinela AI Backend Running');
});

// --- API DE CONFIGURAÇÕES (SETTINGS) ---

// Buscar configuração
app.get('/api/settings/:key', (req, res) => {
    const { key } = req.params;
    db.get("SELECT value FROM settings WHERE key = ?", [key], (err, row) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (!row) return res.status(404).json({ success: false, message: "Configuração não encontrada" });
        res.json({ success: true, value: row.value });
    });
});

// Atualizar configuração
app.post('/api/settings', (req, res) => {
    const { key, value } = req.body;
    if (!key || !value) return res.status(400).json({ success: false, message: "Chave e valor são obrigatórios" });

    db.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", [key, value], function (err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: "Configuração atualizada com sucesso!" });
    });
});

// --- FIM API CONFIGURAÇÕES ---

// Rota para receber o formulário
app.post('/api/events', async (req, res) => {
    const data = req.body;

    try {
        // 1. Classificação via IA
        const aiResult = await aiService.classifyEvent(data.descricao);

        // 2. Calcular Prazo (10 dias para NC, 5 para EA)
        const diasPrazo = aiResult.tipo_notificacao.includes("CONFORMIDADE") ? 10 : 5;
        const prazo = new Date();
        prazo.setDate(prazo.getDate() + diasPrazo);

        const query = `
      INSERT INTO events (
        patient_name, mother_name, birth_date, sex, sector_reporter, sector_notified, 
        description, event_date, period, admission_date, 
        notification_type, event_type, classification, recommendations, status, deadline
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        const params = [
            data.paciente, data.nome_mae, data.nascimento, data.sexo, data.setor, data.setor_notificado,
            data.descricao, data.data_evento, data.periodo, data.data_internacao,
            aiResult.tipo_notificacao, aiResult.tipo_evento, aiResult.classificacao, aiResult.recomendacao_blackbelt,
            'Aguardando Tratativa', prazo.toISOString().split('T')[0]
        ];

        db.run(query, params, function (err) {
            if (err) {
                res.status(500).json({ success: false, message: err.message });
                return;
            }

            const newId = this.lastID;

            // 3. Enviar Notificação para o Gestor de Risco (Dinâmico do Banco)
            db.get("SELECT value FROM settings WHERE key = 'risk_manager_email'", [], (err, row) => {
                const emailGestorRisco = row ? row.value : "sheldonfeitosa@gmail.com"; // Fallback

                emailService.sendEmail(
                    emailGestorRisco,
                    `[SENTINELA AI] 🔔 ALERTA DE RISCO - ID ${newId}`,
                    emailService.templates.riskAlert({
                        ID: newId,
                        SETOR_NOTIFICADO: data.setor_notificado,
                        DESCRICAO: data.descricao,
                        PRAZO: prazo.toLocaleDateString('pt-BR'),
                        SUGESTAO_IA: aiResult.recomendacao_blackbelt
                    })
                );
            });

            res.json({ success: true, id: newId, message: 'Notificação registrada e classificada com sucesso!' });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Erro no processamento da IA" });
    }
});

// Rota para listar eventos (Dashboard)
app.get('/api/events', (req, res) => {
    db.all("SELECT * FROM events ORDER BY id DESC", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Rota para buscar um evento específico
app.get('/api/events/:id', (req, res) => {
    const { id } = req.params;
    db.get("SELECT * FROM events WHERE id = ?", [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: "Evento não encontrado" });
            return;
        }
        res.json(row);
    });
});

// Rota para Gerar ACR (IA)
app.post('/api/events/:id/acr', (req, res) => {
    const { id } = req.params;
    console.log(`[API] Recebida solicitação de ACR para evento ${id}`);

    db.get("SELECT description FROM events WHERE id = ?", [id], async (err, row) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (!row) return res.status(404).json({ success: false, message: "Evento não encontrado" });

        try {
            const analysis = await aiService.generateACR(row.description);

            // Se a IA falhar (retornar null ou fallback), ainda retornamos 200 para o frontend exibir o fallback
            if (!analysis) {
                return res.json({
                    success: true,
                    analysis: {
                        ishikawa: { metodo: ["Falha na IA"], maquina: [], mao_de_obra: [], material: [], meio_ambiente: [], medida: [] },
                        plano_5w2h: [],
                        analise_conclusiva: "Erro ao gerar análise. Tente novamente."
                    }
                });
            }

            res.json({ success: true, analysis });
        } catch (error) {
            console.error("Erro ao gerar ACR:", error);
            res.status(500).json({ success: false, message: "Erro interno no servidor" });
        }
    });
});

// Rota para salvar tratativa
app.post('/api/events/:id/tratativa', (req, res) => {
    const { id } = req.params;
    const { analise_causa, plano_acao, analise_conclusiva } = req.body;

    const query = `
    UPDATE events 
    SET analysis_cause = ?, action_plan = ?, analysis_conclusion = ?, status = 'TRATADO', closed_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `;

    db.run(query, [analise_causa, plano_acao, analise_conclusiva, id], function (err) {
        if (err) {
            res.status(500).json({ success: false, message: err.message });
            return;
        }
        res.json({ success: true, message: "Tratativa salva com sucesso!" });
    });
});

// Configuração do Multer
// Configuração do Multer com Segurança
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        // Sanitizar o ID para garantir que é seguro usar no nome do arquivo
        const safeId = req.params.id.replace(/[^0-9]/g, '');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, safeId + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Filtro de Arquivos (Allowlist)
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .doc, .docx
        'text/plain', 'text/csv'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de arquivo não suportado. Apenas imagens, PDF e documentos são permitidos.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // Limite de 5MB
    },
    fileFilter: fileFilter
});

// Rota para upload de evidências com Validação Anti-SQL Injection
app.post('/api/events/:id/upload', (req, res) => {
    const { id } = req.params;

    // 1. Validação Estrita de Input (Anti-SQL Injection)
    if (!/^\d+$/.test(id)) {
        return res.status(400).json({ success: false, message: "ID do evento inválido." });
    }

    // 2. Verificação no Banco de Dados (Consulta Parametrizada)
    db.get("SELECT id FROM events WHERE id = ?", [id], (err, row) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Erro ao verificar evento." });
        }
        if (!row) {
            return res.status(404).json({ success: false, message: "Evento não encontrado." });
        }

        // 3. Processar Upload (apenas se passou nas verificações anteriores)
        const uploadSingle = upload.single('file');

        uploadSingle(req, res, function (err) {
            if (err instanceof multer.MulterError) {
                // Erro do Multer (ex: arquivo muito grande)
                return res.status(400).json({ success: false, message: `Erro no upload: ${err.message} ` });
            } else if (err) {
                // Erro desconhecido ou do filtro de arquivo
                return res.status(400).json({ success: false, message: err.message });
            }

            if (!req.file) {
                return res.status(400).json({ success: false, message: "Nenhum arquivo enviado." });
            }

            const filePath = req.file.path;
            const fileUrl = `http://localhost:${PORT}/${filePath.replace(/\\/g, '/')}`;

            res.json({
                success: true,
                message: "Arquivo enviado com sucesso!",
                file: {
                    filename: req.file.filename,
                    url: fileUrl,
                    mimetype: req.file.mimetype
                }
            });
        });
    });
});



// --- ROTAS DE GESTORES ---

// Listar Gestores (com setores)
app.get('/api/managers', (req, res) => {
    const query = `
        SELECT m.id, m.name, m.email, GROUP_CONCAT(ms.sector) as sectors
        FROM managers m
        LEFT JOIN manager_sectors ms ON m.id = ms.manager_id
        GROUP BY m.id
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        // Convert comma-separated sectors string to array
        const managers = rows.map(row => ({
            ...row,
            sectors: row.sectors ? row.sectors.split(',') : []
        }));
        res.json(managers);
    });
});

// Cadastrar Gestor (Multi-setor)
app.post('/api/managers', (req, res) => {
    const { name, email, sectors } = req.body; // sectors is an array
    console.log("[API] Tentativa de cadastro de gestor:", req.body);

    db.run("INSERT INTO managers (name, email) VALUES (?, ?)", [name, email], function (err) {
        if (err) {
            console.error("[API] Erro ao cadastrar gestor:", err);
            return res.status(500).json({ success: false, message: err.message });
        }
        const managerId = this.lastID;

        // Insert sectors
        if (sectors && sectors.length > 0) {
            const stmt = db.prepare("INSERT INTO manager_sectors (manager_id, sector) VALUES (?, ?)");
            sectors.forEach(sector => {
                stmt.run(managerId, sector, (err) => {
                    if (err) console.error(`[API] Erro ao vincular setor ${sector}:`, err);
                });
            });
            stmt.finalize();
        }

        console.log("[API] Gestor cadastrado com ID:", managerId);
        res.json({ success: true, id: managerId, message: "Gestor cadastrado com sucesso!" });
    });
});

// Encaminhar Email para Gestor
app.post('/api/events/:id/forward', (req, res) => {
    const { id } = req.params;

    // 1. Buscar dados do evento
    db.get("SELECT * FROM events WHERE id = ?", [id], (err, event) => {
        if (err || !event) return res.status(404).json({ success: false, message: "Evento não encontrado." });

        // 2. Buscar gestor do setor notificado (via manager_sectors)
        db.get(
            "SELECT m.email FROM managers m JOIN manager_sectors ms ON m.id = ms.manager_id WHERE ms.sector = ?",
            [event.sector_notified],
            (err, manager) => {
                if (err) return res.status(500).json({ success: false, message: "Erro ao buscar gestor." });

                if (!manager) {
                    return res.status(404).json({ success: false, message: `Nenhum gestor encontrado para o setor: ${event.sector_notified}` });
                }

                // 3. Enviar Email
                emailService.sendEmail(
                    manager.email,
                    `[SENTINELA AI] Notificação Pendente - ID ${id}`,
                    emailService.templates.notification({
                        SETOR_NOTIFICADO: event.sector_notified,
                        DESCRICAO: event.description,
                        RECOMENDACOES_QUALIDADE: event.recommendations,
                        LINK_DINAMICO: `http://localhost:5173/tratativa/${id}`
                    })
                );

                // 4. Atualizar status de notificação no banco
                db.run("UPDATE events SET manager_notified = 1 WHERE id = ?", [id], (err) => {
                    if (err) console.error("Erro ao atualizar status de notificação:", err);
                });

                res.json({ success: true, message: `Email enviado para ${manager.email}` });
            }
        );
    });
});

// Escalar para Presidência (Manual)
app.post('/api/events/:id/escalate', (req, res) => {
    const { id } = req.params;

    db.get("SELECT * FROM events WHERE id = ?", [id], (err, event) => {
        if (err || !event) return res.status(404).json({ success: false, message: "Evento não encontrado." });

        if (event.escalation_alert_sent === 1) {
            return res.status(400).json({ success: false, message: "Este evento já foi escalado para a presidência." });
        }

        // Buscar email da presidência
        db.get("SELECT value FROM settings WHERE key = 'presidency_email'", [], (err, row) => {
            const presidencyEmail = row ? row.value : null;

            if (!presidencyEmail) {
                return res.status(400).json({ success: false, message: "Email da Presidência não configurado." });
            }

            // Enviar Email
            emailService.sendEmail(
                presidencyEmail,
                `[SENTINELA AI] ⚠️ ESCALONAMENTO: ID ${id}`,
                emailService.templates.escalationAlert({
                    ID: event.id,
                    SETOR: event.sector_notified,
                    DESCRICAO: event.description,
                    DATA_ALERTA: event.deadline_alert_date ? new Date(event.deadline_alert_date).toLocaleDateString() : 'Data não registrada'
                })
            );

            // Atualizar status
            db.run("UPDATE events SET escalation_alert_sent = 1 WHERE id = ?", [id], (err) => {
                if (err) return res.status(500).json({ success: false, message: err.message });
                res.json({ success: true, message: `Escalonamento enviado para ${presidencyEmail}` });
            });
        });
    });
});

// Atualizar Gestor (Multi-setor)
app.put('/api/managers/:id', (req, res) => {
    const { id } = req.params;
    const { name, email, sectors } = req.body; // sectors is an array

    db.run("UPDATE managers SET name = ?, email = ? WHERE id = ?", [name, email, id], function (err) {
        if (err) return res.status(500).json({ success: false, message: err.message });

        // Update sectors: Delete all and re-insert
        db.run("DELETE FROM manager_sectors WHERE manager_id = ?", [id], (err) => {
            if (err) console.error("Erro ao limpar setores antigos:", err);

            if (sectors && Array.isArray(sectors) && sectors.length > 0) {
                const stmt = db.prepare("INSERT INTO manager_sectors (manager_id, sector) VALUES (?, ?)");
                sectors.forEach(sector => {
                    stmt.run(id, sector, (err) => {
                        if (err) console.error(`[API] Erro ao vincular setor ${sector}:`, err);
                    });
                });
                stmt.finalize();
            }
            res.json({ success: true, message: "Gestor atualizado com sucesso!" });
        });
    });
});

// Deletar Gestor
app.delete('/api/managers/:id', (req, res) => {
    const { id } = req.params;
    // Cascade delete sectors first (or rely on foreign key cascade if enabled, but manual is safer here)
    db.run("DELETE FROM manager_sectors WHERE manager_id = ?", [id], (err) => {
        if (err) console.error("Erro ao deletar setores do gestor:", err);

        db.run("DELETE FROM managers WHERE id = ?", [id], function (err) {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, message: "Gestor removido com sucesso!" });
        });
    });
});

// --- ROTINA DE VERIFICAÇÃO DE PRAZOS (CRON JOB SIMPLIFICADO) ---
const checkExpiredEvents = () => {
    console.log('[CRON] Verificando eventos atrasados...');
    const today = new Date().toISOString().split('T')[0];

    // Buscar eventos não tratados, com prazo vencido e que ainda não foram alertados
    const query = `
        SELECT * FROM events 
        WHERE status NOT LIKE '%TRATADO%' 
        AND deadline < ? 
        AND (deadline_alert_sent IS NULL OR deadline_alert_sent = 0)
    `;

    db.all(query, [today], (err, events) => {
        if (err) {
            console.error('[CRON] Erro ao buscar eventos atrasados:', err);
            return;
        }

        if (events.length === 0) {
            // console.log('[CRON] Nenhum evento atrasado pendente de alerta.');
            return;
        }

        console.log(`[CRON] Encontrados ${events.length} eventos atrasados. Iniciando alertas...`);

        events.forEach(event => {
            // Buscar gestor do setor
            db.get(
                "SELECT m.email FROM managers m JOIN manager_sectors ms ON m.id = ms.manager_id WHERE ms.sector = ?",
                [event.sector_notified],
                (err, manager) => {
                    if (err) {
                        console.error(`[CRON] Erro ao buscar gestor para setor ${event.sector_notified}:`, err);
                        return;
                    }

                    if (!manager) {
                        console.warn(`[CRON] Nenhum gestor encontrado para o setor: ${event.sector_notified}. Alerta não enviado.`);
                        return;
                    }

                    // Enviar Email
                    emailService.sendEmail(
                        manager.email,
                        `[ALERTA CRÍTICO] Prazo Expirado - Notificação Nº ${event.id}`,
                        emailService.templates.deadlineAlert({
                            ID: event.id,
                            SETOR: event.sector_notified
                        })
                    );

                    // Marcar como alertado e salvar data
                    db.run("UPDATE events SET deadline_alert_sent = 1, deadline_alert_date = CURRENT_TIMESTAMP WHERE id = ?", [event.id], (err) => {
                        if (err) console.error(`[CRON] Erro ao atualizar status de alerta do evento ${event.id}:`, err);
                        else console.log(`[CRON] Alerta enviado para evento ${event.id} (${manager.email})`);
                    });
                }
            );
        });
    });
};

// Executar verificação a cada 60 segundos (para teste)
setInterval(checkExpiredEvents, 60000);
// Executar imediatamente ao iniciar
setTimeout(checkExpiredEvents, 5000);

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
