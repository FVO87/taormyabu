import fs from 'fs';
import path from 'path';
import config from './config.js';
import { getAssistantResponse, transcribeAudio } from './openaiService.js';
import { buscarProdutoNoFeed } from './feedService.js';
import { buscarNaPlanilha } from './sheetsService.js';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { checkAvailability, createEvent, cancelEventByDatetime } from './services/calendarService.js';
import { bloquearUsuario, liberarUsuario, isBloqueado } from './userState.js';
// Importa o serviço de analytics
import { sendGa4Event } from './services/analyticsService.js';

const conversationContext = {};
const messageBuffers = {};
const delayTimers = {};

// A função agora aceita 'io' e 'messageCounter' para integração com o painel
export async function handleIncomingMessage(sock, msg, io, messageCounter) {
  try {
    const senderId = msg.key.remoteJid;
    const senderName = msg.pushName || senderId.split('@')[0];
    const messageContent = msg.message;
    if (!senderId || !messageContent) return;

    // Log para o painel de controlo
    io.emit('new_log', { message: `Mensagem recebida de ${senderName}`, count: messageCounter });
 
    const clientAudioDir = path.resolve('clientes', process.env.CLIENT_ID, 'audios');
    if (!fs.existsSync(clientAudioDir)) fs.mkdirSync(clientAudioDir, { recursive: true });

    let messageText = messageContent.conversation || messageContent?.extendedTextMessage?.text || '';

    if (messageContent.audioMessage) {
      const stream = await downloadMediaMessage(msg, 'buffer');
      const filename = path.resolve(clientAudioDir, `audio-${Date.now()}.ogg`);
      fs.writeFileSync(filename, stream);
      const transcript = await transcribeAudio(filename);
      if (transcript) {
        console.log(`[AUDIO] Transcrição: ${transcript}`);
        io.emit('new_log', { message: `Áudio de ${senderName} transcrito: "${transcript}"`, count: messageCounter });
        messageText = transcript;
      }
    }

    if (!messageText) return;

    // Lógica de comandos para o agente humano
    if (senderId === config.agentJid) {
      const [command, ...args] = messageText.trim().split(' ');
      const targetNumber = args[0];

      if (command.toLowerCase() === '/pare' && targetNumber) {
        const targetJid = `${targetNumber}@s.whatsapp.net`;
        bloquearUsuario(targetJid);
        io.emit('new_log', { message: `[AGENTE] Bot pausado para ${targetNumber}`, count: messageCounter });
        await sock.sendMessage(senderId, { text: `✅ Bot pausado para o utilizador ${targetNumber}.` });
        return;
      }

      if (command.toLowerCase() === '/voltar' && targetNumber) {
        const targetJid = `${targetNumber}@s.whatsapp.net`;
        liberarUsuario(targetJid);
        io.emit('new_log', { message: `[AGENTE] Bot reativado para ${targetNumber}`, count: messageCounter });
        await sock.sendMessage(senderId, { text: `✅ Bot reativado para o utilizador ${targetNumber}.` });
        return;
      }
    }

    const termo = messageText.trim().toLowerCase();

    if (isBloqueado(senderId)) {
      io.emit('new_log', { message: `Mensagem ignorada de ${senderName} (atendimento humano)`, count: messageCounter });
      return;
    }

    const expressaoAtendimento = ['atendente', 'ver disponibilidade particular'];
    const requerIntervencaoHumana = expressaoAtendimento.some(padrao => termo.includes(padrao.toLowerCase()));

    if (requerIntervencaoHumana) {
      bloquearUsuario(senderId);
      await sock.sendMessage(senderId, { text: '🔔 Um atendente será acionado para continuar com você. Por favor, aguarde.' });
      io.emit('new_log', { message: `Utilizador ${senderName} solicitou atendimento humano.`, count: messageCounter });
      return;
    }

    // --- LÓGICA DE AGENDAMENTO ---
    const horariosMatch = termo.match(/hor[aá]rios|dispon[ií]vel/i);
    if (horariosMatch) {
      // O seu código de agendamento existente permanece aqui
      return;
    }
    const agendarMatch = termo.match(/(?:agendar|marcar) .*?(\d{1,2})h/i);
    if (agendarMatch) {
      // O seu código de agendamento existente permanece aqui
      return;
    }
    if (/cancelar|desmarcar/i.test(termo)) {
      // O seu código de agendamento existente permanece aqui
      return;
    }


    if (!messageBuffers[senderId]) messageBuffers[senderId] = [];
    messageBuffers[senderId].push(messageText.trim());

    if (delayTimers[senderId]) clearTimeout(delayTimers[senderId]);
    delayTimers[senderId] = setTimeout(async () => {
      if (!messageBuffers[senderId] || messageBuffers[senderId].length === 0) return;
      const combinedMessage = messageBuffers[senderId].join(' ');
      delete messageBuffers[senderId];

      try {
        io.emit('new_log', { message: `A enviar "${combinedMessage}" para a IA (de ${senderName})`, count: messageCounter });
        
        await sock.sendPresenceUpdate('composing', senderId);
        const response = await getAssistantResponse(senderId, combinedMessage);
//	      console.log('[DEBUG] Resposta BRUTA da IA:', response);
        await new Promise(resolve => setTimeout(resolve, config.botResponseDelaySeconds * 1000));
        await sock.sendPresenceUpdate('paused', senderId);

        let finalResponse = response;

        if (response.startsWith('[NAME_CAPTURED]')) {
            const logMsg = `[CONVERSÃO] Nome capturado para ${senderName}`;
            console.log(logMsg);
            io.emit('new_log', { message: logMsg, count: messageCounter });

            const cleanedResponse = response.replace('[NAME_CAPTURED]', '').trim();

            let firstName = senderName.split(' ')[0];
            const firstNameMatch = cleanedResponse.match(/(?:Olá|Oi|Oii|Prazer|Chamo-me|Meu nome é)\s*([A-Za-zÀ-ú]+)/i);
            if (firstNameMatch && firstNameMatch[1]) {
                firstName = firstNameMatch[1].replace(/!|,|\./g, '');
            }
            
            console.log(`[DEBUG] Dados para GA4 -> JID: ${senderId}, Nome: ${firstName}`);

            // --- ALTERAÇÃO REALIZADA AQUI ---
            // O nome do evento foi alterado para 'lead_qualificado'
            await sendGa4Event(senderId, firstName, 'lead_qualificado', {
                client_id_from_env: process.env.CLIENT_ID
            });

            finalResponse = cleanedResponse;
        }

        await sock.sendMessage(senderId, { text: finalResponse });
        
        console.log(`[RESP] Enviado para ${senderId}`);
        io.emit('new_log', { message: `Resposta da IA enviada para ${senderName}`, count: messageCounter });

      } catch (error) {
        console.error('[Handler Error Interno]', error);
        io.emit('new_log', { message: `[ERRO] Falha ao obter resposta da IA.`, count: messageCounter });
      }
    }, config.botResponseDelaySeconds * 1000);

  } catch (err) {
    console.error('[Handler Error]', err);
    if (io) {
        io.emit('new_log', { message: `[ERRO] Ocorreu um erro geral no messageHandler.` });
    }
  }
}
