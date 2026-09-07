const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = 4000;

// Store game rooms
const gameRooms = {};

// Socket.IO connection
io.on('connection', (socket) => {
    console.log('A user connected: ' + socket.id);

    socket.on('createRoom', (roomName) => {
        if (!gameRooms[roomName]) {
            gameRooms[roomName] = { players: [] };
            socket.join(roomName);
            console.log(`Room ${roomName} created`);
            socket.emit('roomCreated', roomName);
        } else {
            socket.emit('roomExists', roomName);
        }
    });

    socket.on('joinRoom', (roomName) => {
        if (gameRooms[roomName]) {
            gameRooms[roomName].players.push(socket.id);
            socket.join(roomName);
            console.log(`User ${socket.id} joined room ${roomName}`);
            socket.emit('joinedRoom', roomName);
        } else {
            socket.emit('roomNotFound', roomName);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected: ' + socket.id);
        // Handle player disconnection from rooms if necessary
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});