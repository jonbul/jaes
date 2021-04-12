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
    RadarArrow,
    _player
} from './gameClasses.js';
import { KEYS } from './constants.js';
import { asyncRequest } from '../functions.js';
import { Animation, getExplossionFrames } from './animationClass.js';
import gameSounds from './gameSounds.js';
let Player;
class Game {
    constructor(canvas, username, io, guest) {
        (async () => {
            this.radarZoom = 1;
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

            this.backgroundCards = [];
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
            } while (this.checkCollisionsWithPlayers());
            const tX = this.canvas.width / 2 - this.player.width / 2 - this.player.x;
            const tY = this.canvas.height / 2 - this.player.height / 2 - this.player.y;
            this.context.translate(tX, tY);
            this.player.ioId = this.io.id;
            this.io.emit('player movement', this.player.getSortDetails());

            this.beginInterval();
        })();
    }
    reloadPlayer() {
        const x = this.player.x;
        const y = this.player.y;

        do {
            this.player.x = parseInt(Math.random() * this.canvas.width - this.player.width);
            this.player.y = parseInt(Math.random() * this.canvas.height - this.player.height);
        } while (this.checkCollisionsWithPlayers());

        this.context.translate(x - this.player.x, y - this.player.y);
        this.io.emit('player movement', this.player.getSortDetails());
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
            if (this.player.isDead) return;
            if (this.player.life > 0) this.player.life--;
            if (!this.player.life) {
                this.io.emit('player died', msg);
                this.player.dead();
                this.io.emit('player movement', this.player.getSortDetails());
                setTimeout(() => {
                    this.player.hide = true;
                    this.io.emit('player movement', this.player.getSortDetails());
                    setTimeout(() => {
                        this.reloadPlayer();
                        this.player.hide = false;
                        this.player.life = 10;
                        this.player.isDead = false;
                        this.io.emit('player movement', this.player.getSortDetails());
                    }, 10000);
                }, 2000);
            }
        });
        this.io.on('player died', msg => {
            this.players[msg.playerId].deaths++;
            this.players[msg.from].kills++;
            const explossionFrames = getExplossionFrames();
            const explossion = new Animation({
                frames: explossionFrames.frames,
                layer: explossionFrames.layer,
                x: this.players[msg.playerId].x,
                y: this.players[msg.playerId].y,
                width: 100,
                height: 100
            });
            this.animations.push(explossion);
            explossion.play();
            gameSounds.explosion();
        });
        this.io.on('sound', msg => {
            gameSounds[msg.sound]();
        })
    }
    beginInterval() {
        setInterval(this.intervalMethod.bind(this), 1000 / 60);
    }
    intervalMethod() {

        this.fullScreen = window.innerHeight === screen.height;
        if (this.fullScreen) {
            document.body.classList.add('fullscreen');
        } else {
            document.body.classList.remove('fullscreen');
        }
        this.movement();
        this.bulletInterval();

        const viewRect = {
            x: this.player.x - (this.canvas.width / 2 - this.player.width / 2),
            y: this.player.y - (this.canvas.height / 2 - this.player.height / 2),
            width: this.canvas.width,
            height: this.canvas.height
        }
        this.viewRect = viewRect;

        requestAnimationFrame(this.drawAll.bind(this));
    }
    clear() {
        this.context.clearRect(this.player.x - this.canvas.width, this.player.y - this.canvas.height, this.canvas.width * 2, this.canvas.height * 2);
    }
    movement() {
        if (this.player.isDead) return;
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
            if (!this.checkCollisionsWithPlayers()) {
                this.context.translate(-moveX, -moveY);
                this.io.emit('player movement', this.player.getSortDetails());
            } else {
                player.x = tempPosition.x;
                player.y = tempPosition.y;
            }
        }

    }
    updateBullets(bulletDetails) {
        let bullet = this.bullets[bulletDetails.id];
        if (!bullet) {
            bullet = new Bullet(bulletDetails.socketId, bulletDetails.x, bulletDetails.y, bulletDetails.angle, bulletDetails.speed, bulletDetails.rotation);
            this.bullets[bulletDetails.id] = bullet;
        } else {
            bullet.updatePosition(bulletDetails.x, bulletDetails.y);
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
            players[plDetails.socketId].hide = plDetails.hide;
            players[plDetails.socketId].isDead = plDetails.isDead;
        }
    }
    drawAll() {
        this.clear();
        this.drawBackground(this.viewRect);
        for (const id in this.players) {
            if (this.checkRectsCollision(this.players[id], this.viewRect))
                if (!this.players[id].hide) this.players[id].draw(this.context);
        }
        for (const id in this.bullets) {
            if (this.checkArcRectCollision(this.bullets[id], this.viewRect)) {
                this.bullets[id].draw(this.context);
            }
        }
        this.player.draw(this.context);
        this.animations.forEach(anim => {
            if (anim.playing) {
                anim.drawFrame(this.context, this.checkRectsCollision(anim, this.viewRect));
            }
        });
        this.drawArrows();
        this.drawRadar();
        this.drawTexts();
    }
    drawBackground(viewRect) {
        const currentCard = {
            x: parseInt(this.player.x / this.canvas.width),
            y: parseInt(this.player.y / this.canvas.height)
        }
        if (this.player.x < 0) currentCard.x -= 1;
        if (this.player.y < 0) currentCard.y -= 1;
        const tempCardList = [
            [currentCard.x - 1, currentCard.y - 1],
            [currentCard.x - 1, currentCard.y],
            [currentCard.x - 1, currentCard.y + 1],
            [currentCard.x, currentCard.y - 1],
            [currentCard.x, currentCard.y],
            [currentCard.x, currentCard.y + 1],
            [currentCard.x + 1, currentCard.y - 1],
            [currentCard.x + 1, currentCard.y],
            [currentCard.x + 1, currentCard.y + 1]
        ]
        const data = [];
        tempCardList.forEach(card => {
            if (!this.backgroundCards[card[0]] || this.backgroundCards[card[0]][card[1]] === undefined) {
                data.push(card);
                this.backgroundCards[card[0]] = this.backgroundCards[card[0]] || [];
                this.backgroundCards[card[0]][card[1]] = false;
            }
        });
        if (data.length) {
            asyncRequest({ url: '/game/getBackgroundCards', method: 'POST', data }).then(newBgCards => {
                newBgCards.response.forEach(card => {
                    const shapes = [];
                    card[2].forEach(point => {
                        shapes.push(new Arc(
                            point[0] + card[0] * this.canvas.width,
                            point[1] + card[1] * this.canvas.height,
                            point[2],
                            '#ffffff'
                        ))
                    })
                    this.backgroundCards[card[0]][card[1]] = new Layer(
                        `${card[0]},${card[1]}`,
                        shapes
                    )
                })
            });
        }

        new Rect(
            this.canvas.width * (currentCard.x - 1),
            this.canvas.height * (currentCard.y - 1),
            this.canvas.width * 3,
            this.canvas.height * 3,
            '#1c2773'
        ).draw(this.context);

        const cords = [-1, 0, 1];
        cords.forEach(i => {
            cords.forEach(j => {
                const x = currentCard.x + i;
                const y = currentCard.y + j;
                if (this.backgroundCards[x] &&
                    this.backgroundCards[x][y] &&
                    this.backgroundCards[x][y].draw) {
                    this.backgroundCards[x][y].draw(this.context)
                }
            })
        });
    }
    drawArrows() {
        /****************************** */
        const rotationAxis = {}
        const player = this.player;
        if (window.debug) {
            rotationAxis.x = player.x + player.width / 2;
            rotationAxis.y = player.y + player.width / 2;
            new Arc(rotationAxis.x, rotationAxis.y, canvas.width * 0.01, '#00ff00').draw(this.context)
            new Rect(this.player.x, player.y, player.width, player.height, 'rgba(0,0,0,0)', '#00ff00', 2).draw(this.context)
        }

        /****************************** */
        for (const id in this.players) {
            const target = this.players[id];
            if (target !== player && !target.isDead && !this.checkRectsCollision(target, this.viewRect)) {
                if (window.debug) {
                    /****************************** */
                    const rotationAxis2 = {
                        x: target.x + target.width / 2,
                        y: target.y + target.width / 2
                    }
                    new Line([
                        { x: rotationAxis.x, y: rotationAxis.y },
                        { x: rotationAxis2.x, y: rotationAxis2.y },
                    ], '#ff0000').draw(this.context)
                    new Arc(rotationAxis2.x, rotationAxis2.y, canvas.width * 0.01, '#ff0000').draw(this.context);
                    new Rect(target.x, target.y, target.width, target.height, 'rgba(0,0,0,0)', '#ff0000', 2).draw(this.context);
                    /****************************** */
                }
                new RadarArrow(this.player, target, this.canvas).draw(this.context);
            }
        };
    }
    drawRadar() {
        const player = this.player;
        const r = this.canvas.width / 10;
        const x = player.x + (this.canvas.width / 2) - r;
        const y = player.y + (this.canvas.height / 2) - r;
        new Arc(x, y, r, 'rgba(0,0,0,0.5)', '#00ff00', 2).draw(this.context);
        new Arc(x, y, (r / 5) * 4, 'rgba(0,0,0,0)', '#00ff00', 2).draw(this.context);
        new Arc(x, y, (r / 5) * 3, 'rgba(0,0,0,0)', '#00ff00', 2).draw(this.context);
        new Arc(x, y, (r / 5) * 2, 'rgba(0,0,0,0)', '#00ff00', 2).draw(this.context);
        new Arc(x, y, (r / 5) * 1, 'rgba(0,0,0,0)', '#00ff00', 2).draw(this.context);
        new Line([{ x, y: y - r }, { x, y: y + r }], '#00ff00', 2).draw(this.context);
        new Line([{ x: x - r, y }, { x: x + r, y }], '#00ff00', 2).draw(this.context);

        const radarLength = this.canvas.width * (5 / this.radarZoom);

        for (const id in this.players) {
            const target = this.players[id];
            if (this.player !== target && !target.isDead) {
                const xLength = target.x - player.x;
                const yLength = target.y - player.y;
                const distance = Math.sqrt(Math.pow(xLength,2) + Math.pow(yLength,2));

                if (distance < radarLength) {
                    const radarX = (xLength * r / radarLength) + x;
                    const radarY = (yLength * r / radarLength) + y;
                    new Arc(radarX, radarY, canvas.width/300, 'rgba(255,0,0,0.7)').draw(this.context)
                }
            }
        };
    }
    drawTexts() {
        const texts = [
            `X: ${parseInt(this.player.x * 100) / 100}`,
            `Y: ${parseInt(this.player.y * 100) / 100}`,
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

        if (this.keys[KEYS.TAB] || this.player.isDead) {
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
            const topY = cornerY + 50;
            const topXL = cornerX + (this.canvas.width/7) * 2 - 25;
            const topXR = cornerX + ((this.canvas.width/7) * 5) + 25;
            let minY;
            const bgColors = ['rgba(0,0,0,0)', 'rgba(19,255,3,0.3)'];
            textRows.forEach((row, i) => {
                row.forEach((column, j) => {
                    text.text = column;
                    text.x = cornerX + (this.canvas.width/7) * (j + 2);
                    text.y = cornerY + 50 + 50 * (i + 1);
                    text.draw(this.context);
                    minY = text.y;        
                });
                new Rect(cornerX + (this.canvas.width/7) * 2 - 25, text.y - 25, (this.canvas.width/7)*3 + 50,50, bgColors[i%2],'#13ff03',2).draw(this.context)
            });
            
            new Line([
                {
                    x: cornerX + (this.canvas.width/7) * 3 - 25,
                    y: topY + 25
                },
                {
                    x: cornerX + (this.canvas.width/7) * 3 - 25,
                    y: minY + 25
                }],'#13ff03', 3).draw(this.context);
            new Line([
                {
                    x: cornerX + (this.canvas.width/7) * 4 - 25,
                    y: topY + 25
                },
                {
                    x: cornerX + (this.canvas.width/7) * 4 - 25,
                    y: minY + 25
                }],'#13ff03', 3).draw(this.context);
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
        this.shadowBackground = new Rect(0, 0, this.canvas.width, this.canvas.height, 'rgba(0,0,0,0.2)');
        this.animations = [];
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
        if (!this.player?.isDead && event.keyCode === KEYS.SPACE) {
            this.player.createBullet();
            const msg = this.player.getCenteredPosition();
            msg.sound = 'shot';
            this.io.emit('sound', msg);
        }
        if (event.keyCode === KEYS.PLUS && this.radarZoom > 1) {
            this.radarZoom--;
        } else if (event.keyCode === KEYS.MINUS && this.radarZoom < 5) {
            this.radarZoom++;
        }
    }
    leaveWindow() {
        for (const keyCode in this.keys) {
            this.keys[keyCode] = false;
        }
    }
    bulletInterval() {
        const bulletSpeed = 25;
        this.player.bullets = this.player.bullets.filter((bullet, i) => {
            bullet.moveStep();
            if (bullet.isExpired()) {
                this.io.emit('bullet remove', bullet.id);
                return false;
            } else {
                const playerHit = this.checkBulletCollision(bullet);
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
    checkBulletCollision(bullet) {
        let collision = false;
        let playerKilled;
        for (const id in this.players) {
            const player = this.players[id];
            if (player.socketId !== bullet.socketId) {
                collision = bullet.x > player.x && bullet.x < player.x + player.width && bullet.y > player.y && bullet.y < player.y + player.height;
                if (collision) {
                    playerKilled = player;
                    break;
                }
            }
        }
        return playerKilled;
    }
    checkCollisionsWithPlayers() {
        const rect1 = this.player;
        let collision = false;
        for (let id in this.players) {
            const rect2 = this.players[id];
            if (!rect2.isDead && rect2.socketId !== rect1.socketId) {
                collision = this.checkRectsCollision(rect1, rect2);
                if (collision) break;
            }
        }
        return collision;
    }
    checkRectsCollision(rect1, rect2) {
        return (rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.height + rect1.y > rect2.y);
    }
    checkArcRectCollision(arc, rect) {
        return this.checkRectsCollision(rect, {
            x: arc.x - (arc.radiusX || arc.radius),
            y: arc.y - (arc.radiusY || arc.radius),
            width: arc.radiusX * 2,
            height: arc.radiusY * 2
        });
        /*const rectCenter = {
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2,
        }
        const bc1 = rectCenter.x - arc.x;
        const bc2 = rectCenter.y - arc.y;
        const bh = Math.sqrt(Math.pow(bc1,2) + Math.pow(bc2,2), 2);
        const rectAlphaSen = bc2 / bh;
        const inRectAngle = Math.PI - Math.asin(rectAlphaSen);
        const inRectC1 = rect.height / 2;
        const inRectH = inRectC1 / Math.cos(inRectAngle);
        return inRectH + arc.radius > bh;*/
    }
}
export default Game;
