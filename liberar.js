import { liberarUsuario } from './userState.js';

const numero = process.argv[2];

if (!numero) {
  console.log("❌ Use: node liberar.js <numero_completo>");
  process.exit(1);
}

const jid = `${numero}@s.whatsapp.net`;
liberarUsuario(jid);

