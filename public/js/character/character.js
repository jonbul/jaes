import CONST from '../canvas/constants.js';
import {
    Arc,
    Character,
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
    Text
} from '../canvas/canvasClasses.js';

class CharacterEditor {
    constructor (canvas, nameInput) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');

        this.cleanBoard = new Rect(0, 0, canvas.width, canvas.height, '#ffffff', undefined, 0, 0);
        this.layers = [];
        this.characterShapes = [];
        this.layers[0] = new Layer('character', this.characterShapes);
        

        this.menus = {
            tools: document.getElementById('toolList')
        }

        this.selectedTool = this.menus.tools.querySelector('.active').value;

        this.loadEvents();
        this.interval = setInterval(this.canvasInterval.bind(this));
    }
    clear() {
        this.cleanBoard.draw(this.context);
    }
    canvasInterval() {
        this.clear();
        this.layers.forEach(layer => {
            layer.draw(this.context)
        });
        if (this.drawingObj) {
            this.drawingObj.shape.draw(this.context);
        }
    }
    loadEvents() {
        this.menus.tools.addEventListener('click', this.toolClickEvent.bind(this));
        this.loadCanvasEvents();
    }
    toolClickEvent(evt) {
        if (evt.target.className.split(' ').indexOf('active') >= 0) {
            this.selectedTool = evt.target.value;
        } else {
            this.selectedTool = this.menus.tools.querySelector('.active').value;
        }
    }
    loadCanvasEvents() {
        this.canvas.addEventListener('mousedown', this.canvasMouseDown.bind(this));
        document.body.addEventListener('mouseup', this.canvasMouseUp.bind(this));
        document.body.addEventListener('mousemove', this.canvasMouseMove.bind(this));
    }
    canvasMouseDown(evt) {
        this.drawingObj = {
            tool: this.selectedTool,
            shape: undefined,
            startPosition: new ClickXY(evt),
            initialized: false
        }
        this.canvasMouseMove(evt);
    }
    canvasMouseUp(evt) {
        if (!this.drawingObj) return;
        this.characterShapes.push(this.drawingObj.shape);
        this.drawingObj = undefined;
    }
    canvasMouseMove(evt) {
        if (!this.drawingObj) return;
        switch (this.drawingObj.tool) {
            case CONST.PENCIL:
                this.drawingPencil(evt, this.drawingObj);
                break;
            case CONST.CLOSEDPENCIL:
                this.drawingClosedPencil(evt, this.drawingObj);
                break;
        }
    }
    drawingPencil(evt, drawingObj) {
        if (!this.drawingObj.initialized) {
            this.drawingObj.initialized = true;
            drawingObj.shape = new Pencil([drawingObj.startPosition], '#000');
        }
        drawingObj.shape.points.push(new ClickXY(evt));
    }
    drawingPencil(evt, drawingObj) {
        if (!this.drawingObj.initialized) {
            this.drawingObj.initialized = true;
            drawingObj.shape = new ClosedPencil([drawingObj.startPosition], '#000');
        }
        drawingObj.shape.points.push(new ClickXY(evt));
    }
}

export default CharacterEditor;