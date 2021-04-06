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
/*import {
    Bullet,
    _player
} from './gameClasses.js';*/
import { asyncRequest } from '../functions.js';
class GameStatus {
    constructor(canvas) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        window.canvas = this.canvas;
        window.context = this.context;
        window.drawMap = this.drawMap.bind(this);
        this.drawMapInterval();
        this.mouseEvent();
    }
    drawMapInterval() {
        
        const func = async () => {
            const data = (await asyncRequest({url: '/gameData', method: 'GET'})).response;
            console.log("data", data);
            this.backgroundCards = data.backgroundCards;
            this.players = data.players;
            this.drawMap();
        };
        setInterval(func, 1000);
    }
    drawMap() {
        new Rect(0,0,1920,1080,'#ffffff').draw(this.context)
        const absoluteValues = {
            x1:0,
            x2:0,
            y1:0,
            y2:0
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

        const xRelation = realWidth / this.canvas.width;
        const yRelation = realHeight / this.canvas.height;
        const biggerRelation = yRelation > xRelation ? yRelation : xRelation;


        for (const propX in this.backgroundCards) {
            const row = this.backgroundCards[propX];
            for (const propY in row) {
                const card = row[propY];
                const x = (card[0] - absoluteValues.x1) * 1920;
                const y = (card[1] - absoluteValues.y1) * 1080;
                new Rect(
                    x / xRelation,
                    y / yRelation,
                    1920 / xRelation,
                    1080 / yRelation,
                    '#1c2773'
                ).draw(this.context);
                card[2].forEach(point => {
                    new Arc(
                        (point[0] + x) / xRelation,
                        (point[1] + y) / yRelation, point[2] / biggerRelation, '#ffffff').draw(this.context);
                });
            }
        }

        const length = (this.canvas.width < this.canvas.height ? this.canvas.width : this.canvas.height) / 100;

        for(const sessionId in this.players) {
            const player = this.players[sessionId];
            console.log('Hey hey', player.x - absoluteValues.x1 * 1920, player.y - absoluteValues.y1 * 1080);
            const x = (player.x - absoluteValues.x1 * 1920) / xRelation;
            const y = (player.y - absoluteValues.y1 * 1080) / yRelation;
            const shapes = [
                new Arc(x, y, 10, '#ff0000'),
                new Text(player.name,x,y, length * 5, 'Arial', '#00FF00')
            ]
            new Layer('', shapes).draw(this.context);
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
