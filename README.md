# WhatsApp Baileys Bot + OpenAI Assistants + Redis

Este é um chatbot completo para WhatsApp que utiliza a biblioteca [Baileys](https://github.com/WhiskeySockets/Baileys) para comunicação com o WhatsApp, a [API de Assistants da OpenAI](https://platform.openai.com/docs/assistants/overview) para inteligência artificial e o Redis para persistência do contexto da conversa.

---

## 📁 Estrutura do Projeto

```
whatsapp-baileys-bot/
├── .env
├── package.json
├── index.js
├── config.js
├── openaiService.js
└── messageHandler.js
```

---

## ⚙️ 1. Instalar e Configurar o Redis

**No Ubuntu:**
```bash
sudo apt update && sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

(Opcional) Verifique se está rodando:
```bash
sudo systemctl status redis-server
```

---

## 🚀 2. Configuração Inicial do Projeto

```bash
git clone <repo-ou-extraia-o-zip>
cd whatsapp-baileys-bot
npm install
```

### Preencha o arquivo `.env` com suas credenciais:

```
OPENAI_API_KEY="sua_chave_de_api_openai_aqui"
OPENAI_ASSISTANT_ID="seu_assistant_id_aqui"
REDIS_URL="redis://localhost:6379"
CONVERSATION_TTL_SECONDS="3600"
BOT_RESPONSE_DELAY_SECONDS="3"
AI_AGENT_PROMPT="Você é um assistente de IA prestativo e amigável. Responda de forma concisa e útil."
```

---

## 🧠 3. Configurar o Assistant na OpenAI

1. Acesse: [https://platform.openai.com/assistants](https://platform.openai.com/assistants)
2. Crie um novo Assistant.
3. No campo **Instructions**, cole o conteúdo da variável `AI_AGENT_PROMPT` do `.env`.
4. Copie o **Assistant ID** e cole na variável `OPENAI_ASSISTANT_ID`.

---

## 🤖 4. Executar o Bot

```bash
node index.js
```

Na primeira execução, será exibido um QR Code no terminal. Escaneie com seu WhatsApp:

> WhatsApp > Aparelhos Conectados > Conectar um Aparelho

---

## 📝 Considerações Importantes

### ✅ Persistência de Contexto com Redis

- Cada número de WhatsApp é mapeado a um `thread_id` da OpenAI.
- Os contextos são armazenados no Redis com tempo de expiração (`CONVERSATION_TTL_SECONDS`).

### 💡 AI_AGENT_PROMPT

- Esta variável **não é usada no código diretamente**.
- Ela deve ser **copiada manualmente** para o campo *Instructions* do Assistant na OpenAI.

### ⏱️ Delay de Resposta

- O bot espera `BOT_RESPONSE_DELAY_SECONDS` antes de enviar a resposta.
- Isso ajuda a evitar respostas prematuras a mensagens fragmentadas.

### ✍️ Sinal de "Digitando..."

- O bot envia o sinal de `"composing"` para o WhatsApp durante o processamento.

### ❗ Segurança do Redis

- Para ambientes de produção, proteja o Redis com:
  - Autenticação (`requirepass`).
  - Restringir acesso via firewall (`ufw allow from`).
  - Uso de Redis em Docker ou ambiente isolado.

### ⚠️ Uso da API do WhatsApp

- Baileys é uma biblioteca **não oficial**.
- Seu número pode ser banido pelo WhatsApp.
- Use com moderação e em conformidade com os termos da plataforma.

---

## 🧪 Testado com:

- Node.js 20.x
- Redis Server 7.x
- OpenAI Assistants API (2024+)
- Baileys v6.6.0

---

## 📄 Licença

Este projeto é fornecido como exemplo educacional, sem garantias. Use por sua conta e risco.
