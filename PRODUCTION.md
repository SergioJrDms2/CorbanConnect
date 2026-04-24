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

## 3. Deploy das Edge Functions + pg_cron

Ver `supabase/functions/README.md`. Resumo:

```bash
supabase login
supabase link --project-ref <REF>

supabase secrets set \
  WHATSAPP_PROVIDER=twilio \
  TWILIO_ACCOUNT_SID=... \
  TWILIO_AUTH_TOKEN=... \
  TWILIO_WHATSAPP_FROM='whatsapp:+14155238886' \
  TWILIO_SMS_FROM='+14155238886' \
  RESEND_API_KEY=... \
  CORBAN_CONNECT_BASE_URL=https://app.corbanconnect.com.br

supabase functions deploy dispatch-notification
supabase functions deploy run-ruler
```

No SQL Editor, ativar o cron horário da régua + retenção mensal:

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

alter database postgres set app.supabase_url     = 'https://<REF>.supabase.co';
alter database postgres set app.service_role_key = '<SERVICE_ROLE>';

select cron.schedule(
  'corban-connect-ruler-hourly',
  '0 * * * *',
  $$ select net.http_post(
       url := current_setting('app.supabase_url') || '/functions/v1/run-ruler',
       headers := jsonb_build_object(
         'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
         'Content-Type', 'application/json'
       ),
       body := '{}'::jsonb
     ) $$
);

select cron.schedule(
  'corban-connect-retention-monthly',
  '0 3 1 * *',
  $$ delete from public.notification_log where sent_at < now() - interval '5 years'; $$
);
```

---

## 4. WhatsApp Business — aprovação de template (2 semanas)

A Meta precisa aprovar cada template antes de você poder disparar pelo
WhatsApp Business. Os textos base estão em
`supabase/functions/dispatch-notification/templates.ts`. Submeta:
1. Template D+0 (notificação inicial)
2. Template D+3 (1º lembrete)
3. Template D+7 (2º lembrete)
4. Template D+15 (alerta final)

Enquanto a aprovação não sai, SMS e e-mail funcionam via `dispatch-notification`
como fallback.

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
- [ ] `supabase/setup.sql` aplicado
- [ ] Edge Functions `dispatch-notification` + `run-ruler` deployadas
- [ ] Secrets das functions configurados (Twilio/Resend/...)
- [ ] `pg_cron` agendando régua horária + retenção mensal
- [ ] Templates WhatsApp submetidos à Meta
- [ ] Pelo menos 1 usuário interno criado via Supabase Auth
- [ ] 1º XLSX real carregado com sucesso
- [ ] Teste e2e: contrato em pendência → notificação chega no celular/e-mail
  de teste → INSERT em `notification_log` → visível no dashboard interno
- [ ] Opt-out testado (link no rodapé → para próximos disparos)
- [ ] CI verde em `main`
- [ ] Deploy Vercel + domínio configurado
- [ ] Central de atendimento da Starbank treinada para redirecionar
  cliente ao Corban (PRD §13.3 risco alto)
