import {
    ClickXY
    /*Arc,
    Layer,
    Line,
    Rect,
    Text
        Rubber,
        ClickXY,
        Abstract,
        Ellipse,
        MasterJasonFile,
        Pencil,
        Picture,
        Polygon*/
} from '../canvas/canvasClasses.js';

let eventsLoaded = false;
let bool_movingWin = false;
let selWin, selElem, tempElem, tempElem2 = null;
let checked = null;

let board, boardL, boardT = null;
let windows = [];

function windowsEvents(canvas) {
    if (eventsLoaded) return;
    board = canvas;

    boardL = board.getBoundingClientRect().left;
    boardT = board.getBoundingClientRect().top;
    //EVENTS
    //CLICK EVENTS
    /*
        board.addEventListener("mousedown", clickedDown);
        //board.addEventListener("touchstart", clickedDown);
        board.addEventListener("dblclick", dblClicked);
        document.body.addEventListener("mouseup", clickedUp);
        //document.body.addEventListener("touchend", clickedUp);
        document.addEventListener("mousemove", clickedMove);
        //document.addEventListener("touchmove", clickedMove);
    
        //KEY EVENTS
        ////BODY
        ////UNDO REDO
        document.body.addEventListener("keydown", function (evt) {
            keys[evt.keyCode] = true;
            document.getElementById("txtPressedKey").value = evt.keyCode;
            //CTRL+Z
            if (keys[17] && keys[90] && undoEnabled && elements.length > 0) {
                undoEnabled = false;
                delElements.push(elements.pop());
                redoElemTable();
            }
            //CTRL+Y
            if (keys[17] && keys[89] && undoEnabled && delElements.length > 0) {
                undoEnabled = false;
                elements.push(delElements.pop());
                redoElemTable();
            }
        });
    
        document.body.addEventListener("keyup", function (evt) {
            keys[evt.keyCode] = false;
    
            if (!keys[17] || (!keys[90] && !keys[89])) {
                undoEnabled = true;
            }
        });*/

    //RADIOBUTTON CHANGE
    let rdBtns = document.getElementsByName("action");
    if (rdBtns) {
        for (let rdBtn of rdBtns) {
            rdBtn.onchange = function () {
                tempElem = null;
                tempElem2 = null;
                checked = false;
            };
        }
    }

    //WINDOW EVENTS
    let i = 0;
    for (let window of document.getElementsByClassName("window")) {
        window.style.zIndex = i++;
        windows.push(window)
    }


    let windowBars = document.getElementsByClassName("windowBar");
    for (let windowBar of windowBars) {
        //let win = windowBar.parentElement;
        windowBar.parentElement.style.zIndex = 1;
        windowBar.onmousedown = clickedWinBar;
    }
    document.body.onmousemove = movedWinBar
    document.body.onmouseup = unclickedWinBar

    document.getElementById("boardW").addEventListener("change", function () {
        boardWHChanged(this);
    });
    document.getElementById("boardH").addEventListener("change", function () {
        boardWHChanged(this);
    });
    eventsLoaded = true;
}


function getMousePosition(evt) {
    let click;
    if (evt.clientX != undefined) {
        click = new ClickXY({ x: parseInt(evt.clientX - boardL), y: parseInt(evt.clientY - boardT) });
    } else if (evt.touches[0].clientX != undefined) {
        click = new ClickXY(parseInt(evt.touches[0].clientX - boardL), parseInt(evt.touches[0].clientY - boardT));
    }
    //click.x += scrollX;//document.scrollingElement.scrollLeft;
    //click.y += scrollY;//document.scrollingElement.scrollTop;
    if (document.getElementById("followGrid").checked && !bool_movingWin) {
        let gridH = document.getElementById("gridH").value;
        let gridV = document.getElementById("gridV").value;
        if (gridH > 0) {
            click.y = Math.round(click.y / gridH) * gridH;
        }
        if (gridV > 0) {
            click.x = Math.round(click.x / gridV) * gridV;
        }
    }
    return click;
}

function clickedWinBar(evt) {
    //evt.target.style.zIndex = 1;

    bool_movingWin = true;
    selWin = this.parentElement;
    selWin.style.zIndex = 2;
    selWin.difX = evt.clientX - parseInt(selWin.style.left)
    selWin.difY = evt.clientY - parseInt(selWin.style.top)
}

function movedWinBar(evt, win) {
    if (bool_movingWin) {
        let w = parseInt(window.getComputedStyle(selWin).width);
        let h = parseInt(window.getComputedStyle(selWin).height);
        let mouse = getMousePosition(evt)
        mouse = new ClickXY({ x: parseInt(evt.clientX), y: parseInt(evt.clientY) });

        const maxLeft = parseInt(getComputedStyle(document.body).width) - parseInt(getComputedStyle(selWin).width)

        const posL = Math.min(Math.max(evt.clientX - selWin.difX, 0), maxLeft);
        const posT = Math.max(evt.clientY - selWin.difY, 0)

        selWin.style.left = posL + "px";
        selWin.style.top = posT + "px";
    }
}

function unclickedWinBar(evt) {
    bool_movingWin = false;
    selElem = null;
    if (bool_movingWin) {
        selWin.style.zIndex = 1;
    }
}

export default windowsEvents;