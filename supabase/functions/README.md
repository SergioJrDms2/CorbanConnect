# Edge Functions

## Deploy

```bash
supabase login
supabase link --project-ref <YOUR_PROJECT_REF>

# Secrets (uma vez)
supabase secrets set \
  WHATSAPP_PROVIDER=twilio \
  TWILIO_ACCOUNT_SID=... \
  TWILIO_AUTH_TOKEN=... \
  TWILIO_WHATSAPP_FROM='whatsapp:+14155238886' \
  TWILIO_SMS_FROM='+14155238886' \
  RESEND_API_KEY=... \
  EMAIL_FROM='nao-responder@starbank.com.br' \
  CORBAN_CONNECT_BASE_URL=https://app.corbanconnect.com.br

# Deploy das functions
supabase functions deploy dispatch-notification
supabase functions deploy run-ruler
```

## Agendar a régua (pg_cron)

Execute no **SQL Editor** (requer a extensão `pg_cron` + `pg_net` ativadas,
ambas disponíveis por padrão no Supabase):

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Roda de hora em hora
select
  cron.schedule(
    'corban-connect-ruler-hourly',
    '0 * * * *',
    $$
      select net.http_post(
        url := current_setting('app.supabase_url', true) || '/functions/v1/run-ruler',
        headers := jsonb_build_object(
          'Authorization', 'Bearer ' || current_setting('app.service_role_key', true),
          'Content-Type', 'application/json'
        ),
        body := '{}'::jsonb
      ) as request_id;
    $$
  );
```

`app.supabase_url` e `app.service_role_key` são GUCs que você configura uma vez:

```sql
alter database postgres set app.supabase_url       = 'https://<PROJECT_REF>.supabase.co';
alter database postgres set app.service_role_key   = '<YOUR_SERVICE_ROLE_KEY>';
```

Para listar / pausar:

```sql
select * from cron.job;
-- select cron.unschedule('corban-connect-ruler-hourly');
```

## Retenção de 5 anos (LGPD)

```sql
select
  cron.schedule(
    'corban-connect-retention-monthly',
    '0 3 1 * *',
    $$ delete from public.notification_log where sent_at < now() - interval '5 years'; $$
  );
```

## Teste manual

```bash
# Dispara pra um contrato específico
curl -X POST "https://<PROJECT_REF>.supabase.co/functions/v1/dispatch-notification" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contract_id":"CTR-2026-00412","channel":"whatsapp","reg":"D+0"}'

# Força uma rodada da régua
curl -X POST "https://<PROJECT_REF>.supabase.co/functions/v1/run-ruler" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```
