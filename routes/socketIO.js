module.exports = io => {
    const players = {};
    io.on('connection', (socket) => {
        console.log("Connected from IP: ", socket.handshake.address)
        socket.on('player movement', (msg) => {
            players[socket.id] = msg;
            msg.socketId = socket.id;
            io.emit('players updated', msg);
        });
        socket.on('disconnect', () => {
            delete players[socket.id];
            console.log('bye');
            io.emit('player leave', socket.id);
        });
        socket.on('bullet movement', (msg) => {
            io.emit('bullet movement', msg);
        });
        socket.on('get all players', () => {})
    });
}