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
    _player
} from './gameClasses.js';
import { KEYS } from './constants.js';
import { asyncRequest } from '../functions.js';
let Player;
class Game {
    constructor(canvas, username, io) {
        (async () => {
            Player = await _player;
            window.game = this;
            this.username = username
            this.io = io;
            if (!canvas instanceof HTMLCanvasElement) {
                throw 'Paramete 1 must be a Canvas HTML Element'
            }
            this.loadEvents();
            this.socketIOEvents();

            //await new FontFace('retro', 'url(/fonts/Arcade.ttf)').load();

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
            this.player = new Player(this.username, 0, 0, 0);
            this.player.socketId = socket.id;
            this.players[socket.id] = this.player;
            do {
                this.player.x = parseInt(Math.random() * this.canvas.width - this.player.width);
                this.player.y = parseInt(Math.random() * this.canvas.height - this.player.height);
            } while (this.checkCollisions());
            const tX = this.canvas.width / 2 - this.player.width / 2 - this.player.x;
            const tY = this.canvas.height / 2 - this.player.height / 2 - this.player.y;
            this.context.translate(tX, tY);
            this.player.ioId = this.io.id;
            this.io.emit('player movement', this.player.getSortDetails());

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
    }
    intervalMethod() {
        this.movement();
        this.bulletInterval();

        //this.drawAll();
        requestAnimationFrame(this.drawAll.bind(this));
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

        player.x = Math.round(player.x * 100) / 100;
        player.y = Math.round(player.y * 100) / 100;

        if (player.speed || this.keys[KEYS.LEFT] || this.keys[KEYS.RIGHT]) {
            if (!this.checkCollisions()) {
                this.context.translate(-moveX, -moveY);
                this.io.emit('player movement', this.player.getSortDetails());
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
            bullet = new Bullet(bulletDetails.socketId, bulletDetails.x, bulletDetails.y, bulletDetails.angle);
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
                players[plDetails.socketId] = new Player(plDetails.name, plDetails.shipId);
                players[plDetails.socketId].socketId = plDetails.socketId;
                players[plDetails.socketId].ioId = plDetails.ioId;
            }
            players[plDetails.socketId].x = plDetails.x;
            players[plDetails.socketId].y = plDetails.y;
            players[plDetails.socketId].rotate = plDetails.rotate;
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
        this.player.draw(this.context);
        this.drawTexts();

    }
    drawTexts() {
        const texts = [
            `${parseInt(this.player.x * 100) / 100}x${parseInt(this.player.y * 100) / 100}`,
            `Speed: ${parseInt(this.player.speed * 100) / 100}`,
            `Rotation: ${parseInt(this.player.rotate * 360 / (2 * Math.PI))}`,];
        const cornerX = this.player.x - this.canvas.width / 2 + this.player.width / 2;
        const cornerY = this.player.y - this.canvas.height / 2 + this.player.height / 2;
        const textX = cornerX + 20;
        const textY = cornerY + 50;
        texts.forEach((text, i) => {
            this.playerInfo.shapes[i].text = text;
            this.playerInfo.shapes[i].x = textX;
            this.playerInfo.shapes[i].y = textY + i * 50;
        });
        this.playerInfo.draw(this.context);

        this.lifeText.text = `Health: ${this.player.life}`;
        this.lifeText.x = cornerX + this.canvas.width - 300;
        this.lifeText.y = cornerY + 50;
        this.lifeText.draw(this.context);

        if (this.keys[KEYS.TAB]) {
            this.shadowBackground.x = cornerX;
            this.shadowBackground.y = cornerY;
            this.shadowBackground.draw(this.context);
            const plList = [];
            const textRows = [['Name', 'Kills', 'Deaths']];
            for (const id in this.players) {
                const player = this.players[id];
                plList.push(player);
                textRows.push([player.name, player.kills, player.deaths]);
            }
            const text = new Text('', 0, 0, 20, 'Digitek', '#13ff03');
            textRows.forEach((row, i) => {
                row.forEach((column, j) => {
                    text.text = column;
                    text.x = cornerX + 500 + 300 * j;
                    text.y = cornerY + 50 + 50 * (i + 1);
                    text.draw(this.context);
                });
            });
        }
    }
    createStaticCanvas() {
        this.playerInfo = new Layer('Player Info', [
            new Text('', 0, 0, 40, 'Arcade', '#13ff03'),
            new Text('', 0, 0 + 50, 40, 'Arcade', '#13ff03'),
            new Text('', 0, 0 + 100, 40, 'Arcade', '#13ff03'),
            new Text('', 0, 0 + 150, 40, 'Arcade', '#13ff03')
        ]);

        this.lifeText = new Text('', 0, 0 + 150, 40, 'Arcade', '#13ff03');

        this.background = new Layer('background', [new Rect(-10000, -10000, 20000, 20000, '#1c2773')]);
        for (let i = 0; i < 2000; i++) {
            const x = parseInt(Math.random() * 20000) - 10000;
            const y = parseInt(Math.random() * 20000) - 10000;
            const starWidth = parseInt(Math.random() * 4) + 1;
            this.background.shapes.push(new Arc(x, y, starWidth, '#ffffff'))
        }
        this.shadowBackground = new Rect(0, 0, this.canvas.width, this.canvas.height, 'rgba(0,0,0,0.2)');
    }
    loadEvents() {
        document.body.addEventListener('keydown', this.keyDownEvent.bind(this));
        document.body.addEventListener('keyup', this.keyUpEvent.bind(this));
        window.addEventListener('blur', this.leaveWindow.bind(this));
    }
    keyDownEvent(event) {
        this.keys[event.keyCode] = true;
        if (this.keys[KEYS.TAB]) {
            event.preventDefault();
        }
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
