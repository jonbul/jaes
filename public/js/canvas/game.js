'use strict';
import {
    Arc,
    Bullet,
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
    Player,
    Text
} from './canvasClasses.js';
import canvasClasses from './canvasClasses.js';
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

            const tempPlayers = (await asyncRequest({ url: '/game/getPlayers', method: 'GET' })).response;
            for (const id in tempPlayers) {
                this.updatePlayers(tempPlayers[id]);
            }
            this.ships = (await asyncRequest({ url: '/game/getShips', method: 'GET' })).response;
            this.player = new Player(this.username, this.ships[0],0,0);
            this.player.socketId = socket.id;
            do {
                this.player.x = parseInt(Math.random() * this.canvas.width - this.player.width);
                this.player.y = parseInt(Math.random() * this.canvas.height - this.player.height);
            } while (this.checkCollisions());
            const tX = this.canvas.width/2 - this.player.width/2 - this.player.x;
            const tY = this.canvas.height/2 - this.player.height/2 - this.player.y;
            this.context.translate(tX, tY);
            this.player.ioId = this.io.id;
            this.io.emit('player movement', this.player);

            const bg = new Rect(-10000, -10000, 20000, 20000, '#1c2773');
            this.background = new Layer('background', [bg]);
            for(let i = 0; i < 2000; i++) {
                const x = parseInt(Math.random() * 20000) - 10000;
                const y = parseInt(Math.random() * 20000) - 10000;
                this.background.shapes.push(new Arc(x, y, 2, '#ffffff'))
            }
            this.beginInterval();
            setInterval(this.bulletInterval.bind(this), 10);
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
        this.intervaId = setInterval(this.intervalMethod.bind(this), 20);
    }
    stopInterval() {
        clearInterval(this.intervalId);
    }
    intervalMethod() {
        this.movement();
    }
    clear() {
        
        this.context.clearRect(this.player.x-this.canvas.width, this.player.y-this.canvas.height, this.canvas.width * 2, this.canvas.height * 2);
    }
    movement() {
        const player = this.player;
        const tempPosition = {
            x: player.x,
            y: player.y,
            h: player.height,
            w: player.width,
            username: this.username
        }
        let move = this.keys[KEYS.UP] !== this.keys[KEYS.DOWN] || this.keys[KEYS.LEFT] !== this.keys[KEYS.RIGHT];
        let speed = this.keys[KEYS.SHIFT] ? 4 : 2;
        if (this.keys[KEYS.CTRL]) speed = speed / 2;
        let speedX = 0;
        let speedY = 0;
        if (this.keys[KEYS.UP]) {
            //player.y = player.y - speed;
            speedY -= speed;
        }
        if (this.keys[KEYS.DOWN]) {
            speedY += speed;
        }
        if (this.keys[KEYS.LEFT]) {
            speedX -= speed;
        }
        if (this.keys[KEYS.RIGHT]) {
            speedX += speed;
        }
        player.x += speedX;
        player.y += speedY;

        //direction
        if (this.keys[KEYS.LEFT] && !this.keys[KEYS.RIGHT] && this.keys[KEYS.UP] === this.keys[KEYS.DOWN]) {
            player.rotateGrad = 180;
        } else if (!this.keys[KEYS.LEFT] && this.keys[KEYS.RIGHT] && this.keys[KEYS.UP] === this.keys[KEYS.DOWN]) {
            player.rotateGrad = 0;
        } else if (this.keys[KEYS.LEFT] === this.keys[KEYS.RIGHT] && this.keys[KEYS.UP] && !this.keys[KEYS.DOWN]) {
            player.rotateGrad = 270;
        } else if (this.keys[KEYS.LEFT] === this.keys[KEYS.RIGHT] && !this.keys[KEYS.UP] && this.keys[KEYS.DOWN]) {
            player.rotateGrad = 90;
        } else if (this.keys[KEYS.LEFT] && !this.keys[KEYS.RIGHT] && this.keys[KEYS.UP] && !this.keys[KEYS.DOWN]) {
            player.rotateGrad = 225;
        } else if (this.keys[KEYS.LEFT] && !this.keys[KEYS.RIGHT] && !this.keys[KEYS.UP] && this.keys[KEYS.DOWN]) {
            player.rotateGrad = 135;
        } else if (!this.keys[KEYS.LEFT] && this.keys[KEYS.RIGHT] && this.keys[KEYS.UP] && !this.keys[KEYS.DOWN]) {
            player.rotateGrad = 315;
        } else if (!this.keys[KEYS.LEFT] && this.keys[KEYS.RIGHT] && !this.keys[KEYS.UP] && this.keys[KEYS.DOWN]) {
            player.rotateGrad = 45;
        }
        player.rotate = player.rotateGrad * Math.PI / 180;
        if (move) {
            if (!this.checkCollisions()) {
                this.context.translate(-speedX, -speedY);
                this.io.emit('player movement', this.player);
            } else {
                player.x = tempPosition.x;
                player.y = tempPosition.y;
            }
        }
        this.drawAll();
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
            bullet = new Bullet(bulletDetails.ioId, bulletDetails.x, bulletDetails.y, bulletDetails.dirX, bulletDetails.dirY, bulletDetails.rotate);

            bullet.rotateGrad = bulletDetails.rotateGrad;
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
    }
    loadEvents() {
        document.body.addEventListener('keydown', this.keyDownEvent.bind(this));
        document.body.addEventListener('keyup', this.keyUpEvent.bind(this));
        window.addEventListener('blur', this.leaveWindow.bind(this));
    }
    keyDownEvent(event) {
        this.keys[event.keyCode] = true;
        //event.preventDefault();
    }
    keyUpEvent(event) {
        this.keys[event.keyCode] = false;
        if (event.keyCode === KEYS.SPACE) this.createBullet();
    }
    leaveWindow() {
        for (const keyCode in this.keys) {
            this.keys[keyCode] = false;
        }
    }
    createBullet() {
        const player = this.player;
        let x, y, dirX, dirY;
        switch (this.player.rotateGrad) {
            case 0:
                x = player.x + player.width;
                y = player.y + player.height / 2;
                dirX = 1;
                dirY = 0;
                break;
            case 45:
                x = player.x + player.width;
                y = player.y + player.height;
                dirX = 1;
                dirY = 1;
                break;
            case 90:
                x = player.x + player.width / 2;
                y = player.y + player.height;
                dirX = 0;
                dirY = 1;
                break;
            case 135:
                x = player.x;
                y = player.y + player.height;
                dirX = -1;
                dirY = 1;
                break;
            case 180:
                x = player.x;
                y = player.y + player.height / 2;
                dirX = -1;
                dirY = 0;
                break;
            case 225:
                x = player.x;
                y = player.y;
                dirX = -1;
                dirY = -1;
                break;
            case 270:
                x = player.x + player.width / 2;
                y = player.y;
                dirX = 0;
                dirY = -1;
                break;
            case 315:
                x = player.x + player.width;
                y = player.y;
                dirX = 1;
                dirY = -1;
                break;
        }
        const bullet = new Bullet(this.io.id, x, y, dirX, dirY, this.player.rotateGrad);
        this.player.bullets.push(bullet);
    }
    bulletInterval() {
        const bulletSpeed = 20;
        this.player.bullets = this.player.bullets.filter((bullet, i) => {
            bullet.x = bullet.x + (bulletSpeed * bullet.dirX);
            bullet.y = bullet.y + (bulletSpeed * bullet.dirY);
            bullet.x2 = bullet.x2 + (bulletSpeed * bullet.dirX);
            bullet.y2 = bullet.y2 + (bulletSpeed * bullet.dirY);
            if (bullet.x < -bullet.length || bullet.y < -bullet.length || bullet.x > this.canvas.width + bullet.length || bullet.y > this.canvas.height + bullet.length) {
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
            collission = bullet.x > player.x && bullet.x < player.x + player.width && bullet.y > player.y && bullet.y < player.y + player.height;
            if (collission) {
                playerKilled = player;
                break;
            }
        }
        return playerKilled;
    }
}
export default Game;
