import { getClientConfig } from './getClientConfig.js';

const clientId = process.env.CLIENT_ID;
if (!clientId) {
  throw new Error("CLIENT_ID não definido no ambiente.");
}

const config = getClientConfig(clientId);
if (!config || !config.openaiApiKey || !config.openaiAssistantId) {
  console.error("⚠ Assistant ID não configurado corretamente.");
}

// --- ADIÇÃO ---
// Adicione o número de telefone do agente humano que controlará o bot.
// IMPORTANTE: Substitua 'SEU_NUMERO' pelo número real no formato JID.
// Exemplo: '5511999999999@s.whatsapp.net'
config.agentJid = '5513981772372@s.whatsapp.net';
// --- FIM DA ADIÇÃO ---

export default config;
