'use strict';
import {
    Arc,
    ClickXY,
    Abstract,
    Ellipse,
    Layer,
    Line,
    MasterJasonFile,
    Pencil,
    Picture,
    Polygon,
    Rect,
    Rubber,
    Text
} from './canvasClasses.js';
import {
    Bullet,
    Player
} from './gameClasses.js';
import { KEYS } from './constants.js';
import { asyncRequest } from '../functions.js';

class Game {
    constructor(canvas, username, io) {
        (async () => {
            window.game = this;
            this.username = username
            this.io = io;
            if (!canvas instanceof HTMLCanvasElement) {
                throw 'Paramete 1 must be a Canvas HTML Element'
            }
            this.loadEvents();
            this.socketIOEvents();

            this.canvas = canvas;
            this.context = canvas.getContext('2d');
            
            this.players = {};
            this.bullets = {};
            this.keys = [];
            this.createStaticCanvas();

            const tempPlayers = (await asyncRequest({ url: '/game/getPlayers', method: 'GET' })).response;
            for (const id in tempPlayers) {
                this.updatePlayers(tempPlayers[id]);
            }
            this.ships = (await asyncRequest({ url: '/game/getShips', method: 'GET' })).response;
            this.player = new Player(this.username, this.ships[0], 0, 0);
            this.player.socketId = socket.id;
            do {
                this.player.x = parseInt(Math.random() * this.canvas.width - this.player.width);
                this.player.y = parseInt(Math.random() * this.canvas.height - this.player.height);
            } while (this.checkCollisions());
            const tX = this.canvas.width / 2 - this.player.width / 2 - this.player.x;
            const tY = this.canvas.height / 2 - this.player.height / 2 - this.player.y;
            this.context.translate(tX, tY);
            this.player.ioId = this.io.id;
            this.io.emit('player movement', this.player);

            this.beginInterval();
        })();
    }
    socketIOEvents() {

        this.io.on('players updated', this.updatePlayers.bind(this));
        this.io.on('bullet movement', this.updateBullets.bind(this));
        this.io.on('player leave', id => {
            delete this.players[id];
            this.updatePlayers();
        });
        this.io.on('bullet remove', id => {
            delete this.bullets[id];
        });
        this.io.on('player hit', msg => {
            this.player.life--;
            console.log('HIT', msg);
            if (!this.player.life) {
                this.player.life = 10;
                this.io.emit('player died', msg);
            }
        });
        this.io.on('player died', msg => {
            this.players[msg.playerId].deaths++;
            this.players[msg.from].kills++;
        });
    }
    beginInterval() {
        setInterval(this.intervalMethod.bind(this), 1000 / 60);
        setInterval(this.bulletInterval.bind(this), 10);
    }
    intervalMethod() {
        this.movement();
        this.drawAll();
    }
    clear() {
        this.context.clearRect(this.player.x - this.canvas.width, this.player.y - this.canvas.height, this.canvas.width * 2, this.canvas.height * 2);
    }
    movement() {
        const player = this.player;
        const tempPosition = {
            x: player.x,
            y: player.y
        }

        if (this.keys[KEYS.UP]) {
            player.speed += 0.1;
        }
        if (this.keys[KEYS.DOWN] && player.speed) {
            player.speed -= 0.1;
        }
        if (player.speed >= 20) player.speed = 20;
        if (player.speed < 0) player.speed = 0;

        if (this.keys[KEYS.LEFT]) {
            player.rotate -= 0.02;
        }
        if (this.keys[KEYS.RIGHT]) {
            player.rotate += 0.02;
        }
        if (player.rotate >= 2 * Math.PI) player.rotate -= 2 * Math.PI;
        if (player.rotate < 0) player.rotate = 2 * Math.PI + player.rotate;

        const quad = parseInt(player.rotate / (Math.PI / 2));
        const angle = player.rotate - Math.PI / 2 * quad;

        let moveX = Math.abs(Math.cos(player.rotate)) * player.speed;
        let moveY = Math.abs(Math.sin(player.rotate)) * player.speed;
        switch (quad) {
            case 0:
                break;
            case 1:
                moveX *= -1;
                break;
            case 2:
                moveY *= -1;
                moveX *= -1;
                break;
            case 3:
                moveY *= -1;
                break;
        }

        player.x += moveX;
        player.y += moveY;

        if (player.speed || this.keys[KEYS.LEFT] || this.keys[KEYS.RIGHT]) {
            if (!this.checkCollisions()) {
                this.context.translate(-moveX, -moveY);
                this.io.emit('player movement', this.player);
            } else {
                player.x = tempPosition.x;
                player.y = tempPosition.y;
            }
        }

    }
    checkCollisions() {
        const rect1 = this.player;
        let colision = false;
        for (let id in this.players) {
            const rect2 = this.players[id];
            if (rect2.ioId !== rect1.ioId) {
                colision = rect1.x < rect2.x + rect2.width &&
                    rect1.x + rect1.width > rect2.x &&
                    rect1.y < rect2.y + rect2.height &&
                    rect1.height + rect1.y > rect2.y;
                if (colision) break;
            }
        }
        return colision;
    }
    updateBullets(bulletDetails) {
        let bullet = this.bullets[bulletDetails.id];
        if (!bullet) {
            bullet = new Bullet(bulletDetails.ioId, bulletDetails.x, bulletDetails.y, bulletDetails.rotate);
            this.bullets[bulletDetails.id] = bullet;
        } else {
            bullet.x = bulletDetails.x;
            bullet.y = bulletDetails.y;
            bullet.x2 = bulletDetails.x2;
            bullet.y2 = bulletDetails.y2;
        }
    }
    updatePlayers(plDetails) {
        const players = this.players;
        if (plDetails) {
            if (!players[plDetails.socketId]) {
                players[plDetails.socketId] = new Player(plDetails.name, plDetails.ship);
                players[plDetails.socketId].socketId = plDetails.socketId;
                players[plDetails.socketId].ioId = plDetails.ioId;
            }
            players[plDetails.socketId].x = plDetails.x;
            players[plDetails.socketId].y = plDetails.y;
            players[plDetails.socketId].rotate = plDetails.rotate;
            players[plDetails.socketId].rotateGrad = plDetails.rotateGrad;
        }
    }
    drawAll() {
        this.clear();
        this.background.draw(this.context);
        for (const id in this.players) {
            this.players[id].draw(this.context);
        }
        for (const id in this.bullets) {
            this.bullets[id].draw(this.context);
        }
        const text1 = `${this.player.x}x${this.player.y}`;
        const text2 = `Speed: ${this.player.speed}`;
        const text3 = `Rotation: ${parseInt(this.player.rotate * 360 / (2 * Math.PI))}`;
        const textX = this.player.x - this.canvas.width / 2 + this.player.width;
        const textY = this.player.y - this.canvas.height / 2 + this.player.height;
        this.drawTexts();

    }
    drawTexts() {
        const texts = [
            `${parseInt(this.player.x * 100) / 100}x${parseInt(this.player.y * 100) / 100}`,
            `Speed: ${parseInt(this.player.speed * 100) / 100}`,
            `Rotation: ${parseInt(this.player.rotate * 360 / (2 * Math.PI))}`,];
        const textX = this.player.x - this.canvas.width / 2 + this.player.width;
        const textY = this.player.y - this.canvas.height / 2 + this.player.height;
        texts.forEach((text,i) => {
            this.playerInfo.shapes[i].text = text;
            this.playerInfo.shapes[i].x = textX;
            this.playerInfo.shapes[i].y = textY + i * 50;
        });
        this.playerInfo.draw(this.context)
    }
    createStaticCanvas() {
        this.playerInfo = new Layer('Player Info', [
            new Text('', 0, 0, 40, 'Helvetica', '#13ff03'),
            new Text('', 0, 0 + 50, 40, 'Helvetica', '#13ff03'),
            new Text('', 0, 0 + 100, 40, 'Helvetica', '#13ff03'),
            new Text('', 0, 0 + 150, 40, 'Helvetica', '#13ff03')
        ]);
        
        this.background = new Layer('background', [new Rect(-10000, -10000, 20000, 20000, '#1c2773')]);
        for (let i = 0; i < 2000; i++) {
            const x = parseInt(Math.random() * 20000) - 10000;
            const y = parseInt(Math.random() * 20000) - 10000;
            this.background.shapes.push(new Arc(x, y, 2, '#ffffff'))
        }
    }
    loadEvents() {
        document.body.addEventListener('keydown', this.keyDownEvent.bind(this));
        document.body.addEventListener('keyup', this.keyUpEvent.bind(this));
        window.addEventListener('blur', this.leaveWindow.bind(this));
    }
    keyDownEvent(event) {
        this.keys[event.keyCode] = true;
    }
    keyUpEvent(event) {
        this.keys[event.keyCode] = false;
        if (event.keyCode === KEYS.SPACE) this.player.createBullet();
    }
    leaveWindow() {
        for (const keyCode in this.keys) {
            this.keys[keyCode] = false;
        }
    }
    bulletInterval() {
        const bulletSpeed = 25;
        this.player.bullets = this.player.bullets.filter((bullet, i) => {
            bullet.x += (bulletSpeed * bullet.moveX);
            bullet.y += (bulletSpeed * bullet.moveY);
            if (bullet.isExpired()) {
                this.io.emit('bullet remove', bullet.id);
                return false;
            } else {
                const playerHit = this.checkBulletColision(bullet);
                if (playerHit) {
                    this.io.emit('player hit', {
                        bulletId: bullet.id,
                        playerId: playerHit.socketId,
                        from: this.player.socketId
                    });
                    return false;
                } else {
                    this.io.emit('bullet movement', bullet);
                    return true;
                }
            }

        });
    }
    checkBulletColision(bullet) {
        let collission = false;
        let playerKilled;
        for (const id in this.players) {
            const player = this.players[id];
            if (player.socketId !== bullet.socketId) {
                collission = bullet.x > player.x && bullet.x < player.x + player.width && bullet.y > player.y && bullet.y < player.y + player.height;
                if (collission) {
                    playerKilled = player;
                    break;
                }
            }
        }
        return playerKilled;
    }
}
export default Game;
