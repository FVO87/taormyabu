#!/bin/bash

echo "==== Configuração de Novo Cliente ===="
read -p "Informe o número do cliente (CLIENT_ID - apenas números): " CLIENT_ID

CLIENT_DIR="clientes/$CLIENT_ID"

if [ -d "$CLIENT_DIR" ]; then
  echo "[INFO] Cliente já existe em $CLIENT_DIR"
else
  echo "[INFO] Criando estrutura para o cliente..."
  mkdir -p "$CLIENT_DIR/audios" "$CLIENT_DIR/videos" "$CLIENT_DIR/fotos" "$CLIENT_DIR/contratos" "$CLIENT_DIR/planilhas" "$CLIENT_DIR/feed"
  cp template.env "$CLIENT_DIR/.env"
  echo "[OK] Cliente criado em: $CLIENT_DIR"
  echo "Edite o arquivo .env para inserir as credenciais e IDs corretamente."
fi
