import {asyncRequest, showAlert, parseLayers} from '../functions.js';
import CONST from '../canvas/constants.js';
import CanvasClasses from '../canvas/canvasClasses.js';
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

class PaintingBoard {
    constructor(canvas, project) {
        window._this = this;
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        window.context = this.context;
        this.cleanBoard = new Rect(0, 0, canvas.width, canvas.height, '#ffffff', undefined, 0, 0);
        this.scale = 1;

        this.menus = {
            background: document.getElementById('background-color'),
            borderColor: document.getElementById('border-color'),
            borderWidth: document.getElementById('border-width'),
            currentPosition: document.getElementById('currentPosition'),
            followGrid: document.getElementById('followGrid'),
            gridSize: document.getElementById('gridSize'),
            layerList: document.getElementById('layerList'),
            layerExampleCanvas: document.getElementById('layerExampleCanvas'),
            opacity: document.getElementById('opacity'),
            resolution: {
                height: document.getElementById('canvasHeight'),
                width: document.getElementById('canvasWidth')
            },
            rotation: document.getElementById('rotation'),
            toolList: document.getElementById('toolList'),
            visibleLayer: document.getElementById('visibleLayer'),
        }

        if (!project) {
            this.layers = [];
            this.currentLayer = new Layer('Layer', this.currentLayer);
            this.layers.push(this.currentLayer);
            this.project = { layers: this.layers};
            this.project.dateCreated = Date.now();
            this.menus.resolution.width.value = canvas.width;
            this.menus.resolution.height.value = canvas.height;
        } else {
            this.project = this.parseProject(project);
            this.layers = this.project.layers;
            this.currentLayer = project.layers[0];
            this.dateCreated = project.dateCreated;
            document.getElementById('projectName').value = project.name;
            this.menus.resolution.width.value = project.canvas.width;
            this.menus.resolution.height.value = project.canvas.height;
            this.canvas.width = project.canvas.width;
            this.canvas.height = project.canvas.height;
        }

        this.selectedTool = this.menus.toolList.querySelector('.active').value;

        this.loadEvents();
        this.interval = setInterval(this.canvasInterval.bind(this));
    }
    parseProject(project) {
        return {
            _id: project._id,
            name: project.name,
            layers: parseLayers(project.layers),
            dateCreated: project.dateCreated
        };
    }
    clear() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    canvasInterval() {
        this.clear();
        this.layers.forEach(layer => {
            layer.draw(this.context);
        });
        if (this.drawingObj) {
            this.drawingObj.shape.draw(this.context);
            if (this.drawingObj.extraShapes) {
                this.drawingObj.extraShapes.forEach(shape => {
                    shape.draw(this.context);
                });
            }
        }
        
        const gridSize = parseInt(this.menus.gridSize.value);
        if (gridSize) {
            for(let i = 1; gridSize * i < this.canvas.width; i++) {
                const pos = gridSize * i;
                new Line([{x: pos ,y: 0} ,{x: pos , y: this.canvas.height}], 'rgba(0,0,0,0.5)', 1 ).draw(this.context);
            }
            for(let i = 1; gridSize * i < this.canvas.height; i++) {
                const pos = gridSize * i;
                new Line([{x: 0, y: pos}, {x: this.canvas.width, y: pos}], 'rgba(0,0,0,0.5)', 1).draw(this.context);
            }
        }
    }
    loadEvents() {
        this.resolutionChangeEvent();
        this.menus.resolution.height.addEventListener('change', this.resolutionChangeEvent.bind(this));
        this.menus.resolution.width.addEventListener('change', this.resolutionChangeEvent.bind(this));
        this.menus.toolList.addEventListener('click', this.toolClickEvent.bind(this));
        this.loadColorEvents();
        this.loadLayerComponentsEvents();
        this.loadCanvasEvents();
        document.getElementById('save').addEventListener('click', this.save.bind(this));
        this.canvas.addEventListener('wheel', this.onCanvasWheel.bind(this));

    }
    resolutionChangeEvent() {
        this.canvas.height = this.menus.resolution.height.value;
        this.canvas.width = this.menus.resolution.width.value;
        const style = getComputedStyle(this.canvas);
        this.canvas.style.height = (this.canvas.height * parseFloat(style.width) / this.canvas.width) + 'px';
    }
    onCanvasWheel(evt) {
        evt.stopImmediatePropagation();
        evt.preventDefault()
        const currentPos = this.getCurrentPos(evt);
        const res = this.menus.resolution;
        if( evt.deltaY < 0) {
            this.scale *= 2;
        } else {
            this.scale /= 2;
        }
        this.resolutionChangeEvent();
    }
    loadColorEvents() {
        this.menus.background.addEventListener('change', this.updateBgColor.bind(this));
        this.menus.opacity.addEventListener('change', this.updateBgColor.bind(this));
        this.updateBgColor();
    }
    updateBgColor() {
        const coloSplitted = this.menus.background.value.match(/\w{2}/g);
        const r = parseInt(coloSplitted[0], 16);
        const g = parseInt(coloSplitted[1], 16);
        const b = parseInt(coloSplitted[2], 16);
        const a = this.menus.opacity.value;
        this.menus.bgColor = `rgba(${r},${g},${b},${a})`;
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
        this.menus.visibleLayer.addEventListener('change', this.visibleLayerChange.bind(this));
        this.layerChange();
    }
    visibleLayerChange() {
        this.currentLayer.visible = this.menus.visibleLayer.checked;
    }
    layerChange() {
        this.currentLayer = this.layers[this.menus.layerList.selectedIndex];
        
        this.menus.visibleLayer.checked = this.currentLayer.visible;
        this.layerPreviewUpdate();
    }
    layerPreviewUpdate() {
        this.menus.layerExampleCanvas.width = this.canvas.width;
        this.menus.layerExampleCanvas.height = this.canvas.height;
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
            shape.drawResized(context);

            
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
        let btn = evt.target;
        while (btn.tagName !== 'BUTTON' && btn.tagName !== 'BODY') {
            btn = btn.parentElement;
        }
        if(btn.tagName === 'BODY') {
            btn = document.querySelector('#toolListCollapse .active');
        }
        this.selectedTool = btn.value;
        this.canvas.setAttribute('tool', btn.value);
    }
    loadCanvasEvents() {
        this.canvas.addEventListener('mousedown', this.canvasMouseDown.bind(this));
        document.body.addEventListener('mouseup', this.canvasMouseUp.bind(this));
        this.canvas.addEventListener('mousemove', this.canvasMouseMove.bind(this));
        this.canvas.addEventListener('dblclick', this.canvasDblClick.bind(this));
    }
    getCurrentPos(evt) {let currentPos;
        if(this.menus.followGrid.checked && this.menus.gridSize.value) {
            currentPos = new ClickXY(evt, this.menus.gridSize.value);
        } else {
            currentPos = new ClickXY(evt);
        }
        currentPos.x /= this.scale;
        currentPos.y /= this.scale;
        return currentPos.getSimple();
    }
    canvasMouseDown(evt) {
        const currentPos = this.getCurrentPos(evt);
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
                        shape: new Polygon([currentPos], this.menus.bgColor, this.menus.borderColor.value, this.menus.borderWidth.value),
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
        if (evt.target === this.canvas && this.selectedTool === CONST.COLORPICKER) {
            const colorData = this.getCurrentPositionColor(evt);

            this.menus.background.value = colorData.hex;
            this.menus.opacity.value = colorData.alpha;


            
        }
        if (!this.drawingObj) return;
        if (this.drawingObj.tool === CONST.POLYGON || this.drawingObj.tool === CONST.SEMIARC) return;
        const shape = this.drawingObj.shape;
        if (!shape) return;
        if (shape.desc === CONST.RECT) {
            if(isNaN(shape.x + shape.y + shape.width + shape.height)) {
                this.drawingObj = undefined;
                return;
            }

            if (shape.width < 0) {
                shape.x += shape.width;
                shape.width *= -1;
            }
            if (shape.height < 0) {
                shape.y += shape.height;
                shape.height *= -1;
            }
        } else if(shape.desc === CONST.ARC) {
            if(!shape.radius) {
                this.drawingObj = undefined;
                return;
            }
        } else if(shape.desc === CONST.ELLIPSE) {
            if(!shape.radiusX && !shape.radiusY) {
                this.drawingObj = undefined;
                return;
            }
        } else if(shape.desc === CONST.LINE) {
            const points = shape.points;
            if(points[0].x === points[1].x && points[0].y === points[1].y) {
                this.drawingObj = undefined;
                return;
            }
        } else if(shape.desc === CONST.ABSTRACT) {
            if(shape.points.length <= 1) {
                this.drawingObj = undefined;
                return;
            }
        }

        this.currentLayer.shapes.push(this.drawingObj.shape);
        this.drawingObj = undefined;
        this.layerChange();
    }
    canvasMouseMove(evt) {
        const currentPos = this.getCurrentPos(evt);
        this.menus.currentPosition.innerHTML = `${currentPos.x} x ${currentPos.y}`;
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
            const shape = this.drawingObj.shape;
            if (shape) {
                this.currentLayer.shapes.push(shape);
            }
            this.drawingObj = undefined;
            this.layerChange();
        }
    }
    drawingPencil(evt, drawingObj) {
        if (!drawingObj.initialized) {
            drawingObj.initialized = true;
            drawingObj.shape = new Pencil([drawingObj.startPosition], this.menus.borderColor.value, this.menus.borderWidth.value);
        }
        const point = this.getCurrentPos(evt);
        if (isNaN(point.x) || isNaN(point.y)) return;
        const points = drawingObj.shape.points;
        const length = points.length;
        if (length < 2) {
            drawingObj.shape.points.push(point);
        } else {
            if (point.x === points[length-1].x && point.x === points[length-2].x || point.y === points[length-1].y && point.y === points[length-2].y) {
                drawingObj.shape.points[length-1] = point;
            } else {
                drawingObj.shape.points.push(point);
            }
        }
    }
    drawingAbstract(evt, drawingObj) {
        if (!drawingObj.initialized) {
            drawingObj.initialized = true;
            drawingObj.shape = new Abstract([drawingObj.startPosition], this.menus.bgColor, this.menus.borderColor.value, this.menus.borderWidth.value);
        }
        const point = this.getCurrentPos(evt);
        if (isNaN(point.x) || isNaN(point.y)) return;
        const points = drawingObj.shape.points;
        const length = points.length;
        if (length < 2) {
            drawingObj.shape.points.push(point);
        } else {
            if (point.x === points[length-1].x && point.x === points[length-2].x || point.y === points[length-1].y && point.y === points[length-2].y) {
                drawingObj.shape.points[length-1] = point;
            } else {
                drawingObj.shape.points.push(point);
            }
        }
    }
    drawingArc(evt, drawingObj) {
        const currentPos = this.getCurrentPos(evt);
        if (!drawingObj.initialized) {
            drawingObj.initialized = true;

            drawingObj.shape = new Arc(currentPos.x, currentPos.y, 0, this.menus.bgColor, this.menus.borderColor.value, this.menus.borderWidth.value);
        }
        const arc = drawingObj.shape;
        arc.radius = Math.sqrt(Math.pow(currentPos.x - arc.x, 2) + Math.pow(currentPos.y - arc.y, 2));
    }
    drawingEllipse(evt, drawingObj) {
        const currentPos = this.getCurrentPos(evt);
        if (!drawingObj.initialized) {
            drawingObj.initialized = true;

            drawingObj.shape = new Ellipse(currentPos.x, currentPos.y, 0, 0, 0, this.menus.bgColor, this.menus.borderColor.value, this.menus.borderWidth.value);
        }
        const ellipse = drawingObj.shape;
        ellipse.radiusX = currentPos.x - ellipse.x;
        ellipse.radiusY = currentPos.y - ellipse.y;
        if (ellipse.radiusX < 0) ellipse.radiusX *= -1;
        if (ellipse.radiusY < 0) ellipse.radiusY *= -1;
    }
    drawingRect(evt, drawingObj) {
        const currentPos = this.getCurrentPos(evt);
        if (!drawingObj.initialized) {
            drawingObj.initialized = true;

            drawingObj.shape = new Rect(currentPos.x, currentPos.y, 0, 0, this.menus.bgColor, this.menus.borderColor.value, this.menus.borderWidth.value, this.menus.rotation.value);
        }
        const rect = drawingObj.shape;
        rect.width = currentPos.x - rect.x;
        rect.height = currentPos.y - rect.y;
    }
    drawingLine(evt, drawingObj) {
        const currentPos = this.getCurrentPos(evt);
        if (!drawingObj.initialized) {
            drawingObj.initialized = true;
            drawingObj.shape = new Line([currentPos], this.menus.borderColor.value, this.menus.borderWidth.value);
        }
        drawingObj.shape.points[1] = currentPos;
    }
    drawingPolygon(evt, drawingObj) {
        const currentPos = this.getCurrentPos(evt);
        const shapePoints = drawingObj.shape.points;
        drawingObj.extraShapes = [
            new Line([currentPos, shapePoints[0]], '#000000', 1),
            new Line([currentPos, shapePoints[shapePoints.length - 1]], '#000000', 1)
        ]
    }
    drawingSemiArc(evt, drawingObj) {
        const currentPos = this.getCurrentPos(evt);
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
        const currentPos = this.getCurrentPos(evt);
        let arc;
        if (!this.drawingObj) {
            arc = new Arc(currentPos.x, currentPos.y,0, this.menus.bgColor, this.menus.borderColor.value, this.menus.borderWidth.value);
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
            drawingObj.shape = new Rubber([drawingObj.startPosition], this.menus.borderWidth.value);
        }
        const point = new ClickXY(evt);
        if (!isNaN(point.x) && !isNaN(point.y)) {
            drawingObj.shape.points.push(point);
        }
    }
    getCurrentPositionColor(evt) {
        const currentPos = this.getCurrentPos(evt);
        const imgData = this.context.getImageData(currentPos.x, currentPos.y, 1, 1);
        let red = imgData.data[0].toString(16);
        if(red.length<2) red = '0' + red;
        let green = imgData.data[1].toString(16);
        if(green.length<2) green = '0' + green;
        let blue = imgData.data[2].toString(16);
        if(blue.length<2) blue = '0' + blue;
        const alpha = imgData.data[3] / 255;
        
        return {
            red: imgData.data[0],
            green: imgData.data[1],
            blue: imgData.data[2],
            hex: `#${red}${green}${blue}`,
            alpha255: imgData.data[3],
            alpha,
            rgb: `rgb(${imgData.data[0]},${imgData.data[1]},${imgData.data[2]})`,
            rgba: `rgb(${imgData.data[0]},${imgData.data[1]},${imgData.data[2]},${alpha})`
        }
    }
    async save() {
        const name = document.getElementById('projectName').value;
        if(!name) {
            showAlert({
                msg: 'Name field empty'
            })
            return;
        }
        this.project.name = name;
        this.project.canvas = {
            width: this.menus.resolution.width.value,
            height: this.menus.resolution.height.value
        };
        const response = await asyncRequest({
            url: '/paintingBoard/save',
            method: 'POST',
            data: {
                id: this.projectId,
                project: this.project
            }
        });
        if (response.success) {
            this.project._id = response.response.id;
        }
    }
}

export default PaintingBoard;