import CONST from '../canvas/constants.js';
import { Layer, Rect } from '../canvas/canvasClasses.js';
import { parseShape, parseLayer, showAlert } from '../functions.js';

class LayerManager {
    constructor(paintingBoard) {
        this.paintingBoard = paintingBoard;
        this.layers = paintingBoard.layers
        this.layersManagerDiv = paintingBoard.menus.layersManager;
        this.context = paintingBoard.context
        const exampleCanvas = this.layersManagerDiv.parentElement.querySelector("canvas");
        this.exampleCanvasContext = exampleCanvas.getContext("2d");
        this.movingItem = undefined;
        this.shapePropertiesTable = document.getElementById("shapePropertiesTable");
        this.shapeEditorWindow = document.getElementById("shapeEditor");

        document.body.addEventListener('mouseup', layersManagerMouseUp.bind(this));
        document.body.addEventListener('mousemove', layersManagerMouseMove.bind(this));
        this.layersManagerDiv.addEventListener('mouseleave', layersManagerMouseUp.bind(this));
        document.getElementById("btnAddLayer").addEventListener('click', this.addNewLayer.bind(this));
        shapePropertiesTable.addEventListener('input', editShapeProperty.bind(this));
        document.querySelectorAll('.window .closeButton').forEach(btn => {
            btn.addEventListener('click', closeWindow.bind(this, btn.parentElement.parentElement));
        });

        if (this.layers) {
            this.currentLayer = this.layers[0];

            for (let layer of this.layers) {
                this.createLayer(layer)
            }

            this.selectLayer(this.layers[0]);
        }
    }

    cleanLayersManager() {
        this.layersManagerDiv.innerHTML = "";
    }


