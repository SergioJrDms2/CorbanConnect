/**
 * Corban Connect · Backend
 * ────────────────────────
 * Um único processo Node.js que:
 *  - mantém uma conexão WhatsApp Web (Baileys)
 *  - expõe API HTTP para envio manual e disparo
 *  - roda a régua D+0/D+3/D+7/D+15 automaticamente (node-cron)
 *  - grava tudo em notification_log no Supabase
 */

import { config } from './config.js';
import { createApp } from './http.js';
import { startWhatsApp } from './whatsapp.js';
import { startRuler } from './ruler.js';
import { verifyEmailConfig } from './email.js';
import { enrichCorbanCnpjs } from './enrichCorbans.js';

async function main() {
  console.log('🚀 Corban Connect backend iniciando...');
  console.log('   Supabase:', config.supabase.url);
  console.log('   Base URL:', config.platform.baseUrl);

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`🌐 HTTP ouvindo em http://localhost:${config.port}`);
    console.log('   GET  /health');
    console.log('   GET  /qr');
    console.log('   POST /send/whatsapp        (auth)');
    console.log('   POST /send/email           (auth)');
    console.log('   POST /dispatch             (auth)');
    console.log('   POST /ruler/run            (auth)');
  });

  // WhatsApp é assíncrono: o QR aparece no stdout.
  startWhatsApp().catch((err) => {
    console.error('💥 Falha ao iniciar WhatsApp:', err);
  });

  // SMTP é sanity-check: não bloqueia o boot, mas avisa cedo.
  verifyEmailConfig().then((r) => {
    if (r.ok) console.log('✉️  SMTP OK');
    else console.warn('⚠️  SMTP falhou:', r.error);
  });

  startRuler();

  enrichCorbanCnpjs()
    .then(({ enriched, skipped }) => {
      if (enriched > 0 || skipped > 0)
        console.log(`🔍 Enriquecimento CNPJ: ${enriched} atualizados, ${skipped} não encontrados`);
    })
    .catch((err) => console.warn('⚠️  Enriquecimento CNPJ falhou:', err.message));
}

process.on('SIGINT', () => {
  console.log('\n👋 Encerrando...');
  process.exit(0);
});

process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled rejection:', err);
});

main().catch((err) => {
  console.error('💥 Falha fatal:', err);
  process.exit(1);
});
