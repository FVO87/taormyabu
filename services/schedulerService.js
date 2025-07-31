// services/schedulerService.js
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';

export function startCleanupJob() {
  // Roda a cada hora para limpar o QR code, se existir
  cron.schedule('0 */1 * * *', () => {
    const qrImagePath = path.join('public', 'qr.png');
    if (fs.existsSync(qrImagePath)) {
      fs.unlink(qrImagePath, (err) => {
        if (err) {
          console.error('[SCHEDULER] Erro ao limpar o arquivo qr.png:', err);
        } else {
          console.log('[SCHEDULER] Arquivo qr.png temporário foi limpo.');
        }
      });
    }
  });
}