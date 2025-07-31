// feedService.js
import axios from 'axios';
import xml2js from 'xml2js';
import config from './config.js';

// Normaliza textos (remove acentos, pontuação, etc.)
function normalize(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/gi, "")
    .toLowerCase();
}

// --- CACHE XML FEED ---
let cachedFeed = null;
let cacheTimestamp = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutos

async function obterFeedXML() {
  const agora = Date.now();
  if (cachedFeed && agora - cacheTimestamp < CACHE_DURATION_MS) {
    return cachedFeed;
  }

  try {
    const { data } = await axios.get(config.feedXmlUrl);
    const result = await xml2js.parseStringPromise(data, { explicitArray: false });
    const produtos = result.rss?.channel?.item || [];
    cachedFeed = produtos;
    cacheTimestamp = agora;
    return produtos;
  } catch (err) {
    console.error('[FEED XML ERROR]', err);
    return [];
  }
}

export async function buscarProdutoNoFeed(mensagem) {
  if (!config.feedXmlUrl) return null;

  const produtos = await obterFeedXML();
  if (!produtos.length) return null;

  const msgLimpa = normalize(mensagem);

  const encontrados = produtos.filter(produto => {
    const titulo = normalize(produto['g:title'] || '');
    const descricao = normalize(produto['g:description'] || '');
    return titulo.includes(msgLimpa) || descricao.includes(msgLimpa);
  });

  if (encontrados.length === 0) return null;

  const resposta = encontrados.slice(0, 3).map(produto => (
    `📦 *${produto['g:title']}*\n💬 ${produto['g:description']?.slice(0, 150)}...\n🔗 ${produto['g:link']}`
  )).join('\n\n');

  return `Encontrei alguns produtos pra você:\n\n${resposta}`;
}

