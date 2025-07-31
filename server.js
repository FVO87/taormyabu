import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import fs from 'fs'; // Adicionado para ler o ficheiro de bloqueios

// Módulos da aplicação
import authRoutes from './routes/authRoutes.js';
import { isAuthenticated } from './middleware/authMiddleware.js';
import { initializeBot } from './bot.js';
import { startCleanupJob } from './services/schedulerService.js';
import { bloquearUsuario, liberarUsuario } from './userState.js';

// Inicialização do servidor
const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração de Middlewares
app.use(session({
  secret: 'SEU_SEGREDO_DE_SESSAO_FINAL_E_SEGURO',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Listeners do Socket.IO
io.on('connection', (socket) => {
    console.log('[SOCKET] Um utilizador conectou-se ao painel de controlo');

    socket.on('pause_user', (data) => {
        const targetJid = `${data.number}@s.whatsapp.net`;
        bloquearUsuario(targetJid);
        const logMessage = `[PAINEL] Bot pausado para ${data.number}`;
        io.emit('new_log', { message: logMessage });
        console.log(logMessage);
    });

    socket.on('resume_user', (data) => {
        const targetJid = `${data.number}@s.whatsapp.net`;
        liberarUsuario(targetJid);
        const logMessage = `[PAINEL] Bot reativado para ${data.number}`;
        io.emit('new_log', { message: logMessage });
        console.log(logMessage);
    });
});

// Definição de Rotas
app.use('/auth', authRoutes);
app.get('/', (req, res) => res.redirect('/login'));
app.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.get('/dashboard', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// --- NOVA ROTA DA API PARA A FILA DE ATENDIMENTO ---
app.get('/api/paused-users', isAuthenticated, (req, res) => {
    const bloqueiosPath = path.join(__dirname, 'data', 'bloqueios.json');
    fs.readFile(bloqueiosPath, 'utf8', (err, data) => {
        if (err) {
            // Se o ficheiro não existir (nenhum utilizador bloqueado), envia uma lista vazia
            if (err.code === 'ENOENT') {
                return res.json([]);
            }
            console.error('[API] Erro ao ler o ficheiro de bloqueios:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        try {
            const bloqueios = JSON.parse(data);
            // Transforma o objeto { "numero": true } num array de números ["numero"]
            const userList = Object.keys(bloqueios);
            res.json(userList);
        } catch (parseErr) {
            console.error('[API] Erro ao fazer o parse do ficheiro de bloqueios:', parseErr);
            res.status(500).json({ error: 'Erro ao processar os dados' });
        }
    });
});


// Inicialização da Aplicação
try {
  initializeBot(io);
  startCleanupJob();
  console.log('[SERVER] Bot e serviços agendados iniciados.');
} catch (error) {
  console.error('[SERVER] Falha ao inicializar o bot:', error);
}

const PORT = 8080;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[SERVER] Dashboard rodando na porta ${PORT}`);
});
