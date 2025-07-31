// ARQUIVO: ecosystem.config.cjs

module.exports = {
  apps: [
    {
      name: "bot-5511960391374",
      script: "/home/flavio/Saas-IA/Le_com_Cre/index.js",
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        CLIENT_ID: "5511960391374",
        GOOGLE_APPLICATION_CREDENTIALS: "/home/flavio/Saas-IA/TotalClin/config/5511958429999-google.json"
      }
    }
    
    // Adicione mais bots conforme necessário
  ]
};

