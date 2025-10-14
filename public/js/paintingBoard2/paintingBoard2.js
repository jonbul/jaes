import { asyncRequest, showAlert, parseLayers } from '../functions.js';
import CONST from '../canvas/constants.js';
import windowsEvents from './windows.js';
import {
    Abstract,
    Arc,
    ClickXY,
    Ellipse,
    Layer,
    Line,
    Pencil,
    Picture,
    Polygon,
    Rect,
    Rubber,
    Text
} from '../canvas/canvasClasses.js';
import LayerManager from './layerManager.js'

class PaintingBoard {
    constructor(canvas, project) {
        //set CANVAS max Height
        const canvasBorder = document.getElementById("canvasBorder");
        const windowsSpace = parseInt(getComputedStyle(colorWindow).width) + parseInt(getComputedStyle(toolsWindow).width);
        canvasBorder.style.maxHeight = `calc(100vh - ${canvasBorder.getBoundingClientRect().y + 20 - windowsSpace}px)`


        windowsEvents(canvas);
        window._this = this;
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        window.context = this.context;
        this.cleanBoard = new Rect(0, 0, canvas.width, canvas.height, '#ffffff', undefined, 0, 0);
        this.scale = 100;

        this.menus = {
            backgroundColor: document.getElementById('backgroundColor'),
            colorRed: document.getElementById('colorRed'),
            colorGreen: document.getElementById('colorGreen'),
            colorBlue: document.getElementById('colorBlue'),
            opacity: document.getElementById('colorAlpha'),
            borderColor: document.getElementById('borderColor'),
            borderWidth: document.getElementById('borderWidth'),
            followGrid: document.getElementById('followGrid'),
            txtMousePos: document.getElementById('txtMousePos'),
            gridV: document.getElementById('gridV'),
            gridH: document.getElementById('gridH'),
            layerList: document.getElementById('layerList'),
            resolution: {
                height: document.getElementById('boardH'),
                width: document.getElementById('boardW')
            },
            rotation: document.getElementById('rectRotate'),
            toolList: document.getElementById('toolList'),
            toolProjectShape: document.getElementById('toolProjectShape'),
            visibleLayer: document.getElementById('visibleLayer'),
            imageLoader: document.getElementById('imageLoader'),
            imageLoaderLocal: document.getElementById('imageLoaderLocal'),
            layersManager: document.getElementById('layersManager'),
            boardZoom: document.getElementById('boardZoom'),
        }

        if (!project) {
            this.layers = [];
            this.currentLayer = new Layer('Layer', this.currentLayer);
            this.layers.push(this.currentLayer);
            this.project = { layers: this.layers };
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

        this.selectedTool = this.menus.toolList.querySelector('input:checked').value;

        this.loadEvents();
        setTimeout(this.drawAll.bind(this), 1);
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
        if (this.drawingObj || this.layerManager.shapeOver || this.layerManager.needRefresh) {
            this.drawAll();
            this.layerManager.needRefresh = false;
        }
    }
    drawAll() {
        this.clear();
        this.layers.forEach(layer => {

            try {
                if (!layer.error)
                    layer.draw(this.context);
            } catch (e) {
                layer.error = true;
                console.error(`Error drawing layer '${layer.name}'`)
                console.error(e)
            }
        });
        if (this.drawingObj) {
            this.drawingObj.shape.draw(this.context);
            if (this.drawingObj.extraShapes) {
                this.drawingObj.extraShapes.forEach(shape => {
                    shape.draw(this.context);
                });
            }
        }
        if (this.layerManager.shapeOver) {
            const shapeOver = this.layerManager.shapeOver;

            const prop = shapeOver.desc !== CONST.LINE ?
                "backgroundColor" : "borderColor";
            const color = shapeOver[prop];
            shapeOver[prop] = "rgba(255,255,0,0.5)"
            this.layerManager.shapeOver.draw(this.context);
            shapeOver[prop] = color;

        }

        const gridV = parseInt(this.menus.gridV.value);
        const gridH = parseInt(this.menus.gridH.value);
        if (gridV) {
            for (let i = 1; gridV * i < this.canvas.width; i++) {
                const pos = gridV * i;
                new Line([{ x: pos, y: 0 }, { x: pos, y: this.canvas.height }], 'rgba(0,0,0,0.5)', 1).draw(this.context);
            }
        }
        if (gridH) {
            for (let i = 1; gridH * i < this.canvas.height; i++) {
                const pos = gridH * i;
                new Line([{ x: 0, y: pos }, { x: this.canvas.width, y: pos }], 'rgba(0,0,0,0.5)', 1).draw(this.context);
            }
        }
    }
    loadEvents() {
        this.setResizeObserver();
        this.resolutionChangeEvent();
        this.menus.resolution.height.addEventListener('input', this.resolutionChangeEvent.bind(this));
        this.menus.resolution.width.addEventListener('input', this.resolutionChangeEvent.bind(this));
        this.menus.toolList.addEventListener('click', this.toolClickEvent.bind(this));
        this.menus.toolProjectShape.addEventListener('click', this.toolProjectShapeClickEvent.bind(this));
        this.loadColorEvents();
        this.loadLayerComponentsEvents();
        this.loadLayerManager();
        this.loadCanvasEvents();
        document.getElementById('save').addEventListener('click', this.save.bind(this));
        this.canvas.addEventListener('wheel', this.onCanvasWheel.bind(this));
        this.menus.imageLoader.addEventListener("click", this.loadImageEvent.bind(this))
        this.menus.imageLoaderLocal.addEventListener("input", this.loadLocalImageEvent.bind(this))
        this.menus.boardZoom.addEventListener("input", this.boardZoomChange.bind(this));
    }
    boardZoomChange() {
        this.scale = this.menus.boardZoom.value;

        this.canvas.style.width = (parseInt(this.canvas.width) * this.scale / 100) + "px";
        this.canvas.style.height = (parseInt(this.canvas.height) * this.scale / 100) + "px";
        this.layerManager.needRefresh = true;
    }
    loadImageEvent(evt) {
        if (confirm('Load image from URL (Yes) or from Local file (No) ?')) {
            const url = prompt("Image URL:", "https://");
            if (!url) return;
            const img = new Image();

            img.onload = this.imageOnload.bind(this, img)

            img.src = url
        } else {
            this.menus.imageLoaderLocal.click();
        }
    }
    loadLocalImageEvent(evt) {
        if (!evt.target.files || !evt.target.files.length) return;
        //const f = evt.target.files[0];
        for (const f of evt.target.files) {
            if (f) {
                const reader = new FileReader();
                reader.onloadend = loadImageFinish.bind(this)
                reader.readAsDataURL(f);
                const _this = this;
            }
        }
        evt.target.value = '';

        function loadImageFinish(evt) {

            const img = new Image();

            img.onload = this.imageOnload.bind(this, img)

            img.src = evt.target.result;
        }


    }

    imageOnload(img) {
        if ((
            img.width > this.menus.resolution.width.value ||
            img.height > this.menus.resolution.height.value
        ) && confirm(`Do you want to adapt the canvas size to Image ${img.width}x${img.height} ?`)
        ) {
            _this.menus.resolution.width.value = img.width;
            _this.menus.resolution.height.value = img.height;
            (_this.resolutionChangeEvent.bind(_this))();
        }
        const elem = new Picture();
        elem.img = img;
        elem.src = img.src;
        elem.sx = 0;
        elem.sy = 0;
        elem.sw = img.width;
        elem.sh = img.height;
        elem.x = 0;
        elem.y = 0;
        elem.width = img.width;
        elem.height = img.height;
        this.layerManager.createShape(elem);
        this.layerManager.needRefresh = true;
    }

    resolutionChangeEvent() {
        this.canvas.height = this.menus.resolution.height.value;
        this.canvas.width = this.menus.resolution.width.value;
        if (this.layerManager) {
            this.layerManager.needRefresh = true;
        }
    }
    setResizeObserver() {
        if (this.resizeObserver) return;

        const resizeObserver = new ResizeObserver(onResize.bind(this));

        resizeObserver.observe(this.canvas);

        function onResize(entries) {
            for (const entry of entries) {
                if (entry.target.id === 'canvas') {
                    this.resolutionChangeEvent();
                }
            }
        }
    }
    onCanvasWheel(evt) {
        if (evt.ctrlKey) {
            evt.stopImmediatePropagation();
            evt.preventDefault()
            if (evt.deltaY < 0) {
                this.scale += 5;
            } else {
                this.scale -= 5;
            }
            this.menus.boardZoom.value = this.scale;
            this.canvas.style.width = (parseInt(this.canvas.width) * this.scale / 100) + "px";
            this.canvas.style.height = (parseInt(this.canvas.height) * this.scale / 100) + "px";
        }
    }
    loadColorEvents() {
        this.menus.backgroundColor.addEventListener('input', this.updateBgColor.bind(this));
        this.menus.opacity.addEventListener('input', this.updateBgColor.bind(this));

        this.menus.colorRed.addEventListener('input', this.updateBgColorFromRadio.bind(this));
        this.menus.colorGreen.addEventListener('input', this.updateBgColorFromRadio.bind(this));
        this.menus.colorBlue.addEventListener('input', this.updateBgColorFromRadio.bind(this));

        this.updateBgColor();
    }
    updateBgColor() {
        const coloSplitted = this.menus.backgroundColor.value.match(/\w{2}/g);
        const r = parseInt(coloSplitted[0], 16);
        const g = parseInt(coloSplitted[1], 16);
        const b = parseInt(coloSplitted[2], 16);
        const a = this.menus.opacity.value;
        this.menus.bgColor = `rgba(${r},${g},${b},${a})`;

        this.menus.colorRed.value = r;
        this.menus.colorGreen.value = g;
        this.menus.colorBlue.value = b;
    }
    updateBgColorFromRadio() {
        const coloSplitted = this.menus.backgroundColor.value.match(/\w{2}/g);
        const r = this.menus.colorRed.value;
        const g = this.menus.colorGreen.value;
        const b = this.menus.colorBlue.value;
        const a = this.menus.opacity.value;
        const bgColor = `rgba(${r},${g},${b},${a})`;
        this.menus.bgColor = bgColor;
        this.menus.backgroundColor.value = `#${this.toHex(r) + this.toHex(g) + this.toHex(b)}`;
    }
    toHex(n) {
        let r = parseInt(n).toString(16);
        if (r.length === 1) {
            r = "0" + r;
        }
        return r;
    }
    loadLayerComponentsEvents() {

        this.layers.forEach(layer => {
            const option = document.createElement('option');
            option.setAttribute('name', layer.name);
            option.innerHTML = layer.name;
        });

    }
    loadLayerManager() {
        const layersManager = this.menus.layersManager;
        layersManager.innerHTML = "";

        this.layerManager = new LayerManager(this)

    }
    toolClickEvent() {
        const selectedTool = this.menus.toolList.querySelector('input:checked')
        this.selectedTool = selectedTool.value;
        this.canvas.setAttribute('tool', selectedTool.value);
    }
    toolProjectShapeClickEvent() {
        const projectShapeWindow = document.getElementById('projectShapeWindow');

        asyncRequest({ url: '/paintingBoard2/projects/all' }).then(projects => {
            const selectShapeToProject = document.getElementById('selectShapeToProject');
            selectShapeToProject.innerHTML = '';
            projects.forEach(project => {
                const option = document.createElement('option');
                option.value = project.id;
                option.textContent = project.name;
                option.project = project;
                selectShapeToProject.appendChild(option);
            });
            projectShapeWindow.classList.remove('hidden');
        });
    }
    loadCanvasEvents() {
        this.canvas.addEventListener('mousedown', this.canvasMouseDown.bind(this));
        document.body.addEventListener('mouseup', this.canvasMouseUp.bind(this));
        this.canvas.addEventListener('mousemove', this.canvasMouseMove.bind(this));
        this.canvas.addEventListener('dblclick', this.canvasDblClick.bind(this));
        this.canvas.addEventListener('contextmenu', event => event.preventDefault());
    }
    getCurrentPos(evt) {
        const rect = this.canvas.getBoundingClientRect(); // Obtiene la posición del canvas
        let x = Math.round(Math.max(evt.clientX - rect.left, 0)); // Calcula la posición relativa al canvas
        let y = Math.round(Math.max(evt.clientY - rect.top, 0));

        const style = getComputedStyle(this.canvas);
        const styleHeight = parseFloat(style.height);
        const styleWidth = parseFloat(style.width);

        y *= (this.canvas.height / styleHeight);
        x *= (this.canvas.width / styleWidth);


        const round = !this.menus.followGrid.checked ? undefined : {
            x: this.menus.gridH.value || 1,
            y: this.menus.gridV.value || 1,
        };
        let currentPos = new ClickXY({ x, y }, round);

        return currentPos.getSimple();
    }
    canvasMouseDown(evt) {
        if (evt.button === CONST.MOUSE_KEYS.LEFT && this.movingShape) {
            this.movingShape = null;
            this.layerManager.needRefresh = true;
        } else if (evt.button === CONST.MOUSE_KEYS.LEFT) {
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
                case CONST.PROJECT_SHAPE:
                    const shape = this.painting.shape;
                    if (!shape) {
                        showAlert({ type: 'danger', msg: 'No shape selected to paint' })
                        return;
                    }
                    if (!this.painting) {
                        this.painting = { shape: null };
                    }
                    const pos = { 
                        x: parseInt(currentPos.x / shape.width) * shape.width, 
                        y: parseInt(currentPos.y / shape.height) * shape.height
                    };

                    this.painting.shape.add(pos);
                    this.layerManager.needRefresh = true;
                    break;
            }
        } else if (evt.button === CONST.MOUSE_KEYS.RIGHT) {
            evt.stopImmediatePropagation();
            evt.stopPropagation();
            if (this.movingShape) {
                this.movingShape.item.x = this.movingShape.oldPos.x;
                this.movingShape.item.y = this.movingShape.oldPos.y;
                this.movingShape = null;
            }
            if (this.drawingObj && this.selectedTool === CONST.POLYGON) {
                this.drawingObj.shape.points.pop();
                if (!this.drawingObj.shape.points.length) {
                    this.drawingObj = null;
                }
            }
        }
    }
    canvasMouseUp(evt) {
        if (evt.target === this.canvas && this.selectedTool === CONST.COLORPICKER) {
            const colorData = this.getCurrentPositionColor(evt);

            this.menus.backgroundColor.value = colorData.hex;
            this.menus.opacity.value = colorData.alpha;



        }
        if (!this.drawingObj) return;
        if (this.drawingObj.tool === CONST.POLYGON || this.drawingObj.tool === CONST.SEMIARC) return;
        const shape = this.drawingObj.shape;
        if (!shape) return;
        if (shape.desc === CONST.RECT) {
            if (isNaN(shape.x + shape.y + shape.width + shape.height)) {
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
        } else if (shape.desc === CONST.ARC) {
            if (!shape.radius) {
                this.drawingObj = undefined;
                return;
            }
        } else if (shape.desc === CONST.ELLIPSE) {
            if (!shape.radiusX && !shape.radiusY) {
                this.drawingObj = undefined;
                return;
            }
        } else if (shape.desc === CONST.LINE) {
            const points = shape.points;
            if (points[0].x === points[1].x && points[0].y === points[1].y) {
                this.drawingObj = undefined;
                return;
            }
        } else if (shape.desc === CONST.ABSTRACT) {
            if (shape.points.length <= 1) {
                this.drawingObj = undefined;
                return;
            }
        }

        this.layerManager.createShape(this.drawingObj.shape);
        this.drawingObj = undefined;
    }
    canvasMouseMove(evt) {
        const currentPos = this.getCurrentPos(evt);

        if (CONST.PROJECT_SHAPE === this.selectedTool) {
            if (evt.buttons & CONST.MOUSE_KEYS_BUTTONS.LEFT) {
                const shape = this.painting.shape;
                if (!shape) {
                    showAlert({ type: 'danger', msg: 'No shape selected to paint' })
                    return;
                }
                if (!this.painting) {
                    this.painting = { shape: null };
                }
                const pos = {
                    x: parseInt(currentPos.x / shape.width) * shape.width,
                    y: parseInt(currentPos.y / shape.height) * shape.height
                };

                this.painting.shape.add(pos);
                this.layerManager.needRefresh = true;
            } else if (evt.buttons === CONST.MOUSE_KEYS.RIGHT) {

            }
        } else if (this.movingShape) {
            const oldPos = this.movingShape.oldPos;
            const shape = this.movingShape.item;

            if ([CONST.LINE, CONST.PENCIL, CONST.POLYGON, CONST.ABSTRACT, CONST.RUBBER].includes(shape.desc)) {
                const adjustX = oldPos.width / 2;
                const adjustY = oldPos.height / 2;
                const newPoints = oldPos.points.map(point => {
                    return {
                        x: point.x + currentPos.x - adjustX,
                        y: point.y + currentPos.y - adjustY
                    };
                });
                shape.points = newPoints;
            } if ([CONST.ARC, CONST.ELLIPSE, CONST.SEMIARC].includes(shape.desc)) {

                shape.x = currentPos.x;
                shape.y = currentPos.y;
            } else {
                shape.x = currentPos.x - shape.width / 2;
                shape.y = currentPos.y - shape.height / 2;
            }
            this.layerManager.needRefresh = true;
        }
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
                this.layerManager.createShape(shape);
            }
            this.drawingObj = undefined;
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
            if (point.x === points[length - 1].x && point.x === points[length - 2].x || point.y === points[length - 1].y && point.y === points[length - 2].y) {
                drawingObj.shape.points[length - 1] = point;
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
            if (point.x === points[length - 1].x && point.x === points[length - 2].x || point.y === points[length - 1].y && point.y === points[length - 2].y) {
                drawingObj.shape.points[length - 1] = point;
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

            drawingObj.shape = new Rect(currentPos.x, currentPos.y, 0, 0, this.menus.bgColor, this.menus.borderColor.value, this.menus.borderWidth.value);
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
        switch (this.drawingObj.step) {
            case 0:
                arc.radius = Math.sqrt(Math.pow(currentPos.x - arc.x, 2) + Math.pow(currentPos.y - arc.y, 2));
                drawingObj.extraShapes = [
                    new Line([{ x: arc.x, y: arc.y }, { x: currentPos.x, y: currentPos.y }], '#000000', 1)];
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
            arc = new Arc(currentPos.x, currentPos.y, 0, this.menus.bgColor, this.menus.borderColor.value, this.menus.borderWidth.value);
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
        switch (drawingObj.step) {
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

                this.layerManager.createShape(this.drawingObj.shape);
                this.drawingObj = undefined;
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
        const point = this.getCurrentPos(evt);
        if (!isNaN(point.x) && !isNaN(point.y)) {
            const lastPoint = drawingObj.shape.points[drawingObj.shape.points.length - 1];
            if (point.x === lastPoint.x && point.y === lastPoint.y) return;
            drawingObj.shape.points.push(point);
        }
    }
    getCurrentPositionColor(evt) {
        const currentPos = this.getCurrentPos(evt);
        const imgData = this.context.getImageData(currentPos.x, currentPos.y, 1, 1);
        let red = imgData.data[0].toString(16);
        if (red.length < 2) red = '0' + red;
        let green = imgData.data[1].toString(16);
        if (green.length < 2) green = '0' + green;
        let blue = imgData.data[2].toString(16);
        if (blue.length < 2) blue = '0' + blue;
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
        if (!name) {
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
            url: '/paintingBoard2/save',
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