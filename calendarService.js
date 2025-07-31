import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library'; // Importa a classe correta
import path from 'path';
import config from '../config.js';

// --- SEÇÃO DE AUTENTICAÇÃO CORRIGIDA ---

// 1. Caminho para seu arquivo de credenciais. Garanta que ele esteja na pasta raiz do projeto.
const KEYFILEPATH = path.resolve('google-credentials.json');

// 2. Escopos necessários para as operações do seu arquivo (ler e escrever na agenda).
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// 3. Instância de autenticação usando o método moderno e recomendado.
//    Ele lida com todo o fluxo de autorização automaticamente.
const auth = new GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: SCOPES,
});

// 4. Cria a instância do cliente do Calendar uma única vez, já autenticada.
//    Não há necessidade de chamar uma função getAuthClient() repetidamente.
const calendar = google.calendar({ version: 'v3', auth });

// --- FIM DA SEÇÃO DE AUTENTICAÇÃO ---


// Suas funções agora usam a instância 'calendar' já autenticada
// Nenhuma alteração é necessária dentro delas.

export async function checkAvailability(date, startHour, endHour) {
  const dateISO = date.toISOString().split('T')[0];
  const start = new Date(`${dateISO}T${startHour}:00:00-03:00`);
  const end = new Date(`${dateISO}T${endHour}:00:00-03:00`);

  try {
    const res = await calendar.freebusy.query({
      requestBody: {
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        timeZone: 'America/Sao_Paulo',
        items: [{ id: config.calendarId }]
      }
    });

    const busy = res.data.calendars[config.calendarId]?.busy || [];
    const availableSlots = [];

    for (let hour = parseInt(startHour); hour < parseInt(endHour); hour++) {
      const slotStart = new Date(`${dateISO}T${hour.toString().padStart(2, '0')}:00:00-03:00`);
      const slotEnd = new Date(`${dateISO}T${(hour + 1).toString().padStart(2, '0')}:00:00-03:00`);
      const overlapping = busy.some(b => {
        return (new Date(b.start) < slotEnd && new Date(b.end) > slotStart);
      });
      if (!overlapping) availableSlots.push(`${hour}h`);
    }

    return availableSlots;
  } catch(err) {
    console.error('[HANDLER ERROR] Falha ao verificar disponibilidade:', err.message);
    throw err;
  }
}

export async function createEvent({ title, description, startISO, endISO, email }) {
  const event = {
    summary: title,
    description: description,
    start: { dateTime: startISO, timeZone: 'America/Sao_Paulo' },
    end: { dateTime: endISO, timeZone: 'America/Sao_Paulo' },
    attendees: email ? [{ email }] : [],
  };

  const res = await calendar.events.insert({
    calendarId: config.calendarId,
    requestBody: event
  });

  return res.data;
}

export async function cancelEventByDatetime(targetDateTimeISO) {
  const list = await calendar.events.list({
    calendarId: config.calendarId,
    timeMin: new Date(new Date(targetDateTimeISO).getTime() - 15 * 60000).toISOString(),
    timeMax: new Date(new Date(targetDateTimeISO).getTime() + 15 * 60000).toISOString(),
    maxResults: 5,
    singleEvents: true,
    orderBy: 'startTime'
  });

  const event = list.data.items.find(e => e.start?.dateTime?.startsWith(targetDateTimeISO.slice(0, 16)));

  if (!event) {
    return { success: false, message: 'Nenhum evento encontrado nesse horário.' };
  }

  await calendar.events.delete({
    calendarId: config.calendarId,
    eventId: event.id
  });

  return { success: true, message: 'Agendamento cancelado com sucesso.' };
}
