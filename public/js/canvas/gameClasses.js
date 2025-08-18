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
} from './canvasClasses.js'; import Forms from './canvasClasses.js';
import { parseLayers, asyncRequest } from '../functions.js';
let ships;
window.forms = Forms;
class Player {
    constructor(username, shipId, x = 0, y = 0, credits) {
        this.name = username;
        this.shipId = shipId;
        this.ship = ships[shipId];
        this.credits = credits || 0;
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
        this.nameShape.x = this.x;
        this.nameShape.y = this.y;
        this.nameShape.draw(context, { x: 0, y: -(this.width / 4) });
    }
    createBullet() {
        let bPosX = this.x + this.width / 2;
        let bPosY = this.y + this.height / 2;
        const bullet = new Bullet(this.socketId, bPosX, bPosY, this.rotate, this.speed, this.rotate);
        this.bullets.push(bullet);
        return bullet;
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
            credits: this.credits,
            rotate: this.rotate,
            life: this.life,
            kills: this.kills,
            deaths: this.deaths,
            shipId: this.shipId,
            hide: this.hide,
            isDead: this.isDead,
            //bullets: this.bullets.map(bullet => bullet.getSortDetails())
        }
    }
    getDistanceToPlayer(player) {
        const xLength = this.x - player.x;
        const yLength = this.y - player.y;
        return Math.sqrt(Math.pow(xLength, 2) + Math.pow(yLength, 2));
    }
    getCenteredPosition() {
        return {
            x: this.x + (this.width / 2),
            y: this.y + (this.height / 2)
        }
    }
}
class Bullet {
    constructor(socketId, x, y, angle, shootingSpeed = 0, rotation, radiusX = 25, radiusY = 5, bulletCharge = 1) {
        this.socketId = socketId;
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.id = socketId + '-' + Date.now();
        this.range = 5000;
        this.shootingSpeed = shootingSpeed;
        this.speed = (25 * 1.5) + shootingSpeed;
        this.radiusX = radiusX;
        this.radiusY = radiusY;
        this.rotation = rotation;
        this.bulletCharge = bulletCharge;


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

        const extraRadiusX = (this.bulletCharge - 1) * this.radiusX / 2;
        const extraRadiusY = (this.bulletCharge - 1) * this.radiusY / 2;
        let colorHex = Math.ceil((Math.min(this.bulletCharge, 10) - 1) * 255 / 9).toString(16,2)
        colorHex = colorHex.length == 1 ? "0" + colorHex : colorHex;
        console.log({colorHex})
        this.arc = new Ellipse(this.x, this.y, this.radiusX + extraRadiusX, this.radiusY + extraRadiusY, this.rotation, `#ff${colorHex}${colorHex}cc`)
    }
    updatePosition(x, y) {
        this.x = x;
        this.y = y;
        this.arc.x = x;
        this.arc.y = y;
    }
    draw(context) {
        this.arc.draw(context);
    }
    isExpired() {
        return this.moveX > 0 && this.x > this.expX ||
            this.moveX < 0 && this.x < this.expX ||
            this.moveY > 0 && this.y > this.expY ||
            this.moveY < 0 && this.y < this.expY
    }
    moveStep() {
        this.x += (this.speed * this.moveX);
        this.y += (this.speed * this.moveY);
        this.arc.x = this.x;
        this.arc.y = this.y;
    }
    getSortDetails(bulletCharge) {
        return {
            x: this.x,
            y: this.y,
            angle: this.angle,
            expx: this.expX,
            expY: this.expY,
            moveX: this.moveX,
            moveY: this.moveY,
            id: this.id,
            rotation: this.rotation,
            shootingSpeed: this.shootingSpeed,
            bulletCharge: this.bulletCharge
        }
    }
}

class ChargingBar {
    constructor(player, context) {
        this.player = player;

        const canvas = context.canvas;

        const width = context.canvas.width / 20;
        const height = width / 5;
        const x = -Math.abs(player.width - width) / 2
        const y = player.height + 10;

        this.border = new Rect(x, y, width, height, '#ffffff00', '#000000', 3, 0)
        this.bar = new Rect(x, y, 0, height, '#ff0000', '#000000', 0, 0)
    }

    draw(context, bulletChargeTs) {
        if (!bulletChargeTs) return
        
        const player = this.player;
        const width = player.width;

        const bulletCharge = (Date.now() - bulletChargeTs) / 1000;
        const barWidth = bulletCharge * width / 10;
        this.bar.width = Math.min(barWidth, this.border.width);
        
        const options = {x: player.x, y: player.y};
        
        this.bar.draw(context, options);
        this.border.draw(context, options);
    }
}

class RadarArrow {
    constructor(player, target) {
        this.player = player;
        this.target = target;
    }
    getDistance() {
        const target = this.target;
        const player = this.player;
        const xLength = (target.x + target.width / 2) - (player.x + player.width / 2);
        const yLength = (target.y + target.width / 2) - (player.y + player.width / 2);

        this.totalDistance = Math.sqrt(xLength ^ 2 + yLength ^ 2);

        if (xLength > 0 && yLength > 0) {
            this.angleRadian = Math.abs(Math.atan(yLength / xLength));
            this.arrowDir = { x: 1, y: 1 };
        } else if (xLength < 0 && yLength > 0) {
            this.angleRadian = Math.abs(Math.atan(xLength / yLength)) + Math.PI / 2;
            this.arrowDir = { x: -1, y: 1 };
        } else if (xLength < 0 && yLength < 0) {
            this.angleRadian = Math.abs(Math.atan(yLength / xLength)) + Math.PI;
            this.arrowDir = { x: -1, y: -1 };
        } else {
            this.angleRadian = Math.abs(Math.atan(xLength / yLength)) + Math.PI * 1.5;
            this.arrowDir = { x: 1, y: -1 };
        }
    }
    draw(context, distance) {
        this.getDistance();
        const canvas = context.canvas;

        let multiplier = canvas.width*1.5 - distance;
        multiplier = multiplier < 0 ? 0 : multiplier;

        const points = [
            { x: 0, y: 0 },
            { x: multiplier * 0.04, y: multiplier * 0.01 },
            { x: 0, y: multiplier * 0.02 },
            { x: multiplier * 0.01, y: multiplier * 0.01 }
        ];

        const arrowDistanceX = this.player.width / 2
        const arrowDistanceY = this.player.width / 2

        points.forEach(point => {
            point.x += this.player.x + arrowDistanceX + multiplier * 0.04;
            point.y += this.player.y + arrowDistanceY - multiplier * 0.01;
        })
        const rotationCenter = {
            x: this.player.x + this.player.width / 2,
            y: this.player.y + this.player.width / 2
        }
        new Polygon(points, '#ff0000').draw(context, { rotationCenter, rotate: this.angleRadian });
    }
}

const _player = new Promise(async function (resolve) {
    ships = (await asyncRequest({ url: '/game/getShips', method: 'GET' })).response;
    resolve(Player);
});

export { Bullet, RadarArrow, ChargingBar, _player }
export default { Bullet, RadarArrow, ChargingBar, _player }
