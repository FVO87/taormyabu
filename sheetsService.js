import axios from 'axios';
import config from './config.js';

export async function buscarNaPlanilha(sheetUrl, aba, intervalo, textoConsulta = '') {
  console.log('[DEBUG][SHEETS] Fetching URL:', sheetUrl);
  const response = await axios.get(sheetUrl);
  console.log('[DEBUG][SHEETS] Response data:', response.data);

  const linhas = Array.isArray(response.data) ? response.data : [];
  console.log('[DEBUG][SHEETS] Linhas carregadas:', linhas.length);

  // filtro
  const termo = textoConsulta.toLowerCase();
  const encontrados = [];

	for (const linha of linhas) {
		  const linhaNormalizada = {};
		  for (const chave in linha) {
			      linhaNormalizada[chave.toLowerCase()] = linha[chave];
			    }

		  const valores = Object.values(linhaNormalizada).map(v => String(v).toLowerCase());
		  if (valores.some(val => val.includes(termo))) {
			      encontrados.push(linhaNormalizada);
			    }
	}
 console.log('[DEBUG][SHEETS] Encontrados:', encontrados);
  return encontrados;
}

