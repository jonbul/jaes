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
    constructor(canvasWidth, canvasHeight) {
        const _this = this;
        (async function () {
            _this.Player = await _player;
            _this.drawMapInterval();
        })();
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight
        this.canvas = document.getElementById('canvas');
        this.context = canvas.getContext('2d');
        this.backgroundCards = {};
        window.backgroundCards = this.backgroundCards;
        this.backgroundCardsSorted = {};
        window.canvas = this.canvas;
        window.context = this.context;
        window.drawMap = this.drawMap.bind(this);
        this.mouseEvent();
    }
    drawMapInterval() {
        const func = async () => {
            
            const data = (await asyncRequest({ url: '/gameData', method: 'POST', data: this.backgroundCardsSorted })).response;
            this.players = data.players;
            this.drawMap(data.resultCards);
        };
        setInterval(func, 1000);
    }
    drawMap(resultCards) {
        new Rect(0, 0, this.canvasWidth, this.canvasHeight, '#ffffff').draw(this.context)
        const absoluteValues = {
            x1: 0,
            x2: 0,
            y1: 0,
            y2: 0
        };
        this.absoluteValues = absoluteValues;

        for (const propX in resultCards) {
            const row = resultCards[propX];
            for (const propY in row) {
                const card = row[propY];
                this.backgroundCards[propX] = this.backgroundCards[propX] || {};
                this.backgroundCards[propX][propY] = card;
                this.backgroundCardsSorted[propX] = this.backgroundCardsSorted[propX] || {};
                this.backgroundCardsSorted[propX][propY] = true;
            }
        }
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
        this.realWidth = (absoluteValues.x2 - absoluteValues.x1) * this.canvasWidth + this.canvasWidth;
        this.realHeight = (absoluteValues.y2 - absoluteValues.y1) * this.canvasHeight + this.canvasHeight;

        const yScale = this.realHeight / this.canvas.height;
        const xScale = this.realWidth / this.canvas.width;
        const biggerRelation = xScale > yScale ? xScale : yScale;
        this.biggerRelation = biggerRelation;

        for (const propX in this.backgroundCards) {
            const row = this.backgroundCards[propX];
            for (const propY in row) {
                const card = row[propY];
                const x = (card[0] - absoluteValues.x1) * this.canvasWidth;
                const y = (card[1] - absoluteValues.y1) * this.canvasHeight;
                new Rect(
                    x / biggerRelation,
                    y / biggerRelation,
                    this.canvasWidth / biggerRelation,
                    this.canvasHeight / biggerRelation,
                    '#1c2773'
                ).draw(this.context);
            }
        }

        const length = (this.canvas.width < this.canvas.height ? this.canvas.width : this.canvas.height) / 100;
        for (const sessionId in this.players) {
            const player = this.players[sessionId];
            if (!player.isDead) {
                const x = (player.x - absoluteValues.x1 * this.canvasWidth) / biggerRelation;
                const y = (player.y - absoluteValues.y1 * this.canvasHeight) / biggerRelation;
                const pl = new this.Player(player.name, player.shipId, x, y);
                pl.rotate = player.rotate;
                pl.draw(this.context);
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
            if (!this.absoluteValues) return
            block.style.display = 'block';
            const x = parseInt(evt.layerX * this.realWidth / evt.target.clientWidth) + this.absoluteValues.x1 * this.canvasWidth;
            const y = parseInt(evt.layerY * this.realHeight / evt.target.clientHeight) + this.absoluteValues.y1 * this.canvasHeight;

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
