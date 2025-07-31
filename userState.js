// userState.js
import fs from 'fs';
import path from 'path';

const BLOQUEIOS_PATH = path.resolve('data/bloqueios.json');

// Função auxiliar para ler o estado do arquivo de bloqueios
function lerBloqueios() {
  try {
    if (fs.existsSync(BLOQUEIOS_PATH)) {
      const raw = fs.readFileSync(BLOQUEIOS_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('[ERRO] Falha ao ler o arquivo bloqueios.json:', err);
  }
  return {};
}

// Função auxiliar para salvar o estado no arquivo de bloqueios
function salvarBloqueios(bloqueios) {
  try {
    fs.mkdirSync(path.dirname(BLOQUEIOS_PATH), { recursive: true });
    fs.writeFileSync(BLOQUEIOS_PATH, JSON.stringify(bloqueios, null, 2));
  } catch (err) {
    console.error('[ERRO] Falha ao salvar o arquivo bloqueios.json:', err);
  }
}

export function bloquearUsuario(senderId) {
  const bloqueios = lerBloqueios();
  bloqueios[senderId] = true;
  salvarBloqueios(bloqueios);
  console.log(`[BLOQUEADO] Usuário ${senderId} movido para atendimento humano.`);
}

export function liberarUsuario(senderId) {
  const bloqueios = lerBloqueios();
  if (bloqueios[senderId]) {
    delete bloqueios[senderId];
    salvarBloqueios(bloqueios);
    console.log(`[LIBERADO] Usuário ${senderId} voltou para fluxo automatizado.`);
  } else {
    console.log(`[INFO] Usuário ${senderId} já estava liberado.`);
  }
}

export function isBloqueado(senderId) {
  const bloqueios = lerBloqueios();
  return bloqueios[senderId] === true;
}

