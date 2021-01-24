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
import { parseLayers, asyncRequest } from '../functions.js';
let ships;

class Player {
    constructor(username, shipId, x = 0, y = 0) {
        this.name = username;
        this.shipId = shipId;
        this.ship = ships[shipId];
        this.layers = parseLayers(this.ship.layers);
        this.x = x;
        this.y = y;
        this.nameShape = new Text(this.name, this.x, this.y - 10, 30, 'Helvetica', '#ffffff');
        this.width = this.ship.width;
        this.height = this.ship.height;
        this.rotate = 0;
        this.bullets = [];
        this.life = 10;
        this.deaths = 0;
        this.kills = 0;
        this.speed = 0;
        this.hide = false;
        this.isDead = false;
    }
    draw(context) {
        if (this.hide) return;
        const rotationCenter = { x: this.ship.width / 2, y: this.ship.height / 2 };
        this.layers.forEach(layer => {
            layer.draw(context, { x: this.x, y: this.y, rotate: this.rotate, rotationCenter });
        });
        this.nameShape.draw(context, { x: this.x, y: this.y });
    }
    createBullet() {
        let bPosX = this.x + this.width / 2;
        let bPosY = this.y + this.height / 2;
        this.bullets.push(new Bullet(this.socketId, bPosX, bPosY, this.rotate));
    }
    dead() {
        this.isDead = true;
        this.speed = 0;
    }
    getSortDetails() {
        return {
            x: this.x,
            y: this.y,
            name: this.name,
            rotate: this.rotate,
            life: this.life,
            kills: this.kills,
            deaths: this.deaths,
            shipId: this.shipId,
            hide: this.hide,
            isDead: this.isDead
        }
    }
    getCenteredPosition() {
        return {
            x: this.x + (this.width / 2),
            y: this.y + (this.height / 2)
        }
    }
}
class Bullet {
    constructor(socketId, x, y, angle) {
        this.socketId = socketId;
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.id = socketId + '-' + Date.now();
        this.range = 2000;


        const quad = parseInt(this.angle / (Math.PI / 2));

        this.moveX = Math.abs(Math.cos(angle));
        this.moveY = Math.abs(Math.sin(angle));
        switch (quad) {
            case 0:
                break;
            case 1:
                this.moveX *= -1;
                break;
            case 2:
                this.moveY *= -1;
                this.moveX *= -1;
                break;
            case 3:
                this.moveY *= -1;
                break;
        }
        this.expX = this.moveX * this.range + this.x;
        this.expY = this.moveY * this.range + this.y;

        this.arc = new Arc(this.x, this.y, 5, '#ff0000');
        console.log(this.moveX, this.moveY)
    }
    draw(context) {
        this.arc.x = this.x;
        this.arc.y = this.y;
        this.arc.draw(context);
    }
    isExpired() {
        return this.moveX > 0 && this.x > this.expX ||
            this.moveX < 0 && this.x < this.expX ||
            this.moveY > 0 && this.y > this.expY ||
            this.moveY < 0 && this.y < this.expY
    }
    getSortDetails() {
        return {
            x: this.x,
            y: this.y,
            angle: this.angle,
            expx: this.expX,
            expY: this.expY,
            moveX: this.moveX,
            moveY: this.moveY,
            id: this.id
        }
    }
}

const _player = new Promise(async function (resolve) {
    ships = (await asyncRequest({ url: '/game/getShips', method: 'GET' })).response;
    resolve(Player);
});

export { Bullet, _player }
export default { Bullet, _player }
