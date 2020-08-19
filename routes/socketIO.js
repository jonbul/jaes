module.exports = io => {
    const players = {};
    io.on('connection', (socket) => {
        console.log("Connected from IP: ", socket.handshake.address)
        socket.on('player movement', (msg) => {
            players[socket.id] = msg;
            io.emit('players updated', players);
        });
        socket.on('disconnect', () => {
            delete players[socket.id];
            io.emit('player leave', socket.id);
        })
    });
}