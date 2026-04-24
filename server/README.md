# Corban Connect · Backend

Servidor Node.js que faz **todo** o trabalho de notificação da plataforma:

- **WhatsApp** via [Baileys](https://github.com/WhiskeySockets/Baileys)
  (WhatsApp Web reverse-engineered, gratuito — sem Twilio/Meta Business API).
- **E-mail** via Nodemailer + qualquer SMTP (Gmail App Password, SES, Zoho,
  servidor próprio etc.). O Corban responsável é colocado em **CC** para
  transparência.
- **Régua D+0 / D+3 / D+7 / D+15** automática via `node-cron`, respeitando
  horário comercial e opt-out do cliente.
- **Escuta** o WhatsApp oficial: quando o cliente responde, registra em
  `notification_log` e reencaminha a mensagem ao Corban responsável.

Zero custo recorrente de provedor. Arquitetura idêntica em espírito à do
seu projeto de cobrança com Baileys + n8n, porém consolidada num único
serviço: o backend faz o papel do n8n, sem precisar orquestrador externo.

---

## Setup

```bash
cd server
cp .env.example .env
# preencha SUPABASE_*, SMTP_*, INTERNAL_API_TOKEN

npm install
npm run dev
```

Ao subir pela primeira vez o terminal vai imprimir um **QR Code**. Escaneie
com o número oficial (WhatsApp → Aparelhos conectados → Conectar um
aparelho). As credenciais são salvas em `AUTH_DIR` (default
`./auth_baileys`) — se a pasta persiste, não precisa parear de novo.

## Endpoints

| Método | Rota | Auth | O que faz |
| --- | --- | --- | --- |
| `GET` | `/health` | — | Status geral: uptime, WhatsApp, régua |
| `GET` | `/qr` | — | Retorna o QR pendente (se tiver) para parear |
| `POST` | `/send/whatsapp` | Bearer | `{ phone, message }` — envio direto |
| `POST` | `/send/email` | Bearer | `{ to, cc?, subject, html?, text? }` |
| `POST` | `/dispatch` | Bearer | `{ contract_id, reg?, channel? }` — template completo, com fallback e log |
| `POST` | `/ruler/run` | Bearer | Força uma rodada da régua agora |
| `GET` | `/verify/email` | Bearer | Testa a configuração SMTP |

Autenticação: header `Authorization: Bearer $INTERNAL_API_TOKEN`.

## Régua — como funciona

A cada `RULER_CRON` (default `0 * * * *` — hora cheia), o scheduler:

1. Respeita o horário comercial `BUSINESS_HOURS_START`..`BUSINESS_HOURS_END`
   (America/Sao_Paulo).
2. Busca até `RULER_BATCH_SIZE` contratos com **pendência ativa**:
   - `pendency_type != null`, ou
   - `status = 'canceled'` com `motivo_recusa != null` (REDIGITADA etc.).
3. Para cada contrato, calcula os dias desde `last_update`.
4. Escolhe a régua (D+0/D+3/D+7/D+15) correspondente.
5. Checa em `notification_log` se já disparou para aquele contrato+régua.
   Se ainda não, chama `dispatchNotification` com delay aleatório entre
   `DISPATCH_MIN_DELAY_MS` e `DISPATCH_MAX_DELAY_MS` (anti-ban).

`dispatchNotification`:

1. Confere `client_opt_outs` (LGPD) — se opted-out, grava `failed` e para.
2. Busca o Corban em `public.corbans` (CNPJ → email/whatsapp/nome).
3. Tenta WhatsApp primeiro; se offline/sem número/erro, cai para e-mail.
4. No e-mail, coloca o Corban em `cc`.
5. Sempre grava uma linha em `notification_log` (delivered/failed + detalhe).

## Cadastro dos Corbans

A tabela `public.corbans(cnpj, nome, email, whatsapp)` mapeia o CNPJ
extraído do `NOME PROMOTORA` do XLSX para os contatos do Corban. Hoje é
alimentada manualmente via SQL Editor:

```sql
insert into public.corbans (cnpj, nome, email, whatsapp) values
  ('64839379', 'EDLEA BARBOSA',   'edlea@promotora.com.br',  '5561999990000'),
  ('12345678', 'Outro Corban',    'outro@promotora.com.br',  '5511999990000');
```

(Interface de cadastro no Dashboard Interno virá numa próxima iteração.)

## Deploy

O backend precisa:

- Processo **long-lived** (não serverless): o Baileys mantém websocket.
- Pasta `auth_baileys` persistente (mount de volume se Docker/Fly, disk em
  Railway/Render, filesystem em VPS).
- Sair da rede para `web.whatsapp.com` e para o SMTP.

Opções comuns: VPS (Hetzner/DigitalOcean), Railway, Fly.io, Render. Não
usar Vercel/Netlify (efêmeros). Recomendado usar `pm2` ou systemd na VPS.

Exemplo com **pm2**:

```bash
npm install -g pm2
pm2 start src/index.js --name corban-connect-server
pm2 save
pm2 startup
```

## Anti-ban · boas práticas

- **Número dedicado** — não use seu pessoal. Ideal um chip só pra isso.
- **Warmup** — nos primeiros dias, disparar só algumas mensagens.
- **Delay aleatório** — já configurado (5–15s default).
- **Horário comercial** — já configurado (8h–20h default).
- **Opt-out respeitado** — cliente que sai não recebe mais.
- **Templates variados** — pequenas variações de saudação (já feito).
- **Evitar spam** — a régua tem idempotência: nunca dispara D+N duas vezes
  para o mesmo contrato.

## O que NÃO está no escopo do backend

- UI de cadastro dos Corbans → virá no dashboard interno do front.
- Central de atendimento: o backend reencaminha respostas ao Corban, mas
  o atendimento em si é no próprio WhatsApp do Corban (PRD §4.1).