    createLayer(layer) {
        const layerBlock = document.createElement("div");
        layerBlock.classList.add("layersManager_layer");
        this.layersManagerDiv.appendChild(layerBlock);
        layerBlock.layer = layer;
        layerBlock.addEventListener("mousedown", this.selectLayer.bind(this, layer));
        if (this.currentLayer === layer) {
            this.selectLayer(layer, { currentTarget: layerBlock, button: CONST.MOUSE_KEYS.LEFT });
        }

        const layerHead = document.createElement("div");
        layerHead.classList.add("layersManager_layer_head")
        layerBlock.appendChild(layerHead);

        const layerTitle = document.createElement("span");
        layerTitle.classList.add("layersManager_layer_title")
        layerTitle.innerText = layer.name
        layerHead.appendChild(layerTitle);
        layerTitle.addEventListener("mousedown", layersManager_layerShapeMousedown.bind(this, layer, layerBlock));

        // region layer buttons

        const tools = document.createElement("div");
        tools.classList.add("layersManager_layer_tools")
        layerHead.appendChild(tools);

        // layer visibility toggle button
        const layerHideBtn = createButton("&#128065;", "btnLayerHide", "Show/Hide layer", layerToggleVisible.bind(this, layer), tools);
        if (!layer.visible) layerHideBtn.setAttribute("hide", "true")

        // layer rename button
        createButton("&#128393;", "btnLayerEdit", "Edit layer", editLayer.bind(null, layer, layerTitle), tools);

        // copy layer button
        createButton("&#128203;", "btnLayerCopy", "Copy layer", copyLayer.bind(this, layer), tools);

        // layer delete button
        createButton("&Cross;", "btnDeleteLayer", "Delete layer", deleteLayer.bind(this, layer, this.layers, layerBlock), tools);

        // layer show/hide shapes button
        const btnShowShapes = document.createElement("button");
        btnShowShapes.classList.add("btnShowShapes")
        tools.appendChild(btnShowShapes);
        // endregion layer buttons


        const layerShapesBlock = document.createElement("div");
        layerShapesBlock.classList.add("layersManager_layer_shapes")
        layerBlock.appendChild(layerShapesBlock);
        btnShowShapes.addEventListener('click', hideLayerShapes.bind(null, btnShowShapes, layerShapesBlock));

        for (let shape of layer.shapes) {
            layerShapesBlock.appendChild(this._createShapeInternal(shape, layer));
        }
        if (this.layers.indexOf(layer) === -1) {
            this.layers.push(layer)
        }
    }
    createShape(shape) {
        const shapeDiv = this._createShapeInternal(shape);
        this.currentLayerDiv.querySelector(".layersManager_layer_shapes").appendChild(shapeDiv);
        this.updateExampleCanvas();
    }
    _createShapeInternal(shape, layer = this.currentLayer) {
        const shapeHead = document.createElement("div");
        shapeHead.classList.add("layersManager_shapes_head")
        shapeHead.shape = shape;
        shapeHead.layer = layer;
        shapeHead.addEventListener("mouseover", layersManager_shapeOver.bind(this, shape));
        shapeHead.addEventListener("mouseout", layersManager_shapeOut.bind(this, shape));

        const shapeTitle = document.createElement("span");
        shapeTitle.classList.add("layersManager_shapes_title")
        shapeTitle.innerText = shape.name || shape.desc
        shapeTitle.title = `${shape.name || shape.desc} (${shape.desc})`
        shapeTitle.addEventListener("mousedown", layersManager_layerShapeMousedown.bind(this, shape, shapeHead));

        shapeHead.appendChild(shapeTitle);


        // region shape buttons

        const tools = document.createElement("div");
        tools.classList.add("layersManager_shape_tools")
        shapeHead.appendChild(tools);

        // shape move toggle button
        createButton("&#10021;", "btnShapeMove", "Move shape", layersManager_movingShape.bind(this, shape), tools);

        // shape edit button
        createButton("&#128393;", "btnShapeEdit", "Edit shape", editShape.bind(this, shape, shapeTitle), tools);

        // shape copy button
        createButton("&#128203;", "btnShapeCopy", "Copy shape", copyShape.bind(this, shape, layer), tools);

        // shape delete button
        createButton("&Cross;", "btnDeleteShape", "Delete shape", deleteShape.bind(this, shape, layer.shapes, shapeHead), tools);


        // endregion shape buttons

        if (layer.shapes.indexOf(shape) === -1) {
            layer.shapes.push(shape)
        }
        return shapeHead
    }
    selectLayer(layer, evt) {
        if (!evt || evt.button !== CONST.MOUSE_KEYS.LEFT) return;
        this.currentLayer = layer;
        this.currentLayerDiv = evt.currentTarget;
        const layersManagerDiv = this.layersManagerDiv;
        for (let child of layersManagerDiv.children) {
            child.removeAttribute("selected")
        }
        evt.currentTarget.setAttribute("selected", "true")

        this.updateExampleCanvas();

    }
    updateExampleCanvas() {
        if (this.currentLayer) {
            const resolution = this.paintingBoard.menus.resolution;

            this.exampleCanvasContext.canvas.width = resolution.width.value;
            this.exampleCanvasContext.canvas.height = resolution.height.value;

            const visible = this.currentLayer.visible;
            this.currentLayer.visible = true;
            this.currentLayer.draw(this.exampleCanvasContext);
            this.currentLayer.visible = visible;
        }
    }

    addNewLayer() {
        const layer = new Layer("Layer " + (this.layers.length + 1));
        editLayer(layer);
        this.createLayer(layer);
        this.selectLayer(layer, { currentTarget: this.layersManagerDiv.lastChild, button: CONST.MOUSE_KEYS.LEFT });
    }
}

// region Layer events functions

function createButton(text, className, title, onClick, parent) {
    const button = document.createElement("button");
    button.classList.add(className);
    button.innerHTML = text;
    button.title = title;
    button.addEventListener('click', onClick);
    parent.appendChild(button);
    return button;
}

