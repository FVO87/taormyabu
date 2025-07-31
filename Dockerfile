# Dockerfile para WhatsApp Baileys Bot com OpenAI e Redis
FROM node:20

# Instalar Redis
RUN apt-get update && apt-get install -y redis-server && rm -rf /var/lib/apt/lists/*

# Diretório do app
WORKDIR /app

# Copiar arquivos do projeto
COPY . .

# Instalar dependências do Node.js
RUN npm install

# Expor a porta padrão do Redis
EXPOSE 6379

# Comando de inicialização do Redis e do Bot
CMD redis-server --daemonize yes && node index.js
