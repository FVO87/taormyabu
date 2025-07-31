// openaiService.js
import OpenAI from 'openai';
import fs from 'fs';
import config from './config.js';
import { getThreadId, saveThreadId, deleteThreadId } from './persistence/sqlite.js';

const openai = new OpenAI({ apiKey: config.openaiApiKey });

export async function getAssistantResponse(senderId, messageText) {
  try {
    if (!config.openaiAssistantId) {
      return '⚠️ Assistant ID não configurado corretamente.';
    }

    let threadId = await getThreadId(senderId);

    // Lógica para verificar e corrigir um thread ID inválido
    if (threadId) {
      try {
        await openai.beta.threads.retrieve(threadId);
        console.log(`[ASSISTANT] Thread ${threadId} válida encontrada para ${senderId}.`);
      } catch (e) {
        if (e.status === 404) {
          console.warn(`[ASSISTANT] Thread ${threadId} não foi encontrada na OpenAI. A criar uma nova.`);
          await deleteThreadId(senderId);
          threadId = null;
        } else {
          throw e;
        }
      }
    }

    // Cria um novo thread se não existir ou se for inválido
    if (!threadId) {
      const thread = await openai.beta.threads.create();
      threadId = thread.id;
      await saveThreadId(senderId, threadId);
      console.log(`[ASSISTANT] Novo thread ${threadId} criado e guardado para ${senderId}.`);
    }

    // Lógica para aguardar por um "Run" que já esteja ativo
    const activeRuns = await openai.beta.threads.runs.list(threadId, { limit: 1 });
    if (activeRuns.data.length > 0 && ['in_progress', 'queued'].includes(activeRuns.data[0].status)) {
        const activeRun = activeRuns.data[0];
        console.log(`[ASSISTANT] A aguardar pela conclusão do Run ${activeRun.id} antes de continuar...`);
        let runStatusCheck;
        do {
            await new Promise(res => setTimeout(res, 500));
            runStatusCheck = await openai.beta.threads.runs.retrieve(threadId, activeRun.id);
        } while (runStatusCheck.status === 'in_progress' || runStatusCheck.status === 'queued');
        console.log(`[ASSISTANT] Run ${activeRun.id} concluído com o estado: ${runStatusCheck.status}`);
    }

    // Adiciona a nova mensagem do utilizador ao thread
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: messageText
    });

    // Cria e executa um novo "Run"
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: config.openaiAssistantId
    });

    // Espera pela conclusão do novo "Run"
    let runStatus;
    do {
      await new Promise(res => setTimeout(res, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    } while (runStatus.status === 'running' || runStatus.status === 'in_progress' || runStatus.status === 'queued');

    if (runStatus.status === 'completed') {
      const messages = await openai.beta.threads.messages.list(threadId);
      const assistantMessages = messages.data.filter(msg => msg.role === 'assistant');
      
      const rawResponse = assistantMessages[0]?.content[0]?.text?.value || '[⚠️] Sem resposta.';
      
      const cleanedResponse = rawResponse.replace(/【.*?】/g, '').trim();
      
      return cleanedResponse;
    } else {
      console.error(`[ASSISTANT] A execução falhou com o estado: ${runStatus.status}`);
      return '[⚠️] A execução falhou. Tente novamente.';
    }
  } catch (err) {
    console.error('[ASSISTANT ERROR]', err);
    
    // Tratamento de erros melhorado para dar feedback ao utilizador
    if (err.status === 400) {
        // --- MENSAGEM ALTERADA CONFORME SOLICITADO ---
        return "Só um segundo que já te respondo! 👍";
    }
    if (err.status === 404) {
        return 'Ocorreu um problema ao recuperar o histórico da sua conversa. Por favor, envie a sua mensagem novamente para começarmos um novo.'
    }
    return 'Desculpe, ocorreu um erro inesperado. Tente novamente.';
  }
}

export async function transcribeAudio(filePath) {
  try {
    const audioStream = fs.createReadStream(filePath);
    const transcription = await openai.audio.transcriptions.create({
      file: audioStream,
      model: 'whisper-1'
    });
    return transcription.text;
  } catch (err) {
    console.error('[TRANSCRIPTION ERROR]', err);
    return null;
  }
}
