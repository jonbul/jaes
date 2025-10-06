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

        /*const layerUpBtn = document.createElement("button");
        layerUpBtn.classList.add("btnLayerUp")
        layerUpBtn.innerHTML = "&#708;"
        tools.appendChild(layerUpBtn);
        const layerDownBtn = document.createElement("button");
        layerDownBtn.classList.add("btnLayerDown")
        layerDownBtn.innerHTML = "&#709;";
        tools.appendChild(layerDownBtn);*/

        const layerHideBtn = document.createElement("button");
        layerHideBtn.classList.add("btnLayerHide")
        layerHideBtn.innerHTML = "&#9215;";
        layerHideBtn.style.color = "#000"
        tools.appendChild(layerHideBtn);

        const layerRename = document.createElement("button");
        layerRename.classList.add("btnLayerEdit")
        layerRename.innerHTML = "&#128393;";
        tools.appendChild(layerRename);
        layerRename.addEventListener('click', editLayer.bind(this, layer))
        const btnDeleteLayer = document.createElement("button");
        btnDeleteLayer.classList.add("btnDeleteLayer")
        btnDeleteLayer.innerHTML = "&Cross;";
        tools.appendChild(btnDeleteLayer);
        const btnShowShapes = document.createElement("button");
        btnShowShapes.classList.add("btnShowShapes")
        tools.appendChild(btnShowShapes);
        // endregion layer buttons


        const layerShapesBlock = document.createElement("div");
        layerShapesBlock.classList.add("layersManager_layer_shapes")
        layerBlock.appendChild(layerShapesBlock);

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

function editLayer(layer) {
    const newName = prompt("New layer name", layer.name);
    if (newName) layer.name = newName;
}

function editShape(layer) {
    const newName = prompt("New layer name", layer.name);
    if (newName) layer.name = newName;
}

function layersManager_layerShapeMousedown(item, div, evt) {
    if (evt.button !== CONST.MOUSE_KEYS.LEFT) return;
    console.log(evt.target);

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


function layersManagerMouseUp(evt) {
    const movingItem = this.movingItem;
    this.movingItem = undefined;
    console.log({ target: evt.target, currentTarget: evt.currentTarget })
    if (!movingItem) return;

    const layersManager = this.layersManagerDiv;

    if (movingItem) {
        movingItem.div.classList.remove("moving");

        let overElem = evt.target;
        try {
            while (!overElem.classList.contains("layersManager_shapes_head")
                && !overElem.classList.contains("layersManager_layer_shapes")
                && !overElem.classList.contains("layersManager_layer")
                && overElem !== layersManager) {
                overElem = overElem.parentElement
            }
        } catch (e) {
            overElem = layersManager;
        }
        if (overElem === layersManager) {
            if (movingItem.div.previousNextSibling) {
                const previousNextSibling = movingItem.div.previousNextSibling;
                previousNextSibling.parentElement.insertBefore(movingItem.div, previousNextSibling)
            } else {
                movingItem.div.previousParent.appendChild(movingItem.div)
            }
        } else if (overElem.classList.contains("layersManager_layer_shapes")) {
            if (!overElem.childElementCount) {
                overElem.appendChild(movingItem.div)
            } else {
                overElem.insertBefore(movingItem.div, overElem.firstElementChild)
            }
        } else {
            overElem.parentElement.insertBefore(movingItem.div, overElem)
        }
    }
    console.log("mouseUp", evt)
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