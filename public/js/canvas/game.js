'use strict';
import {
    Arc,
    ClickXY,
    ClosedPencil,
    Ellipse,
    Layer,
    Line,
    MasterJasonFile,
    Pencil,
    Picture,
    Poligon,
    Rect,
    Rubber,
    Character,
    Text
} from './canvasClasses.js';
import canvasClasses from './canvasClasses.js';
import { KEYS } from './constants.js';

class Game {
    constructor(canvas, username, io) {
        window.game = this;
        this.username = username
        this.io = io;
        if (!canvas instanceof HTMLCanvasElement) {
            throw 'Paramete 1 must be a Canvas HTML Element'
        }
        this.board = canvas;
        this.context = canvas.getContext('2d');

        this.character = new Character(this.username,
            [new Rect(0, 0, 10, 10, '#ff0000', '#000000', 0, 0)],
            10, 10);
        this.io.emit('player movement', this.character);

        this.cleanBoard = new Rect(0, 0, canvas.width, canvas.height, '#ffffff', undefined, 0, 0);
        this.loadEvents();

        this.beginInterval();
        this.keys = [];
        this.characters = {};
        this.socketIOEvents();
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
        
        if (move) {
            const collision = false;//this.checkCollisions();
            this.io.emit('player movement', this.character);
        }
        //character.x = tempPosition.x;
        //character.y = tempPosition.y;
    }
    drawPlayers(playersDetails) {
        this.clear();
        const characters = this.characters;
        for (let id in playersDetails) {
            const plDetails = playersDetails[id];
            for (let prop in  plDetails.shapes) {
                if (!characters[id]) {
                    characters[id] = new Character(plDetails.username, []);
                    plDetails.shapes.forEach(shape => {
                        const newShape = new canvasClasses[shape.desc]();
                        for (let shapeProp in  shape) {
                            newShape[shapeProp] = shape[shapeProp];
                        }
                        characters[id].shapes.push(newShape);
                    });
                }
                characters[id].x = plDetails.x;
                characters[id].y = plDetails.y;
            }
            characters[id].draw(this.context);
        }
        /*for (let id in characters) {
            playersDetails[id].form.draw();
        }*/
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
