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
    Character,
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
            this.canvas = canvas;
            this.context = canvas.getContext('2d');

            this.ships = (await asyncRequest({url: '/game/getShips', method: 'GET'})).response;
            this.character = new Character(this.username, this.ships[0], 50, 50);
            this.io.emit('player movement', this.character);

            this.cleanBoard = new Rect(0, 0, canvas.width, canvas.height, '#ffffff', undefined, 0, 0);
            this.loadEvents();

            this.beginInterval();
            this.keys = [];
            this.characters = {}
            this.socketIOEvents();
        })();
    }
    socketIOEvents() {
        this.io.on('players updated',this.drawPlayers.bind(this));
        this.io.on('player leave', id => {
            delete this.character[id];
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
        const character = this.character;
        /*const tempPosition = {
            x: character.x,
            y: character.y,
            h: character.height,
            w: character.width,
            username: this.username
        }*/
        let move = this.keys[KEYS.UP] !== this.keys[KEYS.DOWN] || this.keys[KEYS.LEFT] !== this.keys[KEYS.RIGHT];
        let speed = this.keys[KEYS.SHIFT] ? 2 : 1;
        if (this.keys[KEYS.CTRL]) speed = speed / 2;
        if (this.keys[KEYS.UP]) {
            character.y = character.y - speed;
        }
        if (this.keys[KEYS.DOWN]) {
            character.y = character.y + speed;
        }
        if (this.keys[KEYS.LEFT]) {
            character.x = character.x - speed;
        }
        if (this.keys[KEYS.RIGHT]) {
            character.x = character.x + speed;
        }

        //direction
        if (this.keys[KEYS.LEFT] && !this.keys[KEYS.RIGHT] && this.keys[KEYS.UP] === this.keys[KEYS.DOWN]){
            character.rotate = 180 * Math.PI / 180;
        } else if (!this.keys[KEYS.LEFT] && this.keys[KEYS.RIGHT] && this.keys[KEYS.UP] === this.keys[KEYS.DOWN]) {
            character.rotate = 0;
        } else if (this.keys[KEYS.LEFT] === this.keys[KEYS.RIGHT] && this.keys[KEYS.UP] && !this.keys[KEYS.DOWN]){
            character.rotate = 270 * Math.PI / 180;
        } else if (this.keys[KEYS.LEFT] === this.keys[KEYS.RIGHT] && !this.keys[KEYS.UP] && this.keys[KEYS.DOWN]) {
            character.rotate = 90 * Math.PI / 180;///////
        } else if (this.keys[KEYS.LEFT] && !this.keys[KEYS.RIGHT] && this.keys[KEYS.UP] && !this.keys[KEYS.DOWN]){
            character.rotate = 225 * Math.PI / 180;
        } else if (this.keys[KEYS.LEFT] && !this.keys[KEYS.RIGHT] && !this.keys[KEYS.UP] && this.keys[KEYS.DOWN]) {
            character.rotate = 135 * Math.PI / 180;///////
        } else if (!this.keys[KEYS.LEFT] && this.keys[KEYS.RIGHT] && this.keys[KEYS.UP] && !this.keys[KEYS.DOWN]){
            character.rotate = 315 * Math.PI / 180;
        } else if (!this.keys[KEYS.LEFT] && this.keys[KEYS.RIGHT] && !this.keys[KEYS.UP] && this.keys[KEYS.DOWN]){
            character.rotate = 45 * Math.PI / 180;
        }
        
        if (move) {
            const collision = false;//this.checkCollisions();
            this.io.emit('player movement', this.character);
        }
        //character.x = tempPosition.x;
        //character.y = tempPosition.y;
    }
    drawPlayers(plDetails) {
        console.log({plDetails});
        this.clear();
        const characters = this.characters;
        if (!characters[plDetails.socketId]) {
            characters[plDetails.socketId] = new Character(plDetails.name, plDetails.ship);
        }
        characters[plDetails.socketId].x = plDetails.x;
        characters[plDetails.socketId].y = plDetails.y;
        characters[plDetails.socketId].rotate = plDetails.rotate;
        for(const id in characters) {
            characters[id].draw(this.context, {x: characters[id].x, y: characters[id].y, rotate: characters[id].rotate});
        }
    }
    loadEvents(){
        document.body.addEventListener('keydown', this.keyDownEvent.bind(this));
        document.body.addEventListener('keyup', this.keyUpEvent.bind(this));
    }
    keyDownEvent(event) {
        console.log(event.key,':',event.keyCode)
        this.keys[event.keyCode] = true;
    }
    keyUpEvent(event) {
        this.keys[event.keyCode] = false;
    }
}
export default Game;