function layersManager_movingShape(shape, evt) {
    if (evt.button !== CONST.MOUSE_KEYS.LEFT) return;
    const oldPos = {};
    if ([CONST.LINE, CONST.PENCIL, CONST.POLYGON, CONST.ABSTRACT, CONST.RUBBER].includes(shape.desc)) {
        oldPos.minX = Math.min(...shape.points.map(p => p.x));
        oldPos.minY = Math.min(...shape.points.map(p => p.y));
        const maxX = Math.max(...shape.points.map(p => p.x));
        const maxY = Math.max(...shape.points.map(p => p.y));
        oldPos.width = maxX - oldPos.minX;
        oldPos.height = maxY - oldPos.minY;
        oldPos.points = shape.points.map(p => ({ x: p.x - oldPos.minX, y: p.y - oldPos.minY }));
        oldPos.origPoints = shape.points;
    } else {
        oldPos.x = shape.x;
        oldPos.y = shape.y;
    }
    this.paintingBoard.movingShape = { item: shape, oldPos: oldPos };
    showAlert({ type: 'info', msg: 'Left click in canvas to move the shape. Right click to cancel', duration: 5000 })
}

function hideLayerShapes(btn, layerShapesBlock) {
    layerShapesBlock.classList.toggle("hidden");
    btn.classList.toggle("closed");
}

function deleteLayer(layer, layers, layerBlock) {
    if (confirm("Delete layer " + layer.name + "?")) {
        layers.splice(layers.indexOf(layer), 1);
        layerBlock.remove();
        if (!layers.length) {
            this.addNewLayer();
        } else {
            this.selectLayer(layers[layers.length - 1], { currentTarget: this.layersManagerDiv.lastChild, button: CONST.MOUSE_KEYS.LEFT });
        }
        this.updateExampleCanvas();
        this.needRefresh = true;
    }
}

function editLayer(layer, layerTitle) {
    const newName = prompt("New layer name", layer.name);
    if (newName) {
        layer.name = newName;
        if (layerTitle) {
            layerTitle.innerText = newName;
        }
    }
}

function copyLayer(layer) {
    const newLayer = parseLayer(JSON.parse(JSON.stringify(layer)));
    newLayer.name = layer.name + " copy";
    this.createLayer(newLayer);
    this.selectLayer(newLayer, { currentTarget: this.layersManagerDiv.lastChild, button: CONST.MOUSE_KEYS.LEFT });
    this.needRefresh = true;
}


function layerToggleVisible(layer, evt) {
    layer.visible = !layer.visible;
    if (layer.visible) {
        evt.target.removeAttribute("hide")
    } else {
        evt.target.setAttribute("hide", "true")
    }
    setTimeout(() => this.needRefresh = true, 1);
}
const pictureRect = new Rect(0, 0, 100, 100);
function layersManager_shapeOver(shape) {
    if (shape.desc === CONST.PICTURE) {
        pictureRect.x = shape.x;
        pictureRect.y = shape.y;
        pictureRect.width = shape.width;
        pictureRect.height = shape.height;
        this.shapeOver = pictureRect;
    } else {
        this.shapeOver = shape;
    }
}

function layersManager_shapeOut(shape) {
    if (this.shapeOver === shape) {
        this.shapeOver = null;
        this.needRefresh = true;
    }
}

// endregion Layer events functions
// region Shape events functions

function editShape(shape, shapeTitle) {
    this.editingShape = { shape, shapeTitle };
    const shapePropertiesTable = this.shapePropertiesTable;
    shapePropertiesTable.querySelectorAll(".propertyRow").forEach(r => r.classList.add("hidden"));
    for (const prop in shape) {
        const input = shapePropertiesTable.querySelector(`[name="${prop}"] input.propertyValue`);
        console.log(prop, input);
        input?.parentElement.parentElement.classList.remove("hidden");
        if (input) {
            let value = shape[prop];
            if (value && "backgroundColor" === prop) {
                input?.parentElement.parentElement.nextElementSibling.classList.remove("hidden");
                const [rgb, alpha] = splitColorAlpha(value);
                value = rgbToHex(rgb);
                shapePropertiesTable.querySelector(`[name="opacity"] input`).value = alpha;

            } else if (["startAngle", "endAngle", "rotation"].includes(prop)) {
                // specific property conversion
                value = radiansToDegrees(value);
            }
            input.value = value;
        }
    }
    this.shapeEditorWindow.style.zIndex = 1000;
    this.shapeEditorWindow.classList.remove("hidden");
}

function copyShape(shape, layer = this.currentLayer) {
    const newShape = JSON.parse(JSON.stringify(shape));
    newShape.name = (newShape.name || newShape.desc) + " copy";
    if ([CONST.LINE, CONST.PENCIL, CONST.POLYGON, CONST.ABSTRACT, CONST.RUBBER].includes(newShape.desc)) {
        const offset = 10;
        newShape.points = newShape.points.map(p => ({ x: p.x + offset, y: p.y + offset }));
        if (newShape.controlPoints) {
            newShape.controlPoints = newShape.controlPoints.map(p => ({ x: p.x + offset, y: p.y + offset }));
        }
    } else {
        newShape.x += 10;
        newShape.y += 10;
    }

    this.createShape(parseShape(newShape));
    this.needRefresh = true;
}

function radiansToDegrees(rad) {
    return rad * (180 / Math.PI);
}
function degreesToRadians(deg) {
    return deg * (Math.PI / 180);
}

function splitColorAlpha(rgba) {
    let parts;
    if (parts = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/)) {
        const r = parseInt(parts[1]);
        const g = parseInt(parts[2]);
        const b = parseInt(parts[3]);
        const a = parseFloat(parts[4]);
        return [[r, g, b], a];
    } else if (parts = rgba.match(/#([0-9a-fA-F]{6})/)) {
        const hex = parts[1];
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return [[r, g, b], 1];
    }
    return [[0, 0, 0], 1];
}

function rgbToHex(rgb) {
    if (Array.isArray(rgb) && rgb.length === 3) {
        const r = rgb[0].toString(16).padStart(2, '0');
        const g = rgb[1].toString(16).padStart(2, '0');
        const b = rgb[2].toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
    }
    return '#000000';
}


function editShapeProperty(evt) {
    const shape = this.editingShape.shape;
    const shapeTitle = this.editingShape.shapeTitle;
    if (!shape) return;
    if (evt.target.tagName !== "INPUT") return;
    const propName = evt.target.name;
    if (propName === "desc") return;
    const propValue = evt.target.value;

    if (propName === "opacity" || propName === "backgroundColor") {
        const bgColorInput = this.shapePropertiesTable.querySelector(`[name="backgroundColor"] input`);
        const opacityInput = this.shapePropertiesTable.querySelector(`[name="opacity"] input`);
        const [rgb,] = splitColorAlpha(bgColorInput.value);
        let alpha = parseFloat(opacityInput.value);
        if (isNaN(alpha) || alpha < 0 || alpha > 1) alpha = 1;

        shape.backgroundColor = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
    } else if (["startAngle", "endAngle", "rotation"].includes(propName)) {
        // specific property conversion
        evt.target.setAttribute("title", `${propValue}°`);
        shape[propName] = degreesToRadians(propValue);
    } else if (evt.target.type === "checkbox") {
        shape[propName] = evt.target.checked;
    } else if (propName === "src") {
        shape.src = encodeURIComponent(propValue);
    } else {
        if (propName === 'name' && shapeTitle) {
            shapeTitle.innerText = propValue;
            shapeTitle.title = `${propValue} (${shape.desc})`
        }
        shape[propName] = propValue;
    }

    this.needRefresh = true;
    this.updateExampleCanvas();
}

function deleteShape(shape, shapes, shapeBlock) {
    //if (confirm("Delete shape " + shape.name + "?")) {
    shapes.splice(shapes.indexOf(shape), 1);
    shapeBlock.remove();

    this.updateExampleCanvas();
    this.shapeOver = null;
    this.needRefresh = true;
    //}
}

