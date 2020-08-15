import CONST from '../canvas/constants.js';
import CLASSES from '../canvas/canvasClasses.js';

class CharacterEditor {
    constructor (canvas, nameInput) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');

        

        

        this.menus = {
            tools: document.getElementById('toolList')
        }

        this.selectedTool = this.menus.tools.querySelector('.active').nodeValue;

        this.loadEvents();
    }
    loadEvents() {
        this.menus.tools.addEventListener('click', this.toolClickEvent.bind(this));
        this.loadCanvasEvents();
    }
    toolClickEvent(evt) {
        if (evt.target.className.split(' ').indexOf('active') >= 0) {
            this.selectedTool = evt.target.value;
        } else {
            this.selectedTool = this.menus.tools.querySelector('.active').nodeValue;
        }
    }
    loadCanvasEvents() {
        this.canvas.addEventListener('mousedown', this.canvasMouseDown);
        this.canvas.addEventListener('mouseup', this.canvasMouseUp);
        this.canvas.addEventListener('mousemove', this.canvasMouseMove);
    }
    canvasMouseDown(evt) {
        this.drawing = {
            tool: this.selectedTool,
            shape:
        }
    }
}

export default CharacterEditor;