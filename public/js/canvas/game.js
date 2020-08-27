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
import {asyncRequest} from '../functions.js';

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
            this.cleanBoard = new Rect(0, 0, canvas.width, canvas.height, '#ffffff', undefined, 0, 0);

            this.players = {}
            this.keys = [];

            const tempPlayers = (await asyncRequest({url: '/game/getPlayers', method: 'GET'})).response;
            for (const id in tempPlayers) {
                this.drawPlayers(tempPlayers[id]);
            }
            this.ships = (await asyncRequest({url: '/game/getShips', method: 'GET'})).response;
            this.player = new Player(this.username, this.ships[0], 50, 50);
            while(this.checkCollisions()) {
                this.player.x = parseInt(Math.random() * this.canvas.width - this.player.width);
                this.player.y = parseInt(Math.random() * this.canvas.height - this.player.height);
            }
            this.player.ioId = this.io.id;
            this.io.emit('player movement', this.player);


            this.beginInterval();
            setInterval(this.bulletInterval.bind(this));
        })();
    }
    socketIOEvents() {
        this.io.on('players updated',this.drawPlayers.bind(this));
        this.io.on('player leave', id => {
            delete this.players[id];
            this.drawPlayers();
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
        this.cleanBoard.draw(this.context);
    }
    movement(){
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
        if (this.keys[KEYS.UP]) {
            player.y = player.y - speed;
        }
        if (this.keys[KEYS.DOWN]) {
            player.y = player.y + speed;
        }
        if (this.keys[KEYS.LEFT]) {
            player.x = player.x - speed;
        }
        if (this.keys[KEYS.RIGHT]) {
            player.x = player.x + speed;
        }

        //direction
        if (this.keys[KEYS.LEFT] && !this.keys[KEYS.RIGHT] && this.keys[KEYS.UP] === this.keys[KEYS.DOWN]){
            player.rotateGrad = 180;
        } else if (!this.keys[KEYS.LEFT] && this.keys[KEYS.RIGHT] && this.keys[KEYS.UP] === this.keys[KEYS.DOWN]) {
            player.rotateGrad = 0;
        } else if (this.keys[KEYS.LEFT] === this.keys[KEYS.RIGHT] && this.keys[KEYS.UP] && !this.keys[KEYS.DOWN]){
            player.rotateGrad = 270;
        } else if (this.keys[KEYS.LEFT] === this.keys[KEYS.RIGHT] && !this.keys[KEYS.UP] && this.keys[KEYS.DOWN]) {
            player.rotateGrad = 90;
        } else if (this.keys[KEYS.LEFT] && !this.keys[KEYS.RIGHT] && this.keys[KEYS.UP] && !this.keys[KEYS.DOWN]){
            player.rotateGrad = 225;
        } else if (this.keys[KEYS.LEFT] && !this.keys[KEYS.RIGHT] && !this.keys[KEYS.UP] && this.keys[KEYS.DOWN]) {
            player.rotateGrad = 135;
        } else if (!this.keys[KEYS.LEFT] && this.keys[KEYS.RIGHT] && this.keys[KEYS.UP] && !this.keys[KEYS.DOWN]){
            player.rotateGrad = 315;
        } else if (!this.keys[KEYS.LEFT] && this.keys[KEYS.RIGHT] && !this.keys[KEYS.UP] && this.keys[KEYS.DOWN]){
            player.rotateGrad = 45;
        }
        player.rotate = player.rotateGrad * Math.PI / 180;
        if (move) {
            if (!this.checkCollisions()) {
                this.io.emit('player movement', this.player);
            } else {
                player.x = tempPosition.x;
                player.y = tempPosition.y;
            }
        }
    }
    checkCollisions(){
        const rect1 = this.player;
        let colision = false;
        for(let id in this.players) {
            const rect2 = this.players[id];
            console.log('COOOOOOOOOOL')
            console.log(rect1.x, rect1.y, rect1.width, rect1.height);
            console.log(rect2.x, rect2.y, rect2.width, rect2.height);
            if(rect2.ioId !== rect1.ioId) {
                colision = rect1.x < rect2.x + rect2.width &&
                rect1.x + rect1.width > rect2.x &&
                rect1.y < rect2.y + rect2.height &&
                rect1.height + rect1.y > rect2.y;
                if (colision) break;
            }
        }
        console.log(colision);
        return colision;
    }
    drawPlayers(plDetails) {
        const players = this.players;
        if (plDetails) {
            console.log({plDetails});
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
        this.clear();
        for(const id in players) {
            players[id].draw(this.context, {x: players[id].x, y: players[id].y, rotate: players[id].rotate});
        }
    }
    loadEvents(){
        document.body.addEventListener('keydown', this.keyDownEvent.bind(this));
        document.body.addEventListener('keyup', this.keyUpEvent.bind(this));
        window.addEventListener('blur', this.leaveWindow.bind(this));
    }
    keyDownEvent(event) {
        console.log(event.key,':',event.keyCode)
        this.keys[event.keyCode] = true;
    }
    keyUpEvent(event) {
        this.keys[event.keyCode] = false;
        if(event.keyCode === KEYS.SPACE) this.createBullet();
    }
    leaveWindow() {
        for (const keyCode in this.keys) {
            this.keys[keyCode] = false;
        }
    }
    createBullet() {
        const player = this.player;
        let x, y, dirX, dirY;
        switch(this.player.rotateGrad) {
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
        /*if(!this.bullets.length) return;
        this.clear();
        this.drawPlayers()*/
        this.player.bullets.forEach(bullet => {
            bullet.x = bullet.x + (1 * bullet.dirX);
            bullet.y = bullet.y + (1 * bullet.dirY);
            this.io.emit('bullet movement', this.player);
        });
    }
}
export default Game;
