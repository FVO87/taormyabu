import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function perguntar(pergunta) {
  return new Promise(resolve => rl.question(pergunta, resolve));
}

(async () => {
  const clientId = (await perguntar('🆔 CLIENT_ID (ex: totalclin): ')).trim();
  const openaiKey = (await perguntar('🔑 OPENAI_API_KEY: ')).trim();
  const assistantId = (await perguntar('🤖 OPENAI_ASSISTANT_ID: ')).trim();
  const sheetId = (await perguntar('📊 GOOGLE_SHEET_ID (opcional): ')).trim();
  const credPath = `clientes/${clientId}/credentials.json`;
  const feedUrl = (await perguntar('🛒 FEED XML URL (opcional): ')).trim();

  const clientePath = path.resolve('clientes', clientId);
  const pastas = ['audios', 'logs', 'data'];

  if (fs.existsSync(clientePath)) {
    console.error(`❌ O cliente "${clientId}" já existe.`);
    process.exit(1);
  }

  fs.mkdirSync(clientePath, { recursive: true });
  pastas.forEach(pasta => fs.mkdirSync(path.join(clientePath, pasta)));

  // .env
  const envPath = path.join(clientePath, '.env');
  const envContent = `CLIENT_ID=${clientId}
OPENAI_API_KEY=${openaiKey}
OPENAI_ASSISTANT_ID=${assistantId}
GOOGLE_SHEET_ID=${sheetId}
GOOGLE_SHEET_CRED_PATH=${credPath}
FEED_XML_URL=${feedUrl}
BOT_RESPONSE_DELAY_SECONDS=2
`;

  fs.writeFileSync(envPath, envContent);
  fs.writeFileSync(path.join(clientePath, 'credentials.json'), '{}'); // arquivo de credencial vazio

  // banco sqlite vazio (se aplicável)
  const dbPath = path.join(clientePath, 'data', 'bot.db');
  fs.writeFileSync(dbPath, ''); // SQLite vazio, será iniciado pelo bot

  console.log(`\n✅ Cliente "${clientId}" criado com sucesso.`);
  console.log(`📁 Estrutura: clientes/${clientId}`);
  console.log(`🧪 Lembre-se de carregar as credenciais reais no arquivo: ${credPath}`);

  rl.close();
})();

