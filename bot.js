// bot.js
import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import qrcode from 'qrcode';
import qrcodeTerminal from 'qrcode-terminal';
import fs from 'fs';
import path from 'path';
import { handleIncomingMessage } from "./messageHandler.js";

// --- NOVO: Variável para guardar o ID do nosso temporizador de presença ---
let presenceInterval;

export async function initializeBot(io) {
  const initMessage = 'Iniciando conexão com o WhatsApp...';
  io.emit('status_update', { status: 'initializing', message: initMessage });
  io.emit('new_log', { message: `[BOT] ${initMessage}` });
  console.log(`[BOT] ${initMessage}`);

  const { state, saveCreds } = await useMultiFileAuthState("auth");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    browser: ["Bot-Dashboard", "Chrome", "10.0"],
    printQRInTerminal: false
  });

  sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      const qrMessage = 'QR Code recebido, a gerar para o painel de controlo.';
      console.log(`[BOT] ${qrMessage}`);
      io.emit('new_log', { message: `[BOT] ${qrMessage}` });
      qrcodeTerminal.generate(qr, { small: true });

      const qrImagePath = path.join('public', 'qr.png');
      qrcode.toFile(qrImagePath, qr, (err) => {
        if (err) {
          console.error('[BOT] Erro ao guardar o QR code:', err);
          io.emit('new_log', { message: '[BOT] Erro ao guardar o QR code.' });
          io.emit('status_update', { status: 'error', message: 'Falha ao gerar o QR Code para o painel de controlo.' });
        } else {
          io.emit('qr_update', { imageUrl: '/qr.png?t=' + Date.now() });
          io.emit('status_update', { status: 'qr', message: 'Aguardando leitura do QR Code...' });
        }
      });
    }

    if (connection === "close") {
      // --- NOVO: Limpa o temporizador se a conexão cair para não causar erros ---
      if (presenceInterval) {
        clearInterval(presenceInterval);
      }

      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = reason !== DisconnectReason.loggedOut;
      const message = `Conexão encerrada: ${reason}. ${shouldReconnect ? "A reconectar..." : "Não foi possível reconectar (Logout)."}`;
      console.log(`[BOT] ${message}`);
      io.emit('new_log', { message: `[BOT] ${message}` });
      io.emit('status_update', { status: 'disconnected', message });
      if (shouldReconnect) {
        initializeBot(io);
      } else {
        const qrPath = path.join('public', 'qr.png');
        if (fs.existsSync(qrPath)) fs.unlinkSync(qrPath);
        io.emit('qr_clear');
      }
    } else if (connection === "open") {
      const successMessage = "✅ Bot conectado ao WhatsApp!";
      const botId = sock.user.id.split(':')[0];
      console.log(successMessage);
      io.emit('new_log', { message: successMessage });
      io.emit('status_update', { 
          status: 'connected', 
          message: 'Bot conectado com sucesso!',
          botId: botId
      });
      const qrPath = path.join('public', 'qr.png');
      if (fs.existsSync(qrPath)) fs.unlinkSync(qrPath);
      io.emit('qr_clear');

      // --- NOVO: Inicia o envio de presença 'online' a cada 25 segundos ---
      if (presenceInterval) clearInterval(presenceInterval); // Garante que não há múltiplos temporizadores
      
      presenceInterval = setInterval(() => {
        sock.sendPresenceUpdate('available'); // 'available' significa "Online"
      }, 25000); // 25 segundos é um intervalo seguro

      const presenceMessage = '[BOT] Presença "Online" ativada.';
      console.log(presenceMessage);
      io.emit('new_log', { message: presenceMessage });
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || (msg.key && msg.key.fromMe)) {
      return;
    }
    if (msg.key.remoteJid === 'status@broadcast') {
      return;
    }
    await handleIncomingMessage(sock, msg, io);
  });

  sock.ev.on("creds.update", saveCreds);
}
