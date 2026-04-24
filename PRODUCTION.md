# Ir para produção — Runbook

Este guia complementa o README: o que fazer **antes** de colocar a plataforma
no ar com usuários reais.

---

## 1. Rotacionar as chaves do Supabase (URGENTE)

O commit `611dc96` introduziu `.env.local` no repositório, o que expôs as
chaves do projeto Supabase na history. Isso precisa ser corrigido **antes**
do primeiro deploy público.

### Passo a passo

1. **Supabase Dashboard → Project Settings → API:**
   - `anon key` → **Regenerate**. Anote a nova.
   - `service_role key` → **Regenerate**. Anote a nova.
2. Atualize `.env.local` localmente com a nova `anon key`.
3. No Vercel (ou onde for hospedar), definir as envs:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY` (nova!)
4. Nos **secrets das Edge Functions** (Supabase CLI):
   ```bash
   supabase secrets set --env-file supabase/functions/.env
   ```
   Use a **nova** `service_role` para chamadas server-to-server.
5. Purgar `.env.local` do histórico do git:
   ```bash
   pip install git-filter-repo
   git filter-repo --path .env.local --invert-paths
   git push --force --all origin
   git push --force --tags origin
   ```
   > Isso reescreve a história. Todos os clones existentes precisam fazer
   > `git pull --rebase` ou reclonar. Avise o time antes.

---

## 2. Aplicar o schema mais recente

```bash
# No SQL Editor do Supabase, executar tudo em supabase/setup.sql
# Idempotente — pode rodar várias vezes.
```

O `setup.sql` agora inclui:
- Tabelas `contracts`, `notification_log`, `xlsx_uploads`, `client_opt_outs`
- RPCs seguras (security definer): `get_client_contracts`, `get_corban_contracts`,
  `get_contract_notifications`, `register_opt_out`
- RPCs de métricas: `metric_dashboard_kpis`, `metric_dispatches_by_day`,
  `metric_ruler_resolution`, `metric_recent_dispatches`
- RLS restritiva: `contracts` NÃO é lida direto pelo anon — somente pelas RPCs

---

## 3. Subir o backend de notificações (WhatsApp + E-mail)

O envio de mensagens **não** usa provedores pagos (Twilio, Meta, etc.).
Em vez disso, roda um backend Node.js próprio — ver `server/README.md`.
Ele faz:

- WhatsApp via Baileys (grátis, pareia por QR como o WhatsApp Web)
- E-mail via Nodemailer + SMTP de sua preferência (Gmail App Password,
  SES, servidor próprio). O Corban responsável vai em **CC**.
- Régua D+0/D+3/D+7/D+15 automática via `node-cron` (substitui o pg_cron).

Deploy resumido:

```bash
cd server
cp .env.example .env   # preencha SUPABASE_*, SMTP_*, INTERNAL_API_TOKEN
npm install
npm start              # ou pm2 start src/index.js --name corban-connect-server
```

No primeiro boot um **QR** é impresso no stdout — escaneie com o número
oficial em WhatsApp → Aparelhos conectados. A pasta `auth_baileys/`
guarda as credenciais e deve ser persistida entre restarts.

No SQL Editor, apenas a retenção de logs continua via pg_cron:

```sql
create extension if not exists pg_cron;

select cron.schedule(
  'corban-connect-retention-monthly',
  '0 3 1 * *',
  $$ delete from public.notification_log where sent_at < now() - interval '5 years'; $$
);
```

Cadastro dos Corbans (e-mails que recebem CC):

```sql
insert into public.corbans (cnpj, nome, email, whatsapp) values
  ('64839379', 'EDLEA BARBOSA', 'edlea@promotora.com.br', '5561999990000')
on conflict (cnpj) do update set
  nome = excluded.nome,
  email = excluded.email,
  whatsapp = excluded.whatsapp;
```

---

## 4. Boas práticas de anti-ban no WhatsApp (Baileys)

- **Número dedicado** — chip separado do pessoal, já aquecido com
  conversas normais.
- **Warmup** nos primeiros dias: poucas mensagens por hora antes de
  escalar.
- Delay aleatório entre disparos (já configurado: 5–15s).
- Horário comercial (já configurado: 8h–20h pt-BR).
- Opt-out respeitado (LGPD).
- Templates com pequena variação de saudação (já implementado).
- Régua idempotente: nunca manda D+N duas vezes para o mesmo contrato.

---

## 5. Deploy do front (Vercel)

```bash
# Primeira vez
vercel link
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Deploy
vercel deploy --prod
```

Cache-control e security headers já estão em `vercel.json`.

---

## 6. CI

`.github/workflows/ci.yml` roda em cada PR: `npm ci` + `npm run build` (que
inclui `tsc -b`). Configurar **branch protection** em `main` exigindo o CI
verde antes de merge.

---

## 7. Próximos passos não cobertos (PRD §8 — fora de escopo v1.0)

- App mobile nativo
- Assinatura digital de documentos
- Chatbot de atendimento
- Integração com CRMs terceiros
- Onboarding de clientes

Ficam para v2.0.

---

## Checklist pré-launch

- [ ] Chaves do Supabase rotacionadas, `.env.local` removido do histórico
- [ ] `supabase/setup.sql` aplicado (inclui tabela `corbans`)
- [ ] Backend `server/` rodando (VPS / Railway / Fly) com `pm2` ou systemd
- [ ] Pasta `auth_baileys/` persistente (volume/disk)
- [ ] WhatsApp oficial pareado (QR escaneado uma vez)
- [ ] SMTP configurado e `/verify/email` retornando `{ ok: true }`
- [ ] Tabela `public.corbans` populada (ao menos os Corbans em produção)
- [ ] `pg_cron` retenção mensal agendada
- [ ] Pelo menos 1 usuário interno criado via Supabase Auth
- [ ] 1º XLSX real carregado com sucesso
- [ ] Teste e2e: contrato em pendência → `POST /dispatch` → mensagem chega
      no celular/e-mail → INSERT em `notification_log` → visível no
      dashboard interno
- [ ] Teste da régua: `POST /ruler/run` com contrato forçado a D+3
- [ ] Opt-out testado (insert em `client_opt_outs` → próximo disparo falha)
- [ ] CI verde em `main`
- [ ] Deploy do front (Vercel) + domínio configurado
- [ ] Central de atendimento da Starbank treinada para redirecionar
      cliente ao Corban (PRD §13.3 risco alto)
