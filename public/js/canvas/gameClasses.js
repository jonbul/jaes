import {
    Ellipse,
    Picture,
    Polygon,
    Rect,
    Text
} from './canvasClasses.js';
import Forms from './canvasClasses.js';
import { parseLayers } from '../functions.js';

window.forms = Forms;
class Player {
    constructor(shipsManager, username, shipId, x = 0, y = 0, credits) {
        this.shipsManager = shipsManager;
        this.name = username;
        this.shipId = shipId;
        this.ship = shipsManager.getShipById(shipId);
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
        this.scale = 1;
        const debugEnabled = (typeof localStorage !== 'undefined') && localStorage.getItem('debug');
        if (debugEnabled) {
            console.log(`Player ${this.name} created with ship ${this.ship.name}`);
            console.log(this.ship);
        }
        this.picture = null;
        this.calculateScale();
    }
    draw_old(context) {
        if (this.hide) return;
        const rotationCenter = { x: this.ship.width / 2, y: this.ship.height / 2 };
        const layerOptions = {
            x: this.x + this.xTranslation,
            y: this.y + this.yTranslation,
            rotate: this.rotate,
            rotationCenter,
            scale: this.scale
        };

        for (const layer of this.layers) {
            layer.draw(context, layerOptions);
        }
        this.nameShape.x = layerOptions.x;
        this.nameShape.y = layerOptions.y - 20;
        this.nameShape.draw(context, { x: 0, y: 0 });
    }
    /**
     * Draws the player's ship on the canvas. If the ship is hidden, it returns without drawing. It calculates the real dimensions of the ship based on its scale and translation, and then calls drawPicture to render the ship using a pre-rendered picture for optimized performance. Finally, it draws the player's name above the ship.
     * @param {CanvasRenderingContext2D} context 
     */
    draw(context) {

        if (this.hide) return;
        const realDimension = this.getRealDimension();
        const rotationCenter = { x: realDimension.width / 2, y: realDimension.height / 2 };
        const layerOptions = {
            x: realDimension.x,
            y: realDimension.y,
            rotate: this.rotate,
            rotationCenter,
            scale: 1
        };

        this.drawPicture(context, layerOptions);

        this.nameShape.x = layerOptions.x;
        this.nameShape.y = layerOptions.y - 20;
        this.nameShape.draw(context, { x: 0, y: 0 });
    }
    /**
     * Draws the player's ship using vector graphics. This method is less optimized than drawPicture and is intended for drawing an unrotated ship at the origin using vector layers (e.g. for pre-rendering). It supports scaling via this.scale but always uses a rotation value of 0. It iterates through each layer of the ship and draws it according to these options.
     * @param {CanvasRenderingContext2D} context 
     */
    drawVectorial(context) {
        if (this.hide) return;
        const rotationCenter = { x: this.ship.width / 2, y: this.ship.height / 2 };
        const layerOptions = {
            x: 0,
            y: 0,
            rotate: 0,
            rotationCenter,
            scale: this.scale
        };

        for (const layer of this.layers) {
            layer.draw(context, layerOptions);
        }
        //this.nameShape.x = layerOptions.x;
        //this.nameShape.y = layerOptions.y - 20;
        //this.nameShape.draw(context, { x: 0, y: 0 });
    }
    /**
     * Draws the player's ship using a pre-rendered picture for optimized performance. If the picture is not yet rendered, it calls the render method to create it before drawing.
     * @param {CanvasRenderingContext2D} context 
     * @param {*} layerOptions 
     */
    drawPicture(context, layerOptions) {
        if (this.hide) return;
        if (!this.picture) {
            this.render();
        }
        this.picture.draw(context, layerOptions);
    }
    /**
     * Renders the player's ship into a picture for optimized drawing. This is called whenever the player's scale changes, to ensure the picture is up to date with the current size.
     */
    render() {
        if (!this.pictureCanvas) {
            this.pictureCanvas = document.createElement('canvas');
        }
        const realDimension = this.getRealDimension();
         const roundedWidth = Math.ceil(realDimension.width);
         const roundedHeight = Math.ceil(realDimension.height);
        this.pictureCanvas.width = roundedWidth;
        this.pictureCanvas.height = roundedHeight;
        // reset canvas
        const offscreenCanvas = this.pictureCanvas;
        const offscreenContext = offscreenCanvas.getContext('2d');
        offscreenContext.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
        this.drawVectorial(offscreenContext);
        this.picture = new Picture(offscreenCanvas, null, 0, 0, roundedWidth, roundedHeight, 0, 0, roundedWidth, roundedHeight);
    }
    /**
     * Calculates the scale of the player's ship based on a standard size and the player's kills and deaths. It adjusts the real width and height of the ship accordingly, as well as the translation needed to keep the ship centered. Finally, it calls render to update the picture with the new scale.
     * @param {number} sizeStandard 
     */
    calculateScale(sizeStandard = 100) {
        let scaleDec = 1;
        if (sizeStandard) {
            const baseSize = Math.max(this.width, this.height) || 1;
            const minSize = 10;
            const newSize = sizeStandard + (this.kills - this.deaths) * 10;
            const clampedSize = Math.max(minSize, newSize);
            scaleDec = clampedSize / baseSize;
        }

        this.realWidth = this.width * scaleDec;
        this.realHeight = this.height * scaleDec;

        this.xTranslation = (this.width - this.realWidth) / 2;
        this.yTranslation = (this.height - this.realHeight) / 2;
        this.scale = scaleDec;
        this.render();
    }
    /**
     * Returns the real dimensions of the player's ship, including the x and y position adjusted for translation, and the real width and height based on the current scale.
     * @returns {Object} An object containing the real dimensions of the player's ship, including the x and y position adjusted for translation, and the real width and height based on the current scale. This is used for accurate collision detection and drawing calculations.
     */
    getRealDimension() {
        return {
            x: this.x + this.xTranslation,
            y: this.y + this.yTranslation,
            width: this.realWidth,
            height: this.realHeight
        }
    }
    /**
     * Creates a new bullet object based on the player's current position, rotation, and speed. The bullet is initialized with the player's socket ID, starting position at the center of the ship, angle of rotation, and speed. The bullet is then added to the player's bullets array and returned for further processing (such as adding to the game world or sending to the server).
     */
    createBullet() {
        const realDimension = this.getRealDimension();
        let bPosX = realDimension.x + realDimension.width / 2;
        let bPosY = realDimension.y + realDimension.height / 2;
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
            scale: this.scale,
            xTranslation: this.xTranslation,
            yTranslation: this.yTranslation
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
        let colorHex = Math.ceil((Math.min(this.bulletCharge, 10) - 1) * 255 / 9).toString(16, 2)
        colorHex = colorHex.length === 1 ? "0" + colorHex : colorHex;
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
    getSortDetails() {
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

        const width = context.canvas.width / 20;
        const height = width / 5;

        let x = -Math.abs(player.width - width) / 2;
        if (player.width > width) {
            x *= -1;
        }
        const y = player.height + 10;

        this.border = new Rect(x, y, width, height, '#ffffff00', '#000000', 3, 0)
        this.bar = new Rect(x, y, 0, height, '#ff0000', '#000000', 0, 0)
    }

    draw(context, chargeRate) {
        if (!chargeRate) return;

        const player = this.player;

        const barWidth = this.border.width * chargeRate;
        this.bar.width = Math.min(barWidth, this.border.width);

        const options = { x: player.x, y: player.y };

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
        const yLength = (target.y + target.height / 2) - (player.y + player.height / 2);

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

        let multiplier = canvas.width * 1.5 - distance;
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
class ShipsManager {
    constructor(ships) {
        this.ships = ships;
        this.shipsById = {}
        ships.forEach(ship => {
            this.shipsById[ship._id] = ship;

            if (ship.canvas) {
                ship.width = ship.canvas.width
                ship.height = ship.canvas.height
            }
        })
    }
    getShips() {
        return this.ships;
    }
    getShipById(shipId) {
        return this.shipsById[shipId];
    }
    getGenericShips() {
        return this.ships.filter(s => !s.userId)
    }
}

export { Bullet, RadarArrow, ChargingBar, Player, ShipsManager }
export default { Bullet, RadarArrow, ChargingBar, Player, ShipsManager }
