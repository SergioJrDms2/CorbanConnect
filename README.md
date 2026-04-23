# Corban Connect

Plataforma de notificações automáticas e portal de acompanhamento de contratos da Starbank. O produto estrutura o fluxo entre Starbank, Corban e cliente final, preservando o Corban como intermediário exclusivo e garantindo que pendências contratuais sejam comunicadas de forma proativa.

> PRD v1.0 — protótipo navegável em React + TypeScript + Tailwind.

## Stack

- React 18 + TypeScript
- Vite 5
- Tailwind CSS 3
- lucide-react (ícones)

## Portais disponíveis

| Portal | Persona | Acesso |
| --- | --- | --- |
| **Portal do Cliente** | Cliente final | CPF + data de nascimento |
| **Painel do Corban** | Correspondente bancário | Credenciais Starbank |
| **Dashboard Interno** | Analista Starbank | Credenciais internas |

Além disso, há um preview dos templates de notificação (WhatsApp / SMS / E-mail) e da régua de reengajamento D+0, D+3, D+7, D+15.

## Scripts

```bash
npm install       # instala dependências
npm run dev       # sobe o servidor Vite em http://localhost:5173
npm run build     # compila TypeScript e gera o bundle de produção
npm run preview   # pré-visualiza o build de produção
npm run lint      # checagem de tipos com tsc
```

## Estrutura

```
src/
├── App.tsx                      # roteamento entre views (state-based)
├── main.tsx
├── index.css                    # Tailwind base + fonte Geist
├── types.ts                     # tipos compartilhados
├── components/                  # Brand, Card, Buttons, StatusBadge, Field
├── data/mockContracts.ts        # massa de dados do protótipo
├── lib/
│   ├── format.ts                # formatBRL, formatCpf, formatBirth, maskCpf
│   └── theme.ts                 # STATUS_CONFIG, colorMap
└── views/
    ├── HomeView.tsx
    ├── ClientLoginView.tsx
    ├── ClientStatusView.tsx
    ├── CorbanLoginView.tsx
    ├── CorbanDashboardView.tsx
    ├── CorbanContractView.tsx
    ├── InternalDashboardView.tsx
    └── NotificationPreviewView.tsx
```

## Login de demo

- **Cliente** — CPF `123.456.789-01` + nascimento `15/03/1968` (o protótipo aceita qualquer CPF válido + data com 8 dígitos).
- **Corban / Interno** — basta clicar em "Acessar painel".

## Premissas inegociáveis

1. O cliente pertence ao Corban — a Starbank nunca cria canal de suporte direto.
2. A abordagem ao Corban é de parceria, nunca de controle.
3. Toda comunicação com o cliente é informativa e redirecionadora.
