# Blueprint de Comunicações - Fluxo de E-mails Sentinela AI 📧

Este documento detalha todos os pontos de contato via e-mail do sistema, explicando o gatilho, o destinatário e o objetivo estratégico de cada mensagem.

---

## 🏗️ Estrutura Técnica de Mensageria
- **Provedor**: Resend API.
- **Segurança**: Sistema de Fallback Automático (usa `onboarding@resend.dev` se o domínio principal falhar).
- **Design**: Templates HTML responsivos com branding corporativo (Navy Blue & Gold).

---

## 1. Ciclo de Vida do Incidente (Fluxo Principal)

### A. Notificação de Ocorrência
- **Gatilho**: Imediatamente após um incidente ser registrado (via formulário logado ou anônimo).
- **Destinatário**: Gestor do Setor Notificado.
- **Objetivo**: Informar a existência da falha e fornecer o link direto para iniciar a investigação.
- **Destaque**: Contém a análise prévia da IA sobre a gravidade do evento.

### B. Requisição de Ação (Ação Necessária)
- **Gatilho**: Disparo manual pelo administrador ou automático por proximidade de vencimento.
- **Destinatário**: Gestor do Setor.
- **Objetivo**: Cobrar o preenchimento do Plano de Ação pendente. Usa tom de voz de **Compliance e Governança Clínica**.

### C. Nota de Escalonamento (Alta Gestão)
- **Gatilho**: Incidentes graves que ultrapassam o prazo regulamentar (5 dias) ou por decisão da Qualidade.
- **Destinatário**: Diretores e Alta Gestão hospitalar.
- **Objetivo**: Alertas sobre **Risco Institucional**.
- **Destaque**: Permite que o diretor dê autonomia para dilatar prazos ou revisar a tratativa diretamente do e-mail.

---

## 2. Gestão de Prazos e Governança

### D. Solicitação de Alteração de Prazo
- **Gatilho**: Quando um Gestor de Setor solicita mais tempo para preencher a tratativa.
- **Destinatário**: Gestor de Riscos (Qualidade).
- **Objetivo**: Solicitar autorização formal para mudar a data de vencimento, incluindo a justificativa do atraso.

### E. Confirmação de Prazo (Deferido/Indeferido)
- **Gatilho**: Finalização da análise do Gestor de Risco sobre a solicitação acima.
- **Destinatário**: Gestor do Setor solicitante.
- **Objetivo**: Notificar se o novo prazo foi aceito (Deferido) ou se o original permanece (Indeferido).

---

## 3. Gestão de Contas e Onboarding

### F. Boas-vindas (Welcome Email)
- **Gatilho**: Criação de um novo Ambiente de Teste ou novo usuário.
- **Destinatário**: Novo Usuário/Administrador do Hospital.
- **Objetivo**: Entregar as credenciais (E-mail e Senha Provisória) e o link de acesso exclusivo do hospital.

### G. Redefinição de Senha
- **Gatilho**: Solicitação de "Esqueci minha senha".
- **Destinatário**: Usuário solicitante.
- **Objetivo**: Enviar o link seguro (Token JWT) com validade de 1 hora para redefinir o acesso.

### H. Notificação de Novo Lead (Admin Interno)
- **Gatilho**: Solicitação de Trial preenchida na Landing Page.
- **Destinatário**: Equipe de Vendas/Comercial do Sentinela AI.
- **Objetivo**: Notificar que um novo hospital tem interesse na plataforma para contato comercial imediato.

---

## 🧠 Lógica de Automação (Mecânica)

| Evento | Tempo de Disparo | Impacto |
| :--- | :--- | :--- |
| **Novo Incidente** | T=0 | Engajamento Imediato |
| **Lembretes** | T + 48h | Redução de Pendências |
| **Escalonamento** | T + 120h | Blindagem Jurídica e Risco Institucional |

---
*Este blueprint garante que a comunicação inter-setorial seja fluida, auditável e focada na redução de danos ao paciente.*
