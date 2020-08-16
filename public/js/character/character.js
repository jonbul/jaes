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
        this.currentLayer = [];
        this.layers[0] = new Layer('Layer', this.currentLayer);
        

        this.menus = {
            toolList: document.getElementById('toolList'),
            color: {
                border: document.getElementById('border-color'),
                borderWidth: document.getElementById('border-width'),
                background: document.getElementById('background-color'),
                opacity: document.getElementById('opacity')
            },
            
            layerList: document.getElementById('layerList'),
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
        this.loadLayerComponentsEvents();
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
    loadLayerComponentsEvents() {
        
        this.layers.forEach(layer => {
            const option = document.createElement('option');
            option.setAttribute('name', layer.name);
            option.innerHTML = layer.name;
            this.menus.layerList.appendChild(option);
        });
    }
    toolClickEvent(evt) {
        this.selectedTool = evt.target.value;
    }
    loadCanvasEvents() {
        this.canvas.addEventListener('mousedown', this.canvasMouseDown.bind(this));
        document.body.addEventListener('mouseup', this.canvasMouseUp.bind(this));
        document.body.addEventListener('mousemove', this.canvasMouseMove.bind(this));
    }
    canvasMouseDown(evt) {
        switch (this.selectedTool) {
            case CONST.PENCIL:
            case CONST.CLOSEDPENCIL:
            case CONST.ARC:
            case CONST.ELLIPSE:
            case CONST.RECT:
            case CONST.LINE:
                this.drawingObj = {
                    tool: this.selectedTool,
                    shape: undefined,
                    startPosition: new ClickXY(evt),
                    initialized: false
                };
                this.canvasMouseMove(evt);
                break;
        }
    }
    canvasMouseUp(evt) {
        if (!this.drawingObj) return;
        if (this.drawingObj.shape) this.currentLayer.push(this.drawingObj.shape);
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
            case CONST.ARC:
                this.drawingArc(evt, this.drawingObj);
                break;
            case CONST.ELLIPSE:
                this.drawingEllipse(evt, this.drawingObj);
                break;
            case CONST.RECT:
                this.drawingRect(evt, this.drawingObj);
                break;
            case CONST.LINE:
                this.drawingLine(evt, this.drawingObj);
                break;
        }
    }
    drawingPencil(evt, drawingObj) {
        if (!this.drawingObj.initialized) {
            this.drawingObj.initialized = true;
            drawingObj.shape = new Pencil([drawingObj.startPosition], this.menus.color.border.value, this.menus.color.borderWidth.value);
        }
        drawingObj.shape.points.push(new ClickXY(evt));
    }
    drawingClosedPencil(evt, drawingObj) {
        if (!this.drawingObj.initialized) {
            this.drawingObj.initialized = true;
            drawingObj.shape = new ClosedPencil([drawingObj.startPosition], this.menus.color.bgColor, this.menus.color.border.value, this.menus.color.borderWidth.value);
        }
        drawingObj.shape.points.push(new ClickXY(evt));
    }
    drawingArc(evt, drawingObj) {
        const currentPos = new ClickXY(evt);
        if (!this.drawingObj.initialized) {
            this.drawingObj.initialized = true;

            drawingObj.shape = new Arc(currentPos.x, currentPos.y,0,this.menus.color.bgColor, this.menus.color.border.value, this.menus.color.borderWidth.value);
        }
        const arc = drawingObj.shape;
        arc.radius = Math.sqrt(Math.pow(currentPos.x - arc.x, 2) + Math.pow(currentPos.y - arc.y, 2));
    }
    drawingEllipse(evt, drawingObj) {
        const currentPos = new ClickXY(evt);
        if (!this.drawingObj.initialized) {
            this.drawingObj.initialized = true;

            drawingObj.shape = new Ellipse(currentPos.x, currentPos.y,0,0,0,this.menus.color.bgColor, this.menus.color.border.value, this.menus.color.borderWidth.value);
        }
        const ellipse = drawingObj.shape;
        ellipse.radiusX = currentPos.x - ellipse.x;
        ellipse.radiusY = currentPos.y - ellipse.y;
        if (ellipse.radiusX < 0) ellipse.radiusX *= -1;
        if (ellipse.radiusY < 0) ellipse.radiusY *= -1;
    }
    drawingRect(evt, drawingObj) {
        const currentPos = new ClickXY(evt);
        if (!this.drawingObj.initialized) {
            this.drawingObj.initialized = true;

            drawingObj.shape = new Rect(currentPos.x, currentPos.y,0,0,this.menus.color.bgColor, this.menus.color.border.value, this.menus.color.borderWidth.value);
        }
        const rect = drawingObj.shape;
        rect.width = currentPos.x - rect.x;
        rect.height = currentPos.y - rect.y; 
        console.log(rect);
    }
    drawingLine(evt, drawingObj) {
        const currentPos = new ClickXY(evt);
        if (!this.drawingObj.initialized) {
            this.drawingObj.initialized = true;
            drawingObj.shape = new Line(currentPos.x,currentPos.y,currentPos.x,currentPos.y, this.menus.color.border.value, this.menus.color.borderWidth.value);
        }
        drawingObj.shape.x2 = currentPos.x;
        drawingObj.shape.y2 = currentPos.y;
    }
}

export default CharacterEditor;