import fs from 'fs';
import path from 'path';
import { liberarUsuario } from './userState.js';

const numero = process.argv[2];
if (!numero) {
  console.log("❌ Use: node debug-liberar.js <numero_completo>");
  process.exit(1);
}

const jid = `${numero}@s.whatsapp.net`;
const BLOQUEIOS_PATH = path.resolve('data/bloqueios.json');

// Mostrar antes
console.log('\n📄 Conteúdo antes da liberação:');
if (fs.existsSync(BLOQUEIOS_PATH)) {
  const before = fs.readFileSync(BLOQUEIOS_PATH, 'utf-8');
  console.log(before);
} else {
  console.log('Arquivo ainda não existe.');
}

// Executar liberação
console.log('\n✅ Executando liberarUsuario...');
liberarUsuario(jid);

// Mostrar depois
console.log('\n📄 Conteúdo depois da liberação:');
if (fs.existsSync(BLOQUEIOS_PATH)) {
  const after = fs.readFileSync(BLOQUEIOS_PATH, 'utf-8');
  console.log(after);
} else {
  console.log('Arquivo não foi criado.');
}

