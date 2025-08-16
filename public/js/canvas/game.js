'use strict';
import {
    Arc,
    Layer,
    Line,
    Rect,
    Text
/*    Rubber,
    ClickXY,
    Abstract,
    Ellipse,
    MasterJasonFile,
    Pencil,
    Picture,
    Polygon*/
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
import MessagesManager from './messagesManagerClass.js';
let Player;
class Game {
    constructor(canvas, username, io, guest, credits, isSmartphone) {
        window.game = this;
        this.isGuest = guest;
        this.isSmartphone = isSmartphone;
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
            this.player = new Player(this.username, parseInt(Math.random() * 5), 0, 0, credits);
            this.player.socketId = socket.id;
            this.players[socket.id] = this.player;

            this.drawableBullets = new Layer('bullets');
            this.drawablePlayers = new Layer('players');
            do {
                this.player.x = parseInt(Math.random() * this.canvas.width - this.player.width);
                this.player.y = parseInt(Math.random() * this.canvas.height - this.player.height);
            } while (this.checkCollisionsWithPlayers());
            const tX = this.canvas.width / 2 - this.player.width / 2 - this.player.x;
            const tY = this.canvas.height / 2 - this.player.height / 2 - this.player.y;
            this.context.translate(tX, tY);
            this.player.ioId = this.io.id;
            
            this.messagesManager = new MessagesManager(this);
            this.socketIOEvents();

            this.playerUpdated = true;
            this.beginInterval();
            this.io.emit('playerData', this.player.getSortDetails());
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
    }
    socketIOEvents() {
        this.io.on('gameBroadcast', this.gameBroadcast.bind(this));
        this.io.on('player leave', id => {
            delete this.players[id];
            this.updatePlayers();
        });
        const _this = this;
        this.io.on('player hit', msg => {
            if (this.player.isDead) return;
            if (this.player.life > 0) this.player.life--;
            if (!this.player.life) {
                this.io.emit('player died', msg);
                this.player.dead();
                setTimeout(() => {
                    this.player.hide = true;
                    this.playerUpdated = true;
                    setTimeout(() => {
                        this.playerUpdated = true;
                        this.reloadPlayer();
                        this.player.hide = false;
                        this.player.life = 10;
                        this.player.isDead = false;
                    }, 10000);
                }, 2000);
            }
            this.io.emit('removeBullet', msg.bulletId);
        });
        this.io.on('sendHome', () => location.href='/');
    }
    beginInterval() {
        setInterval(this.intervalMethod.bind(this), 1000/60);
    }
    toSmartphoneFullScreen(e) {
        if (this.isSmartphone) {
            document.body.requestFullscreen().then(n => {
                screen.orientation.lock('landscape')/* // o 'portrait'
                    .then(() => {
                        console.log('Orientación bloqueada')
                    })
                    .catch(err => console.error('No se pudo bloquear la orientación', err)*/
            });
        }
    }
    onPlayerDied(msg) {
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

        const fromName = this.players[msg.from].name;
        const diedName = this.players[msg.playerId].name;
        this.messagesManager.addKillMessage(fromName, diedName);
    }
    intervalMethod() {

        this.fullScreen = this.isSmartphone || window.innerHeight === screen.height || (screen.height - window.innerHeight) < 10;
        if (this.fullScreen) {
            document.body.classList.add('fullscreen');
        } else {
            document.body.classList.remove('fullscreen');
        }
        if (this.isSmartphone) {
            this.movementSmarphone();
            //this.movement();
        } else {
            this.movement();
        }
        this.bulletInterval();

        const viewRect = {
            x: this.player.x - (this.canvas.width / 2 - this.player.width / 2),
            y: this.player.y - (this.canvas.height / 2 - this.player.height / 2),
            width: this.canvas.width,
            height: this.canvas.height
        }
        this.viewRect = viewRect;


        this.drawablePlayers.shapes = [];
        for (const id in this.players) {
            if (this.checkRectsCollision(this.players[id], this.viewRect)) {
                if (!this.players[id].hide) this.drawablePlayers.shapes.push(this.players[id]);
            }
        }
        this.drawableBullets.shapes = [];
        for (const id in this.bullets) {
            const bullet = this.bullets[id];
            bullet.moveStep();
            if (this.socketId === bullet.socketId && bullet.isExpired()) {
                delete this.bullets[id];
            } else if (this.checkArcRectCollision(bullet, this.viewRect)) {
                this.drawableBullets.shapes.push(bullet);
            }
        }
        
        this.loadRadar();
        this.drawAll();
        
        if(this.playerUpdated || this.player.moving || this.player.speed) {
            this.io.emit('playerData', this.player.getSortDetails());
        }
        this.playerUpdated = false;
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
        this.player.moving = this.keys[KEYS.LEFT] || this.keys[KEYS.RIGHT];
        if (this.keys[KEYS.UP]) {
            player.speed += 0.2;
        }
        if (this.keys[KEYS.DOWN] && player.speed) {
            player.speed -= 0.2;
        }
        if (player.speed >= 50) player.speed = 50;
        if (player.speed < -20) player.speed = -20;

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
            } else {
                player.x = tempPosition.x;
                player.y = tempPosition.y;
            }
        }

    }
    movementSmarphone() {
        if (this.player.isDead) return;
        const player = this.player;
        const tempPosition = {
            x: player.x,
            y: player.y
        }
        
        player.speed = 0;
        if (this.deviceorientation) {
            if (screen.orientation.angle === 90) {
                player.speed = this.deviceorientation.gamma + 50;
                player.rotate += this.deviceorientation.beta / 1000
            } if (screen.orientation.angle === 270) {
                player.speed = -this.deviceorientation.gamma + 50;
                player.rotate += -this.deviceorientation.beta / 1000;
            }
        }

        if (player.speed >= 50) player.speed = 50;
        if (player.speed < -20) player.speed = -20;
        player.speed = player.speed || 0

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
            } else {
                player.x = tempPosition.x;
                player.y = tempPosition.y;
            }
        }
    }
    gameBroadcast(data) {
        const playersData = data.players;
        
        for(const idp in playersData) {
            if (playersData[idp].socketId !== this.player.socketId) {
                this.updatePlayers(playersData[idp]);
            } else if (this.player.credits < playersData[idp].credits) {
                this.players[idp].credits = playersData[idp].credits;
                this.player.credits = playersData[idp].credits;
            }
        }
        data.kills.forEach(this.onPlayerDied.bind(this));
        
        this.comingNewBullets(data.newBullets);
        data.bulletsToRemove.forEach(bulletId => {
            delete this.bullets[bulletId];
        });
    }
    comingNewBullets(newBullets) {
        newBullets.forEach(newBullet => {
            const bullet = new Bullet(
                newBullet.socketId,
                newBullet.x,
                newBullet.y,
                newBullet.angle,
                newBullet.shootingSpeed,
                newBullet.rotation,
                newBullet.radiusX,
                newBullet.radiusY
            );
            bullet.id = newBullet.id;
            this.bullets[bullet.id] = bullet;

            gameSounds['shot']();
        })
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
            players[plDetails.socketId].credits = plDetails.credits;
        }
    }
    drawAll() {
        this.clear();
        let translateX;
        let translateY;
        let globalRotation = this.player.rotate + 90 * Math.PI / 180;
        if (this.isSmartphone) {
            translateX = this.player.x + (this.player.width / 2)
            translateY = this.player.y + (this.player.height / 2)
            this.context.translate(translateX, translateY)
            this.context.rotate(-globalRotation)
            this.context.translate(-translateX, -translateY)
        } 
        this.drawBackground();
        this.drawableBullets.draw(this.context);
        this.drawablePlayers.draw(this.context);

        this.player.draw(this.context);
        this.animations.forEach(anim => {
            if (anim.playing) {
                anim.drawFrame(this.context, this.checkRectsCollision(anim, this.viewRect));
            }
        });
        this.drawArrows();
    
        if (this.isSmartphone) {
            this.context.translate(translateX, translateY)
            this.context.rotate(globalRotation)
            this.context.translate(-translateX, -translateY)
        }

        this.isSmartphone ? this.drawRadarSmartphone() : this.drawRadar();
        
        this.drawTexts();
    }
    drawBackground() {
        const currentCard = {
            x: parseInt(this.player.x / this.canvas.width),
            y: parseInt(this.player.y / this.canvas.height)
        }
        if (this.player.x < 0) currentCard.x -= 1;
        if (this.player.y < 0) currentCard.y -= 1;
        
        const tempCardList = []
        const n = 2;
        const data = [];
        for (var x = -n; x <= n; x++) {
            for (var y = -n; y <= n; y++) {
                const card = [currentCard.x + x, currentCard.y + y];

                if (!this.backgroundCards[card[0]] || !this.backgroundCards[card[0]][card[1]]) {
                    data.push(card);
                    this.backgroundCards[card[0]] = this.backgroundCards[card[0]] || [];
                    this.backgroundCards[card[0]][card[1]] = false;
                }
            }
        }

        if (data.length) { // TODO update to WebSocket
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
            this.canvas.width * (currentCard.x - n),
            this.canvas.height * (currentCard.y - n),
            this.canvas.width * (n * 2 + 1),
            this.canvas.height * (n * 2 + 1),
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
            const distance = parseInt(this.player.getDistanceToPlayer(target));
            const inScope = distance < this.canvas.width * 1.5;
            if (target !== player && inScope && !target.isDead && !this.checkRectsCollision(target, this.viewRect)) {
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
                const scope = {
                    from: this.canvas.width,
                    to: this.canvas.width * 2
                }
                new RadarArrow(this.player, target, this.canvas).draw(this.context, distance);
            }
        };
    }
    loadRadar() {
        const player = this.player;
        // r is radar scale
        const r = this.canvas.width / 10;
        const x = (this.canvas.width / 2) - r;
        const y = (this.canvas.height / 2) - r;
        if (!this.radar) {
            const shapes = [
                new Arc(x, y, r, 'rgba(0,0,0,0.5)', '#00ff00', 2),
                new Arc(x, y, (r / 5) * 4, 'rgba(0,0,0,0)', '#00ff00', 2),
                new Arc(x, y, (r / 5) * 3, 'rgba(0,0,0,0)', '#00ff00', 2),
                new Arc(x, y, (r / 5) * 2, 'rgba(0,0,0,0)', '#00ff00', 2),
                new Arc(x, y, (r / 5) * 1, 'rgba(0,0,0,0)', '#00ff00', 2),
                new Line([{ x, y: y - r }, { x, y: y + r }], '#00ff00', 2),
                new Line([{ x: x - r, y }, { x: x + r, y }], '#00ff00', 2)
            ];
            this.radar = new Layer('Radar', shapes);
        }

        // alncance del radar
        const radarScope = this.canvas.width * (10 / this.radarZoom);
        this.radarPoints = [];
        for (const id in this.players) {
            const target = this.players[id];
            if (this.player !== target && !target.isDead) {
                const xLength = target.x - player.x;
                const yLength = target.y - player.y;
                const distance = this.player.getDistanceToPlayer(target);

                if (distance < radarScope) {
                    const radarX = (xLength * r / radarScope) + x;
                    const radarY = (yLength * r / radarScope) + y;
                    // Coordenadas respecto al centro del radar
                    this.radarPoints.push({x: radarX, y: radarY});
                }
            } 
        };
    }
    drawRadar() {
        this.radar.draw(this.context, {x: this.player.x, y: this.player.y});
        const arcPoint = new Arc(0, 0, canvas.width / 300, 'rgba(255,0,0,0.7)');
        this.radarPoints.forEach(point => {
            arcPoint.x = point.x + this.player.x;
            arcPoint.y = point.y + this.player.y;
            arcPoint.draw(this.context);
        })
    }
    drawRadarSmartphone() {
        const rotationCenter = this.isSmartphone ? {x: this.radar.shapes[0].x, y: this.radar.shapes[0].y} : {};
        const rotate = this.isSmartphone ? (-this.player.rotate - 90 * Math.PI / 180) : 0;
        const options = {
            x: this.player.x,
            y: this.player.y,
            rotate,
            rotationCenter
        }
        this.radar.draw(this.context, options);
        
        const arcPoint = new Arc(0, 0, canvas.width / 300, 'rgba(255,0,0,0.7)');        
        this.radarPoints.forEach(point => {
            
            arcPoint.x = point.x
            arcPoint.y = point.y
            arcPoint.draw(this.context, options);
        });
    }
    drawTexts() {
        const texts = [
            `X: ${parseInt(this.player.x * 100) / 100}`,
            `Y: ${parseInt(this.player.y * 100) / 100}`,
            `Speed: ${parseInt(this.player.speed * 100) / 100}`,
            `Rotation: ${parseInt(this.player.rotate * 360 / (2 * Math.PI))}º`,];
        const cornerX = this.player.x - this.canvas.width / 2 + this.player.width / 2;
        const cornerY = this.player.y - this.canvas.height / 2 + this.player.height / 2;
        const textX = cornerX + this.lineHeight;
        const textY = cornerY + this.lineHeight;
        texts.forEach((text, i) => {
            this.playerInfo.shapes[i].text = text;
            this.playerInfo.shapes[i].x = textX;
            this.playerInfo.shapes[i].y = textY + this.lineHeight * i;
        });
        this.playerInfo.draw(this.context);

        this.lifeText.text = `Health: ${this.player.life}`;
        this.lifeText.x = cornerX + this.canvas.width - (this.lifeText.text.length * this.fontSize / 2);
        this.lifeText.y = textY;
        this.lifeText.draw(this.context);

        this.creditsText.text = `Credits: ${this.player.credits || 0}`;
        this.creditsText.x = cornerX + this.canvas.width - (this.creditsText.text.length * this.fontSize / 2);
        this.creditsText.y = textY + this.lineHeight;
        this.creditsText.draw(this.context);

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
            const text = new Text('', 0, 0, this.fontSize / 2, 'Digitek', '#13ff03');
            const topY = cornerY + this.lineHeight;

            let minY;
            const bgColors = ['rgba(0,0,0,0)', 'rgba(19,255,3,0.3)'];
            textRows.forEach((row, i) => {
                row.forEach((column, j) => {
                    text.text = column;
                    text.x = cornerX + (this.canvas.width / 7) * (j + 2);
                    text.y = cornerY + this.lineHeight + this.lineHeight * (i + 1);
                    text.draw(this.context);
                    minY = text.y;
                });
                new Rect(cornerX + (this.canvas.width / 7) * 2 - this.lineHeight / 2, text.y - this.lineHeight / 2, (this.canvas.width / 7) * 3 + this.lineHeight, this.lineHeight, bgColors[i % 2], '#13ff03', 2).draw(this.context)
            });

            new Line([
                {
                    x: cornerX + (this.canvas.width / 7) * 3 - this.lineHeight / 2,
                    y: topY + this.lineHeight / 2
                },
                {
                    x: cornerX + (this.canvas.width / 7) * 3 - this.lineHeight / 2,
                    y: minY + this.lineHeight / 2
                }], '#13ff03', 3).draw(this.context);
            new Line([
                {
                    x: cornerX + (this.canvas.width / 7) * 4 - this.lineHeight / 2,
                    y: topY + this.lineHeight / 2
                },
                {
                    x: cornerX + (this.canvas.width / 7) * 4 - this.lineHeight / 2,
                    y: minY + this.lineHeight / 2
                }], '#13ff03', 3).draw(this.context);
        }
        this.messagesManager.draw();
    }
    createStaticCanvas() {
        this.fontSize = this.canvas.width / 1920 * 40;
        this.lineHeight = this.canvas.width / 1920 * (40 + 10);
        const fontSize = this.fontSize;

        this.playerInfo = new Layer('Player Info', [
            new Text('', 0, 0, fontSize, 'Arcade', '#13ff03'),
            new Text('', 0, 0, fontSize, 'Arcade', '#13ff03'),
            new Text('', 0, 0, fontSize, 'Arcade', '#13ff03'),
            new Text('', 0, 0, fontSize, 'Arcade', '#13ff03')
        ]);

        this.lifeText = new Text('', 0, 0 + 150, this.fontSize, 'Arcade', '#13ff03');
        this.creditsText = new Text('', 0, this.lineHeight + 150, this.fontSize, 'Arcade', '#13ff03');

        this.shadowBackground = new Rect(0, 0, this.canvas.width, this.canvas.height, 'rgba(0,0,0,0.2)');
        this.animations = [];
    }
    loadEvents() {
        document.body.addEventListener('keydown', this.keyDownEvent.bind(this));
        document.body.addEventListener('keyup', this.keyUpEvent.bind(this));
        window.addEventListener('blur', this.leaveWindow.bind(this));
        if (this.isSmartphone) {
            
            document.body.addEventListener('touchend', this.screenTouchEvent.bind(this));
            
            window.onorientationchange = this.toSmartphoneFullScreen.bind(this);
            
            addEventListener("deviceorientation", (e) => {
                this.deviceorientation = e
            })

            /*
            if (location.host.indexOf(3000) > 0) {
                const div = document.createElement("div")
                div.style.position = "absolute"
                div.style.display = "block"
                div.style.height = "60px";
                div.style.width = "100%";
                div.style.top = "0";
                div.style.left = "0";
                div.style.backgroundColor  = "#fff";
                document.body.appendChild(div)

                function log() {
                    let deviceorientation = this.deviceorientation;
                    //let gyroscope = this.gyroscope;
                    let text = ""
                    if (deviceorientation && deviceorientation.alpha)
                        text += `deviceorientation a: ${deviceorientation.alpha.toFixed(2)}, b: ${deviceorientation.beta.toFixed(2)}, c: ${deviceorientation.gamma.toFixed(2)}`
                    //if (gyroscope && gyroscope.x)
                    //    text += `\ngyroscope x: ${gyroscope.x.toFixed(2)}, y: ${gyroscope.y.toFixed(2)}, z: ${gyroscope.z.toFixed(2)}`

                    text += `\nrotate:  ${this.player ? this.player.rotate : 0}`
                    div.innerText = text;
                }
                setInterval(log.bind(this), 1)
            }/**/
        }

    }
    keyDownEvent(event) {
        this.keys[event.keyCode] = true;
        if (this.keys[KEYS.TAB]) {
            event.preventDefault();
        }
    }
    keyUpEvent(event) {
        this.keys[event.keyCode] = false;
        if (this.player && !this.player.isDead && event.keyCode === KEYS.SPACE) {
            this.newBullet()
        }
        if (event.keyCode === KEYS.PLUS && this.radarZoom > 1) {
            this.radarZoom--;
        } else if (event.keyCode === KEYS.MINUS && this.radarZoom < 10) {
            this.radarZoom++;
        }
    }
    screenTouchEvent(e) {
        this.newBullet()
    }
    newBullet(){
        const bullet = this.player.createBullet();
        const msg = this.player.getCenteredPosition();
        msg.bullet = bullet.getSortDetails();
        this.io.emit('newBullet', msg);
    }
    leaveWindow() {
        for (const keyCode in this.keys) {
            this.keys[keyCode] = false;
        }
    }
    bulletInterval() {
        let bulletsUpdated = false;
        this.player.bullets = this.player.bullets.filter((bullet, i) => {
            bullet.moveStep();
            if (bullet.isExpired()) {
                delete this.player.bullets[bullet.id];
                bulletsUpdated = true;
                return false;
            } else {
                const playerHit = this.checkBulletCollision(bullet);
                if (playerHit) {
                    this.io.emit('player hit', {
                        bulletId: bullet.id,
                        playerId: playerHit.socketId,
                        from: this.player.socketId
                    });
                    delete this.player.bullets[bullet.id];
                    bulletsUpdated = true;
                    return false;
                } else {
                    return true;
                }
            }

        });
        return bulletsUpdated;
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
    /**
     * Check collisions with other players
     * 
     * @returns 
     */
    checkCollisionsWithPlayers() {
        const rect1 = this.player;
        let collision = false;

        const cellSize = Math.max(rect1.width, rect1.height);
        const playerXB = Math.floor(rect1.x / cellSize)
        const playerYB = Math.floor(rect1.y / cellSize)
        const validValues = [1, 0, -1]
        for (let id in this.players) {
            const rect2 = this.players[id];

            if (rect2.isDead || rect2.socketId === rect1.socketId) {
                continue;
            }
            const rect2XB = parseInt(rect2.x / cellSize)
            const rect2YB = parseInt(rect2.y / cellSize)

            // in same area
            if (Math.abs(playerXB - rect2XB) <= 1 && Math.abs(playerYB - rect2YB) <= 1) {
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
    }
}
export default Game;
