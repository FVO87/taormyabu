const socket = io();

// Elementos do DOM
const statusIndicator = document.getElementById('status-indicator');
const statusMessage = document.getElementById('status-message');
const botIdDisplay = document.getElementById('bot-id-display');
const qrImage = document.getElementById('qr-code-image');
const qrPlaceholder = document.getElementById('qr-placeholder');
const logList = document.getElementById('log-list');
const userNumberInput = document.getElementById('user-number-input');
const pauseBtn = document.getElementById('pause-btn');
const resumeBtn = document.getElementById('resume-btn');
const themeCheckbox = document.getElementById('theme-checkbox');
const pausedUsersList = document.getElementById('paused-users-list');


// Conexão com o Socket.IO
socket.on('connect', () => {
  console.log('Conectado ao servidor do painel de controlo!');
  // Define imediatamente o estado visual para "inicializando"
  statusMessage.textContent = 'A inicializar conexão com o bot...';
  statusIndicator.className = 'indicator initializing';
});

// Atualizações de estado do bot
socket.on('status_update', (data) => {
  statusMessage.textContent = data.message;
  statusIndicator.className = 'indicator';
  statusIndicator.classList.add(data.status);

  if (data.status === 'connected' && data.botId) {
    botIdDisplay.textContent = `Conectado como: ${data.botId}`;
  } else {
    botIdDisplay.textContent = '';
  }
});

// Atualizações do QR Code
socket.on('qr_update', (data) => {
  qrImage.src = data.imageUrl;
  qrImage.style.display = 'block';
  qrPlaceholder.style.display = 'none';
});

socket.on('qr_clear', () => {
  qrImage.src = '';
  qrImage.style.display = 'none';
  qrPlaceholder.style.display = 'block';
});

// Novo log de atividades
socket.on('new_log', (data) => {
    const newLog = document.createElement('li');
    const time = new Date().toLocaleTimeString('pt-BR');
    newLog.textContent = `[${time}] ${data.message}`;
    logList.insertBefore(newLog, logList.firstChild);
    if (logList.children.length > 15) {
        logList.removeChild(logList.lastChild);
    }
});

// Lógica para o painel de controlo de utilizador (COM TOASTS)
pauseBtn.addEventListener('click', () => {
    const number = userNumberInput.value.trim();
    if (number) {
        socket.emit('pause_user', { number });
        // SUBSTITUÍDO: alert(...) por Toastify(...)
        Toastify({
            text: `Pedido para pausar o bot para ${number} enviado.`,
            duration: 3000,
            gravity: "top",
            position: "right",
            backgroundColor: "linear-gradient(to right, #ff9a44, #fc6076)",
        }).showToast();
        userNumberInput.value = '';
    } else {
        Toastify({
            text: "Por favor, insira um número de telefone.",
            duration: 3000,
            gravity: "top",
            position: "right",
            backgroundColor: "#dc3545",
        }).showToast();
    }
});

resumeBtn.addEventListener('click', () => {
    const number = userNumberInput.value.trim();
    if (number) {
        socket.emit('resume_user', { number });
        // SUBSTITUÍDO: alert(...) por Toastify(...)
        Toastify({
            text: `Pedido para reativar o bot para ${number} enviado.`,
            duration: 3000,
            gravity: "top",
            position: "right",
            backgroundColor: "linear-gradient(to right, #2af598, #009efd)",
        }).showToast();
        userNumberInput.value = '';
    } else {
        Toastify({
            text: "Por favor, insira um número de telefone.",
            duration: 3000,
            gravity: "top",
            position: "right",
            backgroundColor: "#dc3545",
        }).showToast();
    }
});

// Lógica para o Tema Escuro
function applyTheme(isDark) {
    if (isDark) {
        document.body.classList.add('dark-mode');
        themeCheckbox.checked = true;
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.remove('dark-mode');
        themeCheckbox.checked = false;
        localStorage.setItem('theme', 'light');
    }
}

themeCheckbox.addEventListener('change', (event) => {
    applyTheme(event.target.checked);
});


// Lógica para a Fila de Atendimento (COM TOASTS)
async function fetchPausedUsers() {
    try {
        const response = await fetch('/api/paused-users');
        if (!response.ok) {
            throw new Error('Falha ao buscar a lista de utilizadores');
        }
        const users = await response.json();
        updatePausedUsersList(users);
    } catch (error) {
        console.error('Erro na Fila de Atendimento:', error);
        pausedUsersList.innerHTML = '<li class="error-queue">Erro ao carregar a fila.</li>';
    }
}

function updatePausedUsersList(users) {
    pausedUsersList.innerHTML = '';
    if (users.length === 0) {
        pausedUsersList.innerHTML = '<li class="empty-queue">A fila de atendimento está vazia.</li>';
    } else {
        users.forEach(userJid => {
            const userNumber = userJid.split('@')[0];
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <span><i data-feather="phone-incoming"></i> ${userNumber}</span>
                <button class="btn-copy-user" title="Copiar número" data-number="${userNumber}"><i data-feather="copy"></i></button>
            `;
            pausedUsersList.appendChild(listItem);
        });
        feather.replace();
    }
}

pausedUsersList.addEventListener('click', (event) => {
    const copyButton = event.target.closest('.btn-copy-user');
    if (copyButton) {
        const numberToCopy = copyButton.dataset.number;
        navigator.clipboard.writeText(numberToCopy).then(() => {
            // SUBSTITUÍDO: alert(...) por Toastify(...)
            Toastify({
                text: `Número ${numberToCopy} copiado!`,
                duration: 2000,
                gravity: "top",
                position: "right",
                backgroundColor: "#007bff",
            }).showToast();
        });
    }
});

// Função a ser executada quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme === 'dark');
    fetchPausedUsers();
    setInterval(fetchPausedUsers, 15000);
});
