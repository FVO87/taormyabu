import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import path from 'path';

// --- INÍCIO DA SEÇÃO DE AUTENTICAÇÃO E CONFIGURAÇÃO ---

const KEYFILEPATH = path.resolve('google-credentials.json');
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const CALENDAR_ID = 'flavioacsm@gmail.com'; 

const auth = new GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: SCOPES,
});

const calendar = google.calendar({ version: 'v3', auth });

// --- FIM DA SEÇÃO DE AUTENTICAÇÃO E CONFIGURAÇÃO ---


export async function checkAvailability(date, startHour, endHour) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const dateISO = `${year}-${month}-${day}`;

  const timeMin = new Date(`${dateISO}T00:00:00-03:00`).toISOString();
  const timeMax = new Date(`${dateISO}T23:59:59-03:00`).toISOString();

  try {
    const response = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: timeMin,
      timeMax: timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const busyEvents = response.data.items;

    // --- INÍCIO DO BLOCO DE DIAGNÓSTICO ---
    console.log('\n=====================================================');
    console.log('--- DIAGNÓSTICO: DADOS RECEBIDOS DO GOOGLE ---');
    if (busyEvents && busyEvents.length > 0) {
      console.log(`[INFO] Encontrados ${busyEvents.length} eventos para o dia ${dateISO}.`);
      busyEvents.forEach((event, index) => {
        console.log(`\n  --> Evento ${index + 1}:`);
        console.log(`      Título: ${event.summary}`);
        console.log(`      Início: ${event.start.dateTime}`);
        console.log(`      Fim:    ${event.end.dateTime}`);
        console.log(`      Status: ${event.status}`);
      });
    } else {
      console.log(`[INFO] Nenhum evento encontrado na agenda para o dia ${dateISO}.`);
    }
    console.log('=====================================================\n');
    // --- FIM DO BLOCO DE DIAGNÓSTICO ---

    const availableSlots = [];

    for (let hour = parseInt(startHour); hour < parseInt(endHour); hour++) {
      const slotStart = new Date(`${dateISO}T${hour.toString().padStart(2, '0')}:00:00-03:00`);
      const slotEnd = new Date(`${dateISO}T${(hour + 1).toString().padStart(2, '0')}:00:00-03:00`);

      const isOverlapping = busyEvents.some(event => {
        if (event.status === 'cancelled') {
          return false;
        }
        const eventStart = new Date(event.start.dateTime || event.start.date);
        const eventEnd = new Date(event.end.dateTime || event.end.date);
        return eventStart < slotEnd && eventEnd > slotStart;
      });

      if (!isOverlapping) {
        availableSlots.push(`${hour}h`);
      }
    }

    return availableSlots;
  } catch (err) {
    console.error('[ERRO EM checkAvailability]', err.message);
    throw err;
  }
}

// O resto do arquivo permanece o mesmo
export async function createEvent({ title, description, startISO, endISO, email }) {
  const event = {
    summary: title,
    description: description,
    start: { dateTime: startISO, timeZone: 'America/Sao_Paulo' },
    end: { dateTime: endISO, timeZone: 'America/Sao_Paulo' },
    attendees: email ? [{ email }] : [],
  };
  const res = await calendar.events.insert({ calendarId: CALENDAR_ID, requestBody: event });
  return res.data;
}

export async function cancelEventByDatetime(targetDateTimeISO) {
  const list = await calendar.events.list({
    calendarId: CALENDAR_ID,
    timeMin: new Date(new Date(targetDateTimeISO).getTime() - 15 * 60000).toISOString(),
    timeMax: new Date(new Date(targetDateTimeISO).getTime() + 15 * 60000).toISOString(),
    maxResults: 5,
    singleEvents: true,
    orderBy: 'startTime',
  });
  const event = list.data.items.find(e => e.start?.dateTime?.startsWith(targetDateTimeISO.slice(0, 16)));
  if (!event) {
    return { success: false, message: 'Nenhum evento encontrado nesse horário.' };
  }
  await calendar.events.delete({ calendarId: CALENDAR_ID, eventId: event.id });
  return { success: true, message: 'Agendamento cancelado com sucesso.' };
}
