import CONST from '../canvas/constants.js';
import { Layer } from '../canvas/canvasClasses.js';

class LayerManager {
    constructor(paintingBoard) {
        this.paintingBoard = paintingBoard;
        this.layers = paintingBoard.layers
        this.layersManagerDiv = paintingBoard.menus.layersManager;
        this.context = paintingBoard.context

        document.body.addEventListener('mouseup', layersManagerMouseUp.bind(this));
        document.body.addEventListener('mousemove', layersManagerMouseMove.bind(this));

        if (this.layers) {
            for (let layer of this.layers) {
                this.createLayer(layer)
            }
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
        const layerHideBtn = document.createElement("button");
        layerHideBtn.classList.add("btnLayerHide")
        layerHideBtn.innerHTML = "&#9215;";
        tools.appendChild(layerHideBtn);
        layerHideBtn.addEventListener('click', layerToggleVisible.bind(null, layer, layerHideBtn))
        if (!layer.visible) layerHideBtn.setAttribute("hide", "true")

        // layer rename button
        const layerRename = document.createElement("button");
        layerRename.classList.add("btnLayerEdit")
        layerRename.innerHTML = "&#128393;";
        tools.appendChild(layerRename);
        layerRename.addEventListener('click', editLayer.bind(null, layer, layerTitle))

        // layer delete button
        const btnDeleteLayer = document.createElement("button");
        btnDeleteLayer.classList.add("btnDeleteLayer")
        btnDeleteLayer.innerHTML = "&Cross;";
        tools.appendChild(btnDeleteLayer);
        btnDeleteLayer.addEventListener('click', deleteLayer.bind(this, layer, this.layers, layerBlock));

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
            layerShapesBlock.appendChild(this.createShape(shape, layer));
        }
        if (this.layers.indexOf(layer) === -1) {
            this.layers.push(layer)
        }
    }

    createShape(shape, layer) {
        const shapeHead = document.createElement("div");
        shapeHead.classList.add("layersManager_shapes_head")
        shapeHead.shape = shape;
        shapeHead.layer = layer;
        shapeHead.addEventListener("mouseover", layersManager_shapeOver.bind(this, shape));

        const shapeTitle = document.createElement("span");
        shapeTitle.classList.add("layersManager_shapes_title")
        shapeTitle.innerText = shape.name || shape.desc
        shapeTitle.addEventListener("mousedown", layersManager_layerShapeMousedown.bind(this, shape, shapeHead));

        shapeHead.appendChild(shapeTitle);


        // region shape buttons



        // endregion shape buttons

        if (layer.shapes.indexOf(shape) === -1) {
            layer.shapes.push(shape)
        }
        return shapeHead
    }
}

function hideLayerShapes(btn, layerShapesBlock) {
    layerShapesBlock.classList.toggle("hidden");
    btn.classList.toggle("closed");
}    

function deleteLayer(layer, layers, layerBlock) {
    if (confirm("Delete layer " + layer.name + "?")) {
        layers.splice(layers.indexOf(layer), 1);
        layerBlock.remove();
    }
    if (!layers.length) {
        const layer = new Layer("Layer 1");
        editLayer(layer);
        this.createLayer(layer);
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

function editShape(layer) {
    const newName = prompt("New layer name", layer.name);
    if (newName) layer.name = newName;
}

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
function layersManager_shapeOver(shape, evt) {
    const color = shape.backgroundColor;
    shape.backgroundColor = "rgba(255,255,0,0.5)"
    shape.draw(this.context);
    shape.backgroundColor = color;
}

function layerToggleVisible(layer, btn) {
    layer.visible = !layer.visible;
    if (layer.visible) {
        btn.removeAttribute("hide")
    } else {
        btn.setAttribute("hide", "true")
    }
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
                console.log(this.layers);
            }
        }
    }
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