import CONST from '../canvas/constants.js';
import {
    Abstract,
    Arc,
    Character,
    ClickXY,
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
} from '../canvas/canvasClasses.js';

class CharacterEditor {
    constructor(canvas, nameInput) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');

        this.cleanBoard = new Rect(0, 0, canvas.width, canvas.height, '#ffffff', undefined, 0, 0);
        this.layers = [];
        this.currentLayer = new Layer('Layer', this.currentLayer);
        this.layers[0] = this.currentLayer;


        this.menus = {
            toolList: document.getElementById('toolList'),
            color: {
                border: document.getElementById('border-color'),
                borderWidth: document.getElementById('border-width'),
                background: document.getElementById('background-color'),
                opacity: document.getElementById('opacity')
            },

            layerList: document.getElementById('layerList'),
            layerExampleCanvas: document.getElementById('layerExampleCanvas'),
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
            if (this.drawingObj.extraShapes) {
                this.drawingObj.extraShapes.forEach(shape => {
                    shape.draw(this.context);
                });
            }
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
        this.menus.layerList.addEventListener('change', this.layerChange.bind(this));
        document.getElementById('createLayer').addEventListener('click', this.createLayer.bind(this));
        document.getElementById('removeLayer').addEventListener('click', this.removeLayer.bind(this));
        document.getElementById('moveUpLayer').addEventListener('click', this.moveUpLayer.bind(this));
        document.getElementById('moveDownLayer').addEventListener('click', this.moveDownLayer.bind(this));
        this.layerChange();
    }
    layerChange() {
        this.currentLayer = this.layers[this.menus.layerList.selectedIndex];
        this.layerPreviewUpdate();
    }
    layerPreviewUpdate() {
        const context = this.menus.layerExampleCanvas.getContext('2d');
        new Rect(0, 0, this.menus.layerExampleCanvas.width, this.menus.layerExampleCanvas.height, '#FFFFFF').draw(context);
        this.currentLayer.draw(context);
        this.updateShapeList();
    }
    createLayer() {
        const nLayer = new Layer(document.getElementById('newLayerName').value);
        this.layers.push(nLayer);

        const option = document.createElement('option');
        option.setAttribute('name', nLayer.name);
        option.innerHTML = nLayer.name;
        this.menus.layerList.appendChild(option);

        $('#newLayerModal').modal('hide')
    }
    removeLayer() {
        if (this.layers.length === 1) return;
        this.layers.pop(this.menus.layerList.selectedIndex);
        this.menus.layerList.removeChild(this.menus.layerList.selectedOptions[0]);
        this.currentLayer = this.layers[0];
        this.layerPreviewUpdate();
    }
    moveUpLayer() {
        const currentIndex = this.menus.layerList.selectedIndex;
        if (currentIndex <= 0) return;
        //Array
        const tempLayer = this.layers[currentIndex];
        this.layers[currentIndex] = this.layers[currentIndex - 1];
        this.layers[currentIndex - 1] = tempLayer;
        //Select
        this.menus.layerList.insertBefore(this.menus.layerList[currentIndex], this.menus.layerList[currentIndex - 1]);
    }
    moveDownLayer() {
        const currentIndex = this.menus.layerList.selectedIndex;
        if (currentIndex >= this.layers.length - 1) return;
        //Array
        const tempLayer = this.layers[currentIndex];
        this.layers[currentIndex] = this.layers[currentIndex + 1];
        this.layers[currentIndex + 1] = tempLayer;
        //Select
        this.menus.layerList.insertBefore(this.menus.layerList[currentIndex + 1], this.menus.layerList[currentIndex]);
    }
    updateShapeList() {
        const shapeList = document.getElementById('shapeList');
        const currentLayer = this.currentLayer;
        shapeList.innerHTML = '';
        currentLayer.shapes.forEach(shape => {
            const block = document.createElement('div');
            block.className = "list-group-item list-group-item-action pl-2 pr-2";
            block.setAttribute('data-toggle', 'list');
            block.setAttribute('name', 'shape');
            block.innerHTML = `<div class="col-12">
            <canvas width="100" height="100"></canvas>
            <label class="shapeDesc">${shape.desc}</label>
            </div>
            <div class="col-12">
            <button title="Remove Shape" class="btn btn-light removeShape"><i class="fas fa-trash"></i></button>
            <button title="Move Up Shape" class="btn btn-light moveUpShape"><i class="fas fa-chevron-up"></i></button>
            <button title="Move Down Shape" class="btn btn-light moveDownShape"><i class="fas fa-chevron-down"></i></button>
            </div>`;

            shapeList.appendChild(block);
            const canvas = block.querySelector('canvas');
            const context = canvas.getContext('2d');
            shape.draw100x100(context);

            
            block.querySelector('.removeShape').addEventListener('click', this.removeShape.bind(this, shape));
            block.querySelector('.moveUpShape').addEventListener('click', this.moveUpShape.bind(this, shape));
            block.querySelector('.moveDownShape').addEventListener('click', this.moveDownShape.bind(this, shape));
        });
    }
    removeShape(shape, evt) {
        const index = this.currentLayer.shapes.indexOf(shape);
        this.currentLayer.shapes.splice(index, 1);
        this.layerPreviewUpdate();
    }
    moveUpShape(shape, evt) {
        const shapes = this.currentLayer.shapes;
        const index = shapes.indexOf(shape);
        if (index === 0) return;
        const temp = shapes[index];
        shapes[index] = shapes[index - 1];
        shapes[index - 1] = temp;
        this.layerPreviewUpdate();
    }
    moveDownShape(shape, evt) {
        const shapes = this.currentLayer.shapes;
        const index = shapes.indexOf(shape);
        if (index === shapes.length - 1) return;
        const temp = shapes[index];
        shapes[index] = shapes[index + 1];
        shapes[index + 1] = temp;
        this.layerPreviewUpdate();
    }
    toolClickEvent(evt) {
        this.selectedTool = evt.target.value;
    }
    loadCanvasEvents() {
        this.canvas.addEventListener('mousedown', this.canvasMouseDown.bind(this));
        document.body.addEventListener('mouseup', this.canvasMouseUp.bind(this));
        document.body.addEventListener('mousemove', this.canvasMouseMove.bind(this));
        this.canvas.addEventListener('dblclick', this.canvasDblClick.bind(this));
    }
    canvasMouseDown(evt) {
        const currentPos = new ClickXY(evt);
        switch (this.selectedTool) {
            case CONST.PENCIL:
            case CONST.ABSTRACT:
            case CONST.ARC:
            case CONST.ELLIPSE:
            case CONST.RECT:
            case CONST.LINE:
            case CONST.RUBBER:
                this.drawingObj = {
                    tool: this.selectedTool,
                    shape: undefined,
                    startPosition: currentPos,
                    initialized: false
                };
                this.canvasMouseMove(evt);
                break;
            case CONST.POLYGON:
                if (!this.drawingObj) {
                    this.drawingObj = {
                        tool: this.selectedTool,
                        shape: new Polygon([currentPos], this.menus.color.bgColor, this.menus.color.border.value, this.menus.color.borderWidth.value),
                        startPosition: currentPos,
                    };
                }
                const points = this.drawingObj.shape.points;
                if (points[points.length - 1].x !== currentPos.x || points[points.length - 1].y !== currentPos.y) {
                    points.push(currentPos);
                }
                break;
            case CONST.SEMIARC:
                this.semiArcClick(evt);
                break;
        }
    }
    canvasMouseUp(evt) {
        if (!this.drawingObj) return;
        if (this.drawingObj.tool === CONST.POLYGON || this.drawingObj.tool === CONST.SEMIARC) return;
        if (this.drawingObj.shape.desc === CONST.RECT) {
            const shape = this.drawingObj.shape;
            if (shape.width < 0) {
                shape.x += shape.width;
                shape.width *= -1;
            }
            if (shape.height < 0) {
                shape.y += shape.height;
                shape.height *= -1;
            }
        }

        if (this.drawingObj.shape) this.currentLayer.shapes.push(this.drawingObj.shape);
        this.drawingObj = undefined;
        this.layerChange();
    }
    canvasMouseMove(evt) {
        if (!this.drawingObj) return;
        switch (this.drawingObj.tool) {
            case CONST.PENCIL:
                this.drawingPencil(evt, this.drawingObj);
                break;
            case CONST.ABSTRACT:
                this.drawingAbstract(evt, this.drawingObj);
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
            case CONST.POLYGON:
                this.drawingPolygon(evt, this.drawingObj);
                break;
            case CONST.SEMIARC:
                this.drawingSemiArc(evt, this.drawingObj);
                break;
            case CONST.RUBBER:
                this.drawingRubber(evt, this.drawingObj);
                break;

        }
    }
    canvasDblClick(evt) {
        if (this.drawingObj.tool === CONST.POLYGON) {
            if (this.drawingObj.shape) this.currentLayer.shapes.push(this.drawingObj.shape);
            this.drawingObj = undefined;
            this.layerChange();
        }
    }
    drawingPencil(evt, drawingObj) {
        if (!drawingObj.initialized) {
            drawingObj.initialized = true;
            drawingObj.shape = new Pencil([drawingObj.startPosition], this.menus.color.border.value, this.menus.color.borderWidth.value);
        }
        const point = new ClickXY(evt);
        if (!isNaN(point.x) && !isNaN(point.y)) {
            drawingObj.shape.points.push(point);
        }
    }
    drawingAbstract(evt, drawingObj) {
        if (!drawingObj.initialized) {
            drawingObj.initialized = true;
            drawingObj.shape = new Abstract([drawingObj.startPosition], this.menus.color.bgColor, this.menus.color.border.value, this.menus.color.borderWidth.value);
        }
        const point = new ClickXY(evt);
        if (!isNaN(point.x) && !isNaN(point.y)) {
            drawingObj.shape.points.push(point);
        }
    }
    drawingArc(evt, drawingObj) {
        const currentPos = new ClickXY(evt);
        if (!drawingObj.initialized) {
            drawingObj.initialized = true;

            drawingObj.shape = new Arc(currentPos.x, currentPos.y, 0, this.menus.color.bgColor, this.menus.color.border.value, this.menus.color.borderWidth.value);
        }
        const arc = drawingObj.shape;
        arc.radius = Math.sqrt(Math.pow(currentPos.x - arc.x, 2) + Math.pow(currentPos.y - arc.y, 2));
    }
    drawingEllipse(evt, drawingObj) {
        const currentPos = new ClickXY(evt);
        if (!drawingObj.initialized) {
            drawingObj.initialized = true;

            drawingObj.shape = new Ellipse(currentPos.x, currentPos.y, 0, 0, 0, this.menus.color.bgColor, this.menus.color.border.value, this.menus.color.borderWidth.value);
        }
        const ellipse = drawingObj.shape;
        ellipse.radiusX = currentPos.x - ellipse.x;
        ellipse.radiusY = currentPos.y - ellipse.y;
        if (ellipse.radiusX < 0) ellipse.radiusX *= -1;
        if (ellipse.radiusY < 0) ellipse.radiusY *= -1;
    }
    drawingRect(evt, drawingObj) {
        const currentPos = new ClickXY(evt);
        if (!drawingObj.initialized) {
            drawingObj.initialized = true;

            drawingObj.shape = new Rect(currentPos.x, currentPos.y, 0, 0, this.menus.color.bgColor, this.menus.color.border.value, this.menus.color.borderWidth.value);
        }
        const rect = drawingObj.shape;
        rect.width = currentPos.x - rect.x;
        rect.height = currentPos.y - rect.y;
        console.log(rect);
    }
    drawingLine(evt, drawingObj) {
        const currentPos = new ClickXY(evt);
        if (!drawingObj.initialized) {
            drawingObj.initialized = true;
            drawingObj.shape = new Line(currentPos.x, currentPos.y, currentPos.x, currentPos.y, this.menus.color.border.value, this.menus.color.borderWidth.value);
        }
        drawingObj.shape.x2 = currentPos.x;
        drawingObj.shape.y2 = currentPos.y;
    }
    drawingPolygon(evt, drawingObj) {
        const currentPos = new ClickXY(evt);
        const shapePoints = drawingObj.shape.points;
        drawingObj.extraShapes = [
            new Line(currentPos.x, currentPos.y, shapePoints[0].x, shapePoints[0].y, '#000000', 1),
            new Line(currentPos.x, currentPos.y, shapePoints[shapePoints.length - 1].x, shapePoints[shapePoints.length - 1].y, '#000000', 1)
        ]
    }
    drawingSemiArc(evt, drawingObj) {
        const currentPos = new ClickXY(evt);
        const arc = drawingObj.shape;
        switch(this.drawingObj.step) {
            case 0:
                arc.radius = Math.sqrt(Math.pow(currentPos.x - arc.x, 2) + Math.pow(currentPos.y - arc.y, 2));
                drawingObj.extraShapes = [
                    new Line(arc.x, arc.y, currentPos.x, currentPos.y, '#000000', 1)];
                break;
            case 1:
                let c1 = currentPos.x - arc.x;//Base
                let c2 = currentPos.y - arc.y;//Height
                let h = Math.sqrt(Math.pow(c1, 2) + Math.pow(c2, 2));
                let a = Math.asin(c2 / h); 
                
                if (c1 < 0 && c2 >= 0) {
                    a = Math.PI - a;
                } else if (c1 < 0 && c2 < 0) {
                    a = a * -1 + Math.PI;
                } else if (c1 >= 0 && c2 < 0) {
                    a += 2 * Math.PI;
                }

                arc.endAngle = a;
                
                break;
        }
    }
    semiArcClick(evt) {
        const currentPos = new ClickXY(evt);
        let arc;
        if (!this.drawingObj) {
            arc = new Arc(currentPos.x, currentPos.y,0, this.menus.color.bgColor, this.menus.color.border.value, this.menus.color.borderWidth.value);
            this.drawingObj = {
                tool: this.selectedTool,
                shape: arc,
                startPosition: currentPos,
                step: -1
            };
        } else {
            arc = this.drawingObj.shape;
        }
        const drawingObj = this.drawingObj;
        switch(drawingObj.step) {
            case 0:
                arc.radius = Math.sqrt(Math.pow(currentPos.x - arc.x, 2) + Math.pow(currentPos.y - arc.y, 2));
                const c1 = currentPos.x - arc.x;//Base
                const c2 = currentPos.y - arc.y;//Height
                const h = Math.sqrt(Math.pow(c1, 2) + Math.pow(c2, 2));
                let a = Math.asin(c2 / h); 
                
                if (c1 < 0 && h >= 0) {
                    a = Math.PI - a;
                } else if (c1 < 0 && h < 0) {
                    a = -1 * a + Math.PI;
                } else if (c1 >= 0 && h < 0) {
                    a += 2 * Math.PI;
                }
                
                while (a > 2 * Math.PI) {
                    a -= 2 * Math.PI;
                }

                arc.startAngle = a;
                arc.endAngle = a;


                Math.sqrt(Math.pow(currentPos.x - arc.x, 2) + Math.pow(currentPos.y - arc.y, 2))

                drawingObj.extraShapes = [];
                break;
            case 1:
                if (arc.desc === CONST.ARC) {
                    if (arc.r < 0) {
                        arc.r *= -1;
                    }
                }

                this.currentLayer.shapes.push(this.drawingObj.shape);
                this.drawingObj = undefined;
                this.layerChange();
                break;
        }
        if (this.drawingObj)
            this.drawingObj.step++;
    }
    drawingRubber(evt, drawingObj) {
        if (!drawingObj.initialized) {
            drawingObj.initialized = true;
            drawingObj.shape = new Rubber([drawingObj.startPosition], this.menus.color.borderWidth.value);
        }
        const point = new ClickXY(evt);
        if (!isNaN(point.x) && !isNaN(point.y)) {
            drawingObj.shape.points.push(point);
        }
    }
}

export default CharacterEditor;