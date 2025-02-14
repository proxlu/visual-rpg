const socket = io();

const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const loginModal = document.getElementById('login-modal');
const usernameInput = document.getElementById('username-input');
const photoInput = document.getElementById('photo-input');
const loginButton = document.getElementById('login-button');
const backgroundImageUrlInput = document.getElementById('background-image-url');
const changeBackgroundButton = document.getElementById('change-background-button');

let username = '';
let photo = '';

loginButton.addEventListener('click', () => {
    username = usernameInput.value.trim() || 'Anônimo'; // Usa "Anônimo" se o nome estiver vazio

    // Impede que o usuário escolha o nome "Sistema"
    if (username.toLowerCase() === 'sistema') {
        username = 'Anônimo';
    }

    // Valida o tamanho do username
    if (username.length > 50) {
        username = 'Anônimo'; // Define como "Anônimo"
    }

    if (username) {
        const file = photoInput.files[0];
        if (file) {
            // Verifica se o arquivo é um GIF
            if (file.type === "image/gif") {
                photo = 'GitHub-Mark-ea2971cee799.png'; // Define como null ou undefined para indicar que não há foto válida
            } else if (file.size > 5 * 1024 * 1024) { // 5 MB
                photo = 'GitHub-Mark-ea2971cee799.png'; // Remove a imagem
            } else {
                const reader = new FileReader();
                reader.onload = (e) => {
                    photo = e.target.result;
                    socket.emit('join', username, photo);
                    loginModal.style.display = 'none';
                };
                reader.readAsDataURL(file);
                return; // Impede o envio imediato até a foto ser carregada
            }
        } else {
            photo = 'GitHub-Mark-ea2971cee799.png'; // Se não houver arquivo de foto, define como null ou undefined
        }
        
        // Emitir o evento do socket após o tratamento da foto
        socket.emit('join', username, photo);
        loginModal.style.display = 'none';
    }
});

backgroundImageUrlInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // Evita quebra de linha no campo de texto
        const imageUrl = backgroundImageUrlInput.value;
        if (imageUrl) {
            socket.emit('changeBackground', imageUrl);
        }
    }
});

messageInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // Evita quebra de linha no campo de texto
        const message = messageInput.value.trim();
        if (message === "") {
            return;
        }
        if (message.length > 500) {
            return;
        }
        socket.emit('sendMessage', message);
        messageInput.value = '';
    }
});

sendButton.addEventListener('click', () => {
    const message = messageInput.value.trim();
    if (message === "") {
        return;
    }
    if (message.length > 500) {
        return;
    }
    socket.emit('sendMessage', message);
    messageInput.value = '';
});

changeBackgroundButton.addEventListener('click', () => {
    const imageUrl = backgroundImageUrlInput.value.trim();
    if (imageUrl === "") {
        return;
    }
    if (imageUrl.length > 200) {
        return;
    }
    socket.emit('changeBackground', imageUrl);
});

socket.on('updateBackground', (background) => {
    document.getElementById('chat-messages').style.backgroundImage = background;
});

socket.on('message', (data) => {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');

    // Adiciona a foto do usuário (se existir)
    if (data.photo) {
        const img = document.createElement('img');
        img.src = data.photo;
        messageElement.appendChild(img);
    }

    // Cria um container para o nome do usuário (apenas para mensagens de usuários)
    if (data.username !== 'Sistema') {
        const usernameElement = document.createElement('div');
        usernameElement.classList.add('message-username');
        usernameElement.textContent = data.username; // Nome do usuário
        messageElement.appendChild(usernameElement);
    }

    // Cria o balão de mensagem
    const bubble = document.createElement('div');
    bubble.classList.add('message-bubble');

    // Aplica estilos dinâmicos para mensagens do sistema
    if (data.username === 'Sistema') {
        bubble.classList.add('system-message');
        bubble.textContent = data.message; // Remove o nome "Sistema:" da mensagem
    } else {
        bubble.textContent = data.message; // Apenas a mensagem do usuário
    }

    messageElement.appendChild(bubble);
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
});
