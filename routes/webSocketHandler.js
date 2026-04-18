import WebSocket from 'ws';
import User from '../model/user.js';

class WebSocketHandler {
    constructor(https, players, backgroundCards, currentResolution) {
        this.https = https;
        this.players = players;
        this.backgroundCards = backgroundCards;
        this.currentResolution = currentResolution;
        this.sockets = {};

        this.wss = new WebSocket.Server({ server: https });
        this.wss.on('connection', this.onWSSConnection.bind(this));

        this.playersToSend = {};
        this.hasPlayersToSend = false;
        this.killsList = [];
        this.newBullets = [];
        this.bulletsToRemove = [];

        setInterval(this.cleanPlayers.bind(this), 10000)
        setInterval(this.gameStatusBroadcast.bind(this), 1000 / 30);
    }

    onWSSConnection(socket) {
        socket.id = Date.now() + parseInt(Math.random() * 1000);
        this.sockets[socket.id] = socket;
        console.log(`✅ Nueva conexión: ${socket.id} | Total: ${Object.keys(this.sockets).length}`);

        ///console.log("Connected from IP: ", socket.handshake.address);
        socket.events = {};

        this.addMessageEvent(socket, 'connectionSuccess', this.msg_connectionSuccess.bind(this, socket));

        this.addMessageEvent(socket, 'playerHit', this.msg_playerHit.bind(this));

        this.addMessageEvent(socket, 'playerDied', this.msg_playerDied.bind(this));

        this.addMessageEvent(socket, 'newBullet', this.msg_newBullet.bind(this));

        this.addMessageEvent(socket, 'getBackgroundCards', this.msg_getBackgroundCards.bind(this));

        this.addMessageEvent(socket, 'removeBullet', this.msg_removeBullet.bind(this));

        this.addMessageEvent(socket, 'playerData', this.msg_playerData.bind(this, socket));

        socket.addEventListener('message', this.socketMessageEvent.bind(this, socket));

        socket.addEventListener('close', this.socketCloseEvent.bind(this, socket));
    }

    addMessageEvent(socket, eventName, callback) {
        socket.events[eventName] = callback;
    }

    async socketMessageEvent(socket, event) {
        const data = JSON.parse(event.data);
        socket.events[data.eventName](data);
    }

    async socketCloseEvent(socket) {
        console.log(`❌ Desconexión: ${socket.id} | Total: ${Object.keys(this.sockets).length}`);

        if (!this.players[socket.id]) return;
        const user = await User.findOne({ username: this.players[socket.id].name });
        if (user) {
            user.credits = this.players[socket.id] ? this.players[socket.id].credits : 0;
            user.kills = user.kills ? user.kills + this.players[socket.id].kills : this.players[socket.id].kills;
            user.deaths = user.deaths ? user.deaths + this.players[socket.id].deaths : this.players[socket.id].deaths;
            await user.save();
        }
        delete this.players[socket.id];
        delete this.sockets[socket.id];
        this.broadcastToAll('player leave', { socketId: socket.id });
    }

    msg_connectionSuccess(socket) {
        this.sockets[socket.id].send(JSON.stringify({ eventName: 'connectionSuccess', socketId: socket.id }));
    }

    msg_playerHit(msg) {
        this.sockets[msg.playerId]?.send(JSON.stringify({ eventName: 'playerHit', ...msg }));
    }

    msg_playerDied(msg) {
        this.killsList.push(msg);
        if (this.players[msg.from]) {
            this.hasPlayersToSend = true;
            this.players[msg.from].credits += 100;
            if (this.playersToSend[msg.from]) {
                this.playersToSend[msg.from].credits = this.players[msg.from].credits;
            } else {
                this.playersToSend[msg.from] = this.players[msg.from];
            }
        }
    }

    msg_newBullet(msg) {
        this.newBullets.push(msg.bullet);
    }

    msg_getBackgroundCards(msg) {
        const backgroundCards = this.backgroundCards;
        const cards = []
        msg.data.forEach(card => {
            if (backgroundCards[card[0]] && backgroundCards[card[0]][card[1]]) {
                cards.push(backgroundCards[card[0]][card[1]]);
            } else {
                const newCard = [
                    card[0],//x
                    card[1],//y
                    []//start
                ]
                for (let i = 0; i < 500; i++) {
                    newCard[2].push([
                        parseInt(Math.random() * this.currentResolution.width),
                        parseInt(Math.random() * this.currentResolution.height),
                        parseInt(Math.random() * 4) + 1
                    ]);
                }
                backgroundCards[card[0]] = backgroundCards[card[0]] || {};
                backgroundCards[card[0]][card[1]] = newCard;
                cards.push(newCard);
            }
        });
        this.sockets[msg.socketId]?.send(JSON.stringify({ eventName: 'getBackgroundCards', cards }));
    }

    msg_removeBullet(msg) {
        this.bulletsToRemove.push(msg.bulletId);
    }

    msg_playerData(socket, msg) {
        if (this.playersToSend[socket.id]) {
            msg.credits = this.playersToSend[socket.id].credits;
        }
        this.players[socket.id] = msg;
        this.playersToSend[socket.id] = msg;
        this.players[socket.id].lastUpdate = Date.now();
        msg.socketId = socket.id;
        this.hasPlayersToSend = true;
    }

    cleanPlayers() {
        for (const sId in this.players) {
            if (Date.now() - this.players[sId].lastUpdate > 600000) {
                this.sockets[sId]?.send(JSON.stringify({ eventName: 'sendHome' }));
                this.sockets[sId]?.close();
                delete this.players[sId];
                delete this.sockets[sId];
            }
        }
    }

    gameStatusBroadcast() {
        if (this.hasPlayersToSend || this.killsList.length || this.newBullets.length || this.bulletsToRemove.length) {
            this.broadcastToAll('gameBroadcast', {
                bulletsToRemove: this.bulletsToRemove,
                newBullets: this.newBullets,
                players: this.playersToSend,
                kills: this.killsList
            });
            this.hasPlayersToSend = false;
            this.playersToSend = {};
            this.killsList = [];
            this.newBullets = [];
            this.bulletsToRemove = [];
        }
    }

    broadcastToAll(eventName, data) {
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ eventName, ...data }));
            }
        });
    }
}

export default WebSocketHandler;