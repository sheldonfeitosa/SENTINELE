# Manual do Usuário - Sentinela AI 🛡️
## Gestão de Riscos e Segurança do Paciente com Inteligência Artificial

Bem-vindo ao **Sentinela AI**, a solução líder para hospitais que buscam excelência em segurança do paciente e conformidade com os padrões da ONA e certificações de qualidade. Este manual fornece uma visão detalhada de todas as funcionalidades e como extrair o máximo valor da nossa plataforma.

---

## 1. Visão Geral
O Sentinela AI é uma plataforma multitenant (SaaS) projetada para automatizar o ciclo de vida de incidentes hospitalares. Através de Inteligência Artificial de última geração, o sistema classifica incidentes, sugere causas raiz e monitora prazos de tratativa de forma autônoma.

---

## 2. Acesso e Gestão de Ambiente

### 2.1 Cadastro e Teste Grátis
Novas instituições podem solicitar um ambiente de teste de 30 dias diretamente na Landing Page. 
- **Dados necessários**: Nome, Instituição, E-mail corporativo e Telefone.
- **Ativação**: O sistema cria automaticamente um ambiente isolado (Tenant) e envia as credenciais por e-mail.

### 2.2 Login e Segurança
O acesso é realizado via e-mail e senha. Recomenda-se a alteração da senha provisória no primeiro acesso.
- **Recuperação de Senha**: Caso esqueça sua senha, utilize o link "Esqueci minha senha" para receber um token de redefinição seguro por e-mail.

---

## 3. Notificação de Incidentes (O Coração do Sistema)

### 3.1 Formulário de Notificação
O Sentinela AI permite notificações tanto por usuários logados quanto de forma anônima (através de links públicos específicos do hospital).
- **Campos principais**: Paciente, Data do evento, Setor e Descrição detalhada.
- **Categorização**: Escolha entre Evento Adverso, Near Miss ou Circunstância de Risco.

### 3.2 Triagem Automatizada por IA
Assim que o incidente é registrado, nossa IA analisa o texto e realiza:
- **Classificação de Risco**: (Leve, Moderado, Grave).
- **Taxonomia AI**: Identifica automaticamente se o evento é uma Queda, Erro de Medicação, Falha de Identificação, etc.
- **Recomendação Imediata**: Sugere ações de contenção baseadas nas melhores práticas de segurança.

---

## 4. Dashboard e Gestão Visual

O painel principal oferece uma visão 360º da segurança da instituição:
- **Cards de Status**: Veja quantos incidentes estão abertos, em tratativa ou vencidos.
- **Gráficos de Severidade**: Monitore a evolução dos riscos ao longo do tempo.
- **Setores Críticos**: Identifique rapidamente as áreas do hospital que mais notificam ou que possuem mais pendências.

---

## 5. Tratativa e Planos de Ação

### 5.1 Elaboração do Plano de Ação
Cada incidente gera uma página de tratativa dedicada onde o gestor do setor deve responder:
1. **Descrição da Investigação**: O que realmente aconteceu?
2. **Ação Corretiva**: Medidas tomadas para corrigir o problema atual.
3. **Plano de Prevenção**: Passos para evitar a reincidência.

### 5.2 Ferramentas de IA para Qualidade
Para ajudar a equipe de segurança, o sistema oferece botões inteligentes:
- **Análise de Causa Raiz (RCA)**: A IA analisa o incidente e sugere os fatores contribuintes (Pessoas, Processos, Equipamentos).
- **5 Porquês**: Uma técnica estruturada onde a IA faz perguntas sucessivas até chegar na causa fundamental do erro.

### 5.3 Chat de Suporte à Decisão
Em cada incidente, há um chat privado com o "Sentinela Bot", onde você pode fazer perguntas específicas como: *"Quais as diretrizes da Anvisa para esse tipo de evento?"* ou *"Como preencher o plano de ação de forma eficaz?"*

---

## 6. Fluxo de Escalonamento e Prazos

O sistema possui uma lógica de governança clínica rigorosa:
1. **Notificação Inicial**: O gestor do setor recebe um e-mail imediato.
2. **Lembrete de Prazo**: Se o plano de ação não for iniciado em 48h, um lembrete é enviado.
3. **Escalonamento (Alta Gestão)**: Se o incidente for Grave e o prazo de 5 dias expirar, o sistema envia automaticamente um **Report de Risco Institucional** para os Diretores (Alta Gestão).

### 6.1 Autonomia da Alta Gestão
Os diretores podem, através do e-mail de escalonamento:
- **Dilatar Prazo**: Conceder mais tempo para o setor resolver.
- **Intervir na Tratativa**: Revisar e aprovar os planos de ação.

---

## 7. Configurações Administrativas

### 7.1 Gestão de Setores
Cadastre todos os setores da instituição (Enfermagem, UTI, Farmácia, etc.) e associe os e-mails dos responsáveis para que as notificações cheguem ao destino certo.

### 7.2 Gestão de Usuários
- **ADMIN**: Acesso total ao hospital e configurações.
- **GESTOR_SETOR**: Acesso apenas aos incidentes do seu departamento.
- **QUALIDADE**: Visão de todos os incidentes e ferramentas de análise.

---

## 8. Assinatura e Planos
As funcionalidades Premium (IA Avançada, Reports de Alta Gestão, Dashboards Ilimitados) podem ser gerenciadas na aba "Planos".
- **Pagamento**: Integrado via Stripe para cartão de crédito com faturamento mensal automático.
- **Cancelamento**: Pode ser solicitado a qualquer momento sem multas, mantendo o acesso até o fim do ciclo atual.

---

## 9. Suporte Técnico
Para questões técnicas ou problemas de acesso:
- **E-mail**: suporte@sentinelaai.com.br
- **Portal de Ajuda**: [https://sentinelaai.com.br/ajuda](https://sentinelaai.com.br/ajuda)

---
*Sentinela AI - Vigilância Constante, Segurança Garantida.*
