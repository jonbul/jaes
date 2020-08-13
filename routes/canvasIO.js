module.exports = io => {
    const players = {};
    io.on('connection', (socket) => {
        socket.on('player movement', (msg) => {
            players[socket.id] = msg;
            io.emit('players updated', players);
        });
        socket.on('disconnect', () => {
            console.log(socket);
            delete players[socket.id];
            //console.log({players}, socket.id,players[socket.id]);
            io.emit('players updated', players);
        })
    });
}