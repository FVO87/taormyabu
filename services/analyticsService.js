import axios from 'axios';
import crypto from 'crypto';

const MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID;
const API_SECRET = process.env.GA4_API_SECRET;
// Mantemos o URL no modo de depuração para este teste final
const GA4_URL = `https://www.google-analytics.com/mp/collect?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`;

function normalizeAndHash(data) {
    if (!data) return null;
    const normalized = data.trim().toLowerCase();
    return crypto.createHash('sha256').update(normalized).digest('hex');
}

function formatPhoneToE164(jid) {
    if (!jid) return null;
    const number = jid.split('@')[0];
    return `+${number}`;
}

export async function sendGa4Event(jid, firstName, eventName, eventParams = {}) {
    console.log(`[GA4 DEBUG] A tentar enviar o evento '${eventName}'...`);
    
    if (!MEASUREMENT_ID || !API_SECRET || !jid) {
        console.error('[GA4 DEBUG] ERRO FATAL: MEASUREMENT_ID ou API_SECRET não estão configurados no ficheiro .env!');
        return;
    }

    const hashedUserId = normalizeAndHash(formatPhoneToE164(jid));
    const clientId = hashedUserId.substring(0, 32);

    const payload = {
        client_id: clientId,
        user_id: hashedUserId,
        events: [{
            name: eventName,
            params: { ...eventParams, session_id: '12345', engagement_time_msec: '100' },
        }],
    };
    
    if (jid && firstName) {
        // --- CORREÇÃO AQUI: Nomes dos campos atualizados ---
        payload.user_data = {
            sha256_phone_number: hashedUserId, // Removido "_hashed_"
            address: {
                sha256_first_name: normalizeAndHash(firstName) // Removido "_hashed_"
            }
        };
    }

    console.log("[GA4 DEBUG] Payload a ser enviado:", JSON.stringify(payload, null, 2));

    try {
        const response = await axios.post(GA4_URL, payload);
        console.log(`[GA4 DEBUG] Servidor de validação respondeu com SUCESSO. Status: ${response.status}`);
        console.log("[GA4 DEBUG] Resposta do servidor de validação:", JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('[GA4 DEBUG] Erro na chamada de validação. Status:', error.response?.status);
        console.error('[GA4 DEBUG] Resposta de validação (dentro do erro):', JSON.stringify(error.response?.data, null, 2));
    }
}
