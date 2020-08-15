module.exports = io => {
    const players = {};
    io.on('connection', (socket) => {
        socket.on('player movement', (msg) => {
            players[socket.id] = msg;
            io.emit('players updated', players);
        });
        socket.on('disconnect', () => {
            console.log(socket.id);
            delete players[socket.id];
            io.emit('player leave', socket.id);
        })
    });
}