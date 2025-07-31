#!/bin/bash
set -e

echo "🔧 Atualizando pacotes do sistema..."
sudo apt update
sudo apt install -y ffmpeg
sudo apt install -y curl git redis-server docker.io docker-compose

echo "🚀 Iniciando Redis..."
sudo systemctl start redis-server
sudo systemctl enable redis-server

echo "⬇️ Instalando NVM (Node Version Manager)..."
export NVM_DIR="$HOME/.nvm"
if [ ! -d "$NVM_DIR" ]; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
fi

export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"

echo "⬇️ Instalando Node.js 20 via NVM..."
nvm install 20
nvm use 20
nvm alias default 20

echo "📁 Instalando dependências do projeto..."
npm install

echo "🚀 Permissões do Docker..."
sudo usermod -aG docker $USER

echo "✅ Instalação concluída."
echo "Reinicie o terminal e execute:"
echo ""
echo "    node index.js"
echo ""
echo "Ou via Docker Compose:"
echo "    docker-compose up --build"
