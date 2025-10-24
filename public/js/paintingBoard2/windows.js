import CONST from '../../../constants.js';

let eventsLoaded = false;
let bool_movingWin = false;
let selWin = null;

let windows = [];

function windowsEvents() {
    if (eventsLoaded) return;

    //WINDOW EVENTS
    let i = 0;

    for (let window of document.getElementsByClassName("window")) {
        window.style.zIndex = i++;
        windows.push(window)
        window.onmousedown = clickedWin.bind(this, window);
    }

    let windowBars = document.getElementsByClassName("windowBar");
    for (let windowBar of windowBars) {
        windowBar.parentElement.style.zIndex = 1;
        windowBar.onmousedown = clickedWinBar;
    }
    document.body.onmousemove = movedWinBar
    document.body.onmouseup = unclickedWinBar

    const shapeRotationInput = document.getElementById("shapeRotation");

    document.getElementById("shapeRotationRangeStep").addEventListener('input', e => {
        shapeRotationInput.setAttribute("step", e.target.value);
    });

    eventsLoaded = true;
}

function clickedWinBar(evt) {
    if (evt.button === CONST.MOUSE_KEYS.LEFT) {
        bool_movingWin = true;
    }
}

function clickedWin(window, evt) {
    selWin = window;
    if (evt.button === CONST.MOUSE_KEYS.LEFT) {
        for (let win of windows) {
            win.style.zIndex = 1;
        }
        window.style.zIndex = 2;
        if (window.style.left) {
            window.difX = evt.clientX - parseInt(window.style.left);
        } else {
            window.difX = evt.clientX - (parseInt(getComputedStyle(document.body).width) - parseInt(getComputedStyle(window).width) - parseInt(window.style.right));
        }
        window.difY = evt.clientY - parseInt(window.style.top)
    }
}

function movedWinBar(evt) {
    if (bool_movingWin) {
        const posT = Math.max(evt.clientY - selWin.difY, 0)
        selWin.style.top = posT + "px";

        if (selWin.style.right) {
            const maxRight = parseInt(getComputedStyle(document.body).width) - parseInt(getComputedStyle(selWin).width)
            const posR = Math.min(Math.max(maxRight - (evt.clientX - selWin.difX), 0), maxRight);
            selWin.style.right = posR + "px";
        } else {
            const maxLeft = parseInt(getComputedStyle(document.body).width) - parseInt(getComputedStyle(selWin).width)
            const posL = Math.min(Math.max(evt.clientX - selWin.difX, 0), maxLeft);
            selWin.style.left = posL + "px";

        }
    }
}

function unclickedWinBar() {
    bool_movingWin = false;
    if (bool_movingWin) {
        selWin.style.zIndex = 1;
    }
}

export default windowsEvents;