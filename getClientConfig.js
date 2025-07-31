import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

export function getClientConfig(clientId) {
  const clientEnvPath = path.resolve(`clientes/${clientId}/.env`);
  if (!fs.existsSync(clientEnvPath)) {
    console.error(`Arquivo .env do cliente não encontrado: ${clientEnvPath}`);
    return null;
  }

  const envConfig = dotenv.parse(fs.readFileSync(clientEnvPath));
  return {
    openaiApiKey: envConfig.OPENAI_API_KEY,
    openaiAssistantId: envConfig.OPENAI_ASSISTANT_ID,
    feedXmlUrl: envConfig.FEED_XML_URL,
    googleSheetId: envConfig.GOOGLE_SHEET_ID,
    calendarId: envConfig.CALENDAR_ID,
    botResponseDelaySeconds: parseInt(envConfig.BOT_RESPONSE_DELAY_SECONDS || '3'),
    aiAgentPrompt: envConfig.AI_AGENT_PROMPT
  };
}