// endregion Shape events functions


function layersManager_layerShapeMousedown(item, div, evt) {
    if (evt.button !== CONST.MOUSE_KEYS.LEFT) return;

    this.movingItem = { item, div };

    div.previousParent = div.parentElement;
    div.previousNextSibling = div.nextSibling;
    div.classList.add("moving");

    document.body.appendChild(div);

    div.style.left = evt.clientX + 20 + "px";
    div.style.top = evt.clientY + 20 + "px";
}


function layersManagerMouseUp(evt) {
    const movingItem = this.movingItem;
    this.movingItem = undefined;
    if (!movingItem) return;
    const movingDiv = movingItem.div;

    const layersManager = this.layersManagerDiv;

    if (movingItem) {
        movingDiv.classList.remove("moving");

        let overElem = evt.target;
        try {
            const classToFind = movingDiv.className;
            let forceExit = false;
            while (!overElem.classList.contains(classToFind)
                && overElem !== layersManager && !forceExit) {

                if (overElem === document.body) {
                    forceExit = true;
                    overElem = layersManager;
                    break;
                } else if (classToFind === "layersManager_shapes_head") {
                    if (overElem.className === "layersManager_layer_shapes") {
                        forceExit = true;
                    } else {
                        overElem = overElem.parentElement;
                    }
                } else {
                    overElem = overElem.parentElement;
                }

            }
        } catch (e) {
            overElem = layersManager;
        }
        if (overElem === layersManager) {
            if (movingDiv.previousNextSibling) {
                const previousNextSibling = movingDiv.previousNextSibling;
                previousNextSibling.parentElement.insertBefore(movingDiv, previousNextSibling)
            } else {
                movingDiv.previousParent.appendChild(movingDiv)
            }
        } else if (overElem.classList.contains("layersManager_layer_shapes")) {
            if (!overElem.childElementCount) {
                overElem.appendChild(movingDiv)
            } else {
                overElem.insertBefore(movingDiv, overElem.firstElementChild)
            }
        } else {
            overElem.parentElement.insertBefore(movingDiv, overElem)
        }
        if (movingDiv.shape) { // is a shape
            if (movingDiv.layer !== overElem.layer) {
                movingDiv.layer.shapes.splice(movingDiv.layer.shapes.indexOf(movingDiv.shape), 1);
                const overIndex = overElem.layer.shapes.indexOf(overElem.shape);
                if (overIndex === -1) {
                    overElem.layer.shapes.push(movingDiv.shape)
                } else {
                    overElem.layer.shapes.splice(overIndex, 0, movingDiv.shape)
                }
                console.log(this.layers);
            } else {
                // same layer, just reorder
                if (movingDiv.shape !== overElem.shape) {
                    movingDiv.layer.shapes.splice(movingDiv.layer.shapes.indexOf(movingDiv.shape), 1);
                    const overIndex = movingDiv.layer.shapes.indexOf(overElem.shape);
                    movingDiv.layer.shapes.splice(overIndex, 0, movingDiv.shape)
                    console.log(this.layers);
                }
            }

        } else { // is a layer
            if (overElem.layer !== movingDiv.layer) {
                this.layers.splice(this.layers.indexOf(movingDiv.layer), 1);
                const overIndex = this.layers.indexOf(overElem.layer);
                this.layers.splice(overIndex, 0, movingDiv.layer)
            }
        }
    }
}



function closeWindow(window) {
    if (window.id == "shapeEditor") {
        this.editingShape = null;
    }
    window.classList.add("hidden");
}

function layersManagerMouseMove(evt) {
    const movingItem = this.movingItem;
    if (!movingItem) return

    const x = evt.clientX + 20;
    const y = evt.clientY + 20;

    movingItem.div.style.left = x + "px"
    movingItem.div.style.top = y + "px"
}

export default LayerManager