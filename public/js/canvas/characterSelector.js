import {parseLayers} from '../functions.js';


class CharacterSelector {
    constructor(mainDiv, btnNext, btnPrevious, ships) {
        if (!ships || !ships.length) return;
        this.mainDiv = mainDiv;
        this.ships = ships;

        ships.forEach(this.showShip.bind(this));

        this.selected = this.ships.length - 1;
        this.next()

        btnNext.addEventListener("click", this.next.bind(this))
        btnPrevious.addEventListener("click", this.previous.bind(this))
    }

    showShip(ship) {
        const shipBlock = document.createElement("shipsBlock");
        this.mainDiv.appendChild(shipBlock);
        shipBlock.id = "d-" + ship.id;
        shipBlock.className = "shipBlock";

        shipBlock.style.display = "inline-block";
        shipBlock.style.textAlign = "center";
        shipBlock.style.border = "solid 1px";
        const canvas = document.createElement("canvas");
        const label = document.createElement("label");
        label.innerText = ship.name;
        shipBlock.appendChild(canvas);
        shipBlock.appendChild(label);
        const context = canvas.getContext("2d");
        const parsedLayers = parseLayers(ship.layers);


        canvas.width = ship.canvas.width
        canvas.height = ship.canvas.height
        canvas.style.display = "block";
        canvas.style.maxWidth = "200px";
        canvas.style.minWidth = "200px";
        
        ship.parsedLayers = parsedLayers;
        ship.context = context;
        ship.shipBlock = shipBlock;
        shipBlock.style.display = "none";
        parsedLayers.forEach(layer => { layer.draw(context) })
    }

    next() {
        this.ships[this.selected].shipBlock.style.display = 'none';
        this.selected++;
        if (this.selected >= this.ships.length) {
            this.selected = 0;
        }
        this.ships[this.selected].shipBlock.style.display = '';
    }

    previous() {
        this.ships[this.selected].shipBlock.style.display = 'none';
        this.selected--;
        if (this.selected < 0) {
            this.selected = this.ships.length - 1;
        }
        this.ships[this.selected].shipBlock.style.display = '';
    }

    getCurrentShip() {
        return this.selected ? this.ships[this.selected] : null;
    }
}

export default CharacterSelector;