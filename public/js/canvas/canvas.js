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
    Rubber
} from './canvasClasses.js';
import { KEYS } from './constants.js';

class CanvasPainter {
    constructor(canvas, username, io) {
        window.canvasPaint = this;
        this.username = username
        this.io = io;
        if (!canvas instanceof HTMLCanvasElement) {
            throw 'Paramete 1 must be a Canvas HTML Element'
        }
        this.board = canvas;
        this.context = canvas.getContext('2d');

        this.character = {
            form: new Rect(10, 10, 10, 10, '#ff0000', '#000000', 0, 0),
            username
        };
        this.io.emit('player movement', this.character);

        this.cleanBoard = new Rect(0, 0, canvas.width, canvas.height, '#ffffff', undefined, 0, 0)
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
        const form = this.character.form;
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
            form.y = form.y - speed;
        }
        if (this.keys[KEYS.DOWN]) {
            form.y = form.y + speed;
        }
        if (this.keys[KEYS.LEFT]) {
            form.x = form.x - speed;
        }
        if (this.keys[KEYS.RIGHT]) {
            form.x = form.x + speed;
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
        const player = new Rect()
        for (let id in playersDetails) {
            const plDetails = playersDetails[id];
            for (let prop in  plDetails.form) {
                if (!characters[id]) {
                    characters[id] = {};
                    characters[id].form = new Rect();
                    characters[id].username = plDetails.username;
                }
                characters[id].form[prop] = plDetails.form[prop];
            }
            characters[id].form.draw(this.context);
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
export default CanvasPainter;
