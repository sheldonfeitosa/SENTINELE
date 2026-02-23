# Sentinela AI - Sistema de Gestão de Riscos Hospitalares

Este projeto é um sistema completo de gestão de riscos e segurança do paciente, utilizando Inteligência Artificial para análise e prevenção de incidentes.

## Arquitetura
- **Client**: React + Vite + TailwindCSS
- **Server**: Node.js + Express + TypeScript + Prisma
- **Database**: PostgreSQL (Supabase/NeonDB)

## Como Rodar Localmente

1.  Clone o repositório
2.  Instale as dependências:
    ```bash
    npm install
    cd client && npm install
    cd ../server && npm install
    ```
3.  Configure as variáveis de ambiente (`.env`) no Server e Client.
4.  Rode o servidor e o cliente:
    ```bash
    # Na raiz
    npm run dev
    ```

## Deploy
Este projeto está configurado para deploy no Vercel.
Consulte `deploy_guide.md` para mais detalhes.
