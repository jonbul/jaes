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
    //Bullet,
    _player
} from './gameClasses.js';
import { asyncRequest } from '../functions.js';
class GameStatus {
    constructor(canvas) {
        const _this = this;
        (async function () {
            _this.Player = await _player;
            _this.drawMapInterval();
        })();
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        window.canvas = this.canvas;
        window.context = this.context;
        window.drawMap = this.drawMap.bind(this);
        this.mouseEvent();
    }
    drawMapInterval() {
        const func = async () => {
            const data = (await asyncRequest({ url: '/gameData', method: 'GET' })).response;
            this.backgroundCards = data.backgroundCards;
            this.players = data.players;
            this.drawMap();
        };
        setInterval(func, 1000);
    }
    drawMap() {
        new Rect(0, 0, 1920, 1080, '#ffffff').draw(this.context)
        const absoluteValues = {
            x1: 0,
            x2: 0,
            y1: 0,
            y2: 0
        };

        for (const propX in this.backgroundCards) {
            const row = this.backgroundCards[propX];
            for (const propY in row) {
                const card = row[propY];
                const cardPos = {
                    x: card[0],
                    y: card[1]
                }
                if (cardPos.x < absoluteValues.x1) {
                    absoluteValues.x1 = cardPos.x;
                } else if (cardPos.x > absoluteValues.x2) {
                    absoluteValues.x2 = cardPos.x;
                }
                if (cardPos.y < absoluteValues.y1) {
                    absoluteValues.y1 = cardPos.y;
                } else if (cardPos.y > absoluteValues.y2) {
                    absoluteValues.y2 = cardPos.y;
                }
            }
        }
        const realWidth = (absoluteValues.x2 - absoluteValues.x1) * 1920 + 1920;
        const realHeight = (absoluteValues.y2 - absoluteValues.y1) * 1080 + 1080;

        const yScale = realHeight / this.canvas.height;
        const xScale = realWidth / this.canvas.width;
        const biggerRelation = xScale > yScale ? xScale : yScale;


        for (const propX in this.backgroundCards) {
            const row = this.backgroundCards[propX];
            for (const propY in row) {
                const card = row[propY];
                const x = (card[0] - absoluteValues.x1) * 1920;
                const y = (card[1] - absoluteValues.y1) * 1080;
                new Rect(
                    x / biggerRelation,
                    y / biggerRelation,
                    1920 / biggerRelation,
                    1080 / biggerRelation,
                    '#1c2773'
                ).draw(this.context);
                card[2].forEach(point => {
                    new Arc(
                        (point[0] + x) / biggerRelation,
                        (point[1] + y) / biggerRelation, point[2] / biggerRelation, '#ffffff').draw(this.context);
                });
            }
        }

        const length = (this.canvas.width < this.canvas.height ? this.canvas.width : this.canvas.height) / 100;
        for (const sessionId in this.players) {
            const player = this.players[sessionId];
            if (!player.isDead) {
                const x = (player.x - absoluteValues.x1 * 1920) / biggerRelation;
                const y = (player.y - absoluteValues.y1 * 1080) / biggerRelation;
                const pl = new this.Player(player.name, player.shipId, x, y);
                pl.rotate = player.rotate;
                pl.draw(this.context);
                console.log(pl);
            }
        }
    }
    mouseEvent() {
        const block = document.createElement('div');
        block.style.position = 'absolute';
        block.style.display = 'none';
        block.style.backgroundColor = '#ffffff';
        block.style.border = 'solid 1px #000';
        document.body.appendChild(block);
        this.canvas.addEventListener('mousemove', evt => {
            block.style.display = 'block';
            const x = parseInt(evt.layerX * evt.target.width / evt.target.clientWidth);
            const y = parseInt(evt.layerY * evt.target.height / evt.target.clientHeight);

            block.innerText = `x: ${x}, y: ${y}`;
            block.style.top = evt.clientY + 'px';
            block.style.left = (evt.clientX + 20) + 'px';
        });
        this.canvas.addEventListener('mouseout', evt => {
            block.style.display = 'none';
        });
    }
}
export default GameStatus;
