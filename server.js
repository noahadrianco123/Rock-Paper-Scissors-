const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

let rooms = {}; 

io.on('connection', (socket) => {
    socket.on('joinGame', ({ roomId, maxScore }) => {
        socket.join(roomId);
        if (!rooms[roomId]) {
            rooms[roomId] = { players: [], moves: {}, maxScore: maxScore || 3, rematchVotes: 0 };
        }
        if (rooms[roomId].players.length < 2) {
            rooms[roomId].players.push(socket.id);
        }
        if (rooms[roomId].players.length === 2) {
            io.to(roomId).emit('gameStart', rooms[roomId].maxScore);
        } else {
            socket.emit('waiting', 'Waiting for opponent to join...');
        }
    });

    socket.on('makeMove', ({ roomId, move }) => {
        if (!rooms[roomId]) return;
        rooms[roomId].moves[socket.id] = move;
        socket.to(roomId).emit('opponentMoved');
        if (Object.keys(rooms[roomId].moves).length === 2) {
            io.to(roomId).emit('roundResult', rooms[roomId].moves);
            rooms[roomId].moves = {}; 
        }
    });

    socket.on('rematch', (roomId) => {
        if (!rooms[roomId]) return;
        rooms[roomId].rematchVotes++;
        if (rooms[roomId].rematchVotes === 2) {
            rooms[roomId].rematchVotes = 0;
            io.to(roomId).emit('gameStart', rooms[roomId].maxScore);
        } else {
            socket.emit('waiting', 'Waiting for opponent to accept...');
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

