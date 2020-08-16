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
            toolList: document.getElementById('toolList'),
            color: {
                border: document.getElementById('border-color'),
                background: document.getElementById('background-color'),
                opacity: document.getElementById('opacity')
            }
        }

        this.selectedTool = this.menus.toolList.querySelector('.active').value;

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
        this.menus.toolList.addEventListener('click', this.toolClickEvent.bind(this));
        this.loadColorEvents();
        this.loadCanvasEvents();
    }
    loadColorEvents() {
        this.menus.color.background.addEventListener('change', this.updateBgColor.bind(this));
        this.menus.color.opacity.addEventListener('change', this.updateBgColor.bind(this));
        this.updateBgColor();
    }
    updateBgColor() {
        const coloSplitted = this.menus.color.background.value.match(/\w{2}/g);
        const r = parseInt(coloSplitted[0], 16);
        const g = parseInt(coloSplitted[1], 16);
        const b = parseInt(coloSplitted[2], 16);
        const a = this.menus.color.opacity.value;
        this.menus.color.bgColor = `rgba(${r},${g},${b},${a})`;
    }
    toolClickEvent(evt) {
        /*if (evt.target.className.split(' ').indexOf('active') >= 0) {
            this.selectedTool = evt.target.value;
        } else {
            this.selectedTool = this.menus.toolList.querySelector('.active').value;
        }*/
        this.selectedTool = evt.target.value;
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
            drawingObj.shape = new Pencil([drawingObj.startPosition], this.menus.color.border.value);
        }
        drawingObj.shape.points.push(new ClickXY(evt));
    }
    drawingClosedPencil(evt, drawingObj) {
        if (!this.drawingObj.initialized) {
            this.drawingObj.initialized = true;
            drawingObj.shape = new ClosedPencil([drawingObj.startPosition], this.menus.color.bgColor, this.menus.color.border.value);
        }
        console.log(this.menus.color.bgColor);
        drawingObj.shape.points.push(new ClickXY(evt));
    }
}

export default CharacterEditor;