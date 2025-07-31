// setup.js
import { initDb, createUser } from './services/authService.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function setup() {
  console.log('--- Configuração do Usuário do Dashboard ---');
  await initDb();
  console.log('Banco de dados de usuários inicializado.');

  rl.question('Digite o nome do usuário admin: ', (username) => {
    rl.question('Digite a senha para o usuário admin: ', async (password) => {
      try {
        await createUser(username.trim(), password.trim());
        console.log(`✅ Usuário '${username.trim()}' criado com sucesso!`);
      } catch (error) {
        console.error('❌ Erro ao criar usuário. Ele já pode existir.', error.message);
      } finally {
        rl.close();
      }
    });
  });
}

setup();