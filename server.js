const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    maxHttpBufferSize: 5 * 1024 * 1024, // Limite de 5 MB para dados recebidos
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

let users = {};
let chatBackground = 'url()'; // Fundo padrão

io.on('connection', (socket) => {
    console.log('Novo usuário conectado:', socket.id);

    // Envia o fundo atual para o novo usuário
    socket.emit('updateBackground', chatBackground);

    socket.on('join', (username, photo) => {
    // Valida o tamanho do username
    if (username.length > 50) {
        username = 'Anônimo'; // Define como "Anônimo"
        return;
    }
        // Define o nome como "Anônimo" se estiver vazio ou sistema
	username = username.toLowerCase() === 'sistema' ? 'Anônimo' : username;
        username = username.trim() || 'Anônimo';

        // Verifica se a imagem é um GIF (base64 ou URL) e remove
        if (photo && (photo.match(/\.(gif)$/i) || photo.startsWith('data:image/gif'))) {
            photo = 'https://github.githubassets.com/assets/GitHub-Mark-ea2971cee799.png'; // Remove a imagem GIF, mas permite a entrada
        } else if (photo.length > 5 * 1024 * 1024) { // 5 MB (para base64)
            photo = 'https://github.githubassets.com/assets/GitHub-Mark-ea2971cee799.png'; // Remove a imagem
	}
        users[socket.id] = { username, photo };
        io.emit('updateUsers', users);
        io.emit('message', { username: 'Sistema', message: `${username} se juntou à aventura.` });
    });

    socket.on('sendMessage', (message) => {
        const user = users[socket.id];
        if (!user) {
            return; // Ignora se o usuário não estiver registrado
        }

        // Verifica se a mensagem contém apenas espaços ou está vazia
    	if (message.trim() === "") {
            return; // Não envia a mensagem
        }

        // Valida o tamanho da mensagem
        if (message.length > 500) {
            return;
        }

        // Verifica se a mensagem é um comando (começa com /)
        if (message.startsWith('/')) {
            const [command, ...args] = message.slice(1).split(' ');

            switch (command) {
                case 'roll':
                    if (args.length === 1 && !isNaN(args[0])) {
                        const max = parseInt(args[0], 10);
                        if (max >= 2 && max <= 100) {
                            const roll = Math.floor(Math.random() * max) + 1;
                            io.emit('message', { username: 'Sistema', message: `${user.username} rolou um dado de 1 a ${max} e obteve: ${roll}` });
                        }
                    }
                    break;

                case 'system':
                    if (args.length > 0) {
                        const systemMessage = args.join(' ');
                        io.emit('message', { username: 'Sistema', message: systemMessage });
                    }
                    break;

                default:
                    break;
            }
        } else {
            io.emit('message', { username: user.username, photo: user.photo, message });
        }
    });

    socket.on('changeBackground', (imageUrl) => {
        // Valida URL vazia
        if (imageUrl.trim() === "") {
            return;
        }

        // Valida o tamanho da URL
        if (imageUrl.length > 200) {
            return;
        }

        // Verifica se a URL é um GIF e bloqueia
        if (typeof imageUrl === 'string' && imageUrl.trim() !== '') {
            if (imageUrl.match(/\.(gif)$/i)) {
                return;
            }
    	    const user = users[socket.id];
            if (!user) {
               return; // Ignora se o usuário não estiver registra>
            }
            chatBackground = `url(${imageUrl.trim()})`;
            io.emit('updateBackground', chatBackground);
        } else {
        }
    });

    socket.on('disconnect', () => {
        const user = users[socket.id];
        if (user) {
            io.emit('message', { username: 'Sistema', message: `${user.username} deixou a aventura.` });
            delete users[socket.id];
            io.emit('updateUsers', users);
        }
        console.log('Usuário desconectado:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
