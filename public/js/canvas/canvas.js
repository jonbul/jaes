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
    constructor(canvas) {
        window.canvasPaint = this;
        if (!canvas instanceof HTMLCanvasElement) {
            throw 'Paramete 1 must be a Canvas HTML Element'
        }
        this.board = canvas;
        this.context = canvas.getContext('2d');

        this.character = new Rect(10, 10, 10, 10, '#ff0000', '#000000', 0, 0);
        this.cleanBoard = new Rect(0, 0, canvas.width, canvas.height, '#ffffff', undefined, 0, 0)
        this.loadEvents();

        this.beginInterval();
        this.keys = [];
    }
    beginInterval() {
        this.intervaId = setInterval(this.intervalMethod.bind(this), 20);
    }
    stopInterval() {
        clearInterval(this.intervalId);
    }
    intervalMethod() {
        this.clear();
        this.movement();
        this.drawPlayers();
    }
    clear() {
        this.cleanBoard.draw(this.context);
    }
    movement(){
        const tempPosition = {
            x: this.character.x,
            y: this.character.y,
            h: this.character.height,
            w: this.character.width,
        }
        if (this.keys[KEYS.UP]) {
            tempPosition.y--;
            if (this.keys[KEYS.SHIFT]) tempPosition.y--;
        }
        if (this.keys[KEYS.DOWN]) {
            tempPosition.y++;
            if (this.keys[KEYS.SHIFT]) tempPosition.y++;
        }
        if (this.keys[KEYS.LEFT]) {
            tempPosition.x--;
            if (this.keys[KEYS.SHIFT]) tempPosition.x--;
        }
        if (this.keys[KEYS.RIGHT]) {
            tempPosition.x++;
            if (this.keys[KEYS.SHIFT]) tempPosition.x++;
        }
        
        const collision = false;//this.checkCollisions();
        
        this.character.x = tempPosition.x;
        this.character.y = tempPosition.y;
    }
    drawPlayers() {
        this.character.draw(this.context);
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
