"use strict";
import CanvasClasses from './canvas/canvasClasses.js';
import CONST from '../../constants.js';
import { ALERT_TYPES } from '../../constants.js';
function asyncRequest({ url, method, data }) {
    return fetch(url, {
        method: method || 'GET',
        headers: {
            'Content-Type': 'application/json;charset=UTF-8'
        },
        body: data && typeof data === "object" ? JSON.stringify(data) : data
    }).then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                let err;
                if (response.status === 400) {
                    err = 'Bad Request';
                } else if (response.status === 401) {
                    err = 'Unauthorized';
                } else if (response.status === 403) {
                    err = 'Forbidden';
                } else if (response.status === 404) {
                    err = 'Not Found';
                } else if (response.status === 500) {
                    err = 'Internal Server Error';
                }
                err += `(${response.status})`;
                showAlert({ type: ALERT_TYPES.DANGER, msg: err, title: 'Error' });
                try {
                    err += ": " + JSON.parse(text);
                } catch (e) { if (text) err += `: ${text}`; }
                return Promise.reject(err);
            });
        }
        if (method && method.toUpperCase() !== 'GET') {
            showAlert({ type: ALERT_TYPES.SUCCESS, msg: 'Operation successful', title: 'Success' });
        }
        return response.json().catch(() => response.text());
    });
}


function showAlert({ type = 'danger', msg, title, duration = 3000 }) {
    const validTypes = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'];
    if (validTypes.indexOf(type) === -1) {
        console.warn('Valid types are:', validTypes);
        console.warn('Message is ', msg);
        return;
    }
    if (!msg) return;

    const alertBlock = document.createElement('div');
    alertBlock.className = `alert ${type} alert-dismissible fade customAlert`;
    alertBlock.setAttribute('role', '');
    alertBlock.innerHTML = `
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
        <span aria-hidden="true">&times;</span>
    </button>
    <strong id="alertTitle">${title || '&nbsp;'}</strong>
    <div id="alertMessage"></div>`;
    if (window.alerts.firstElementChild) {
        window.alerts.insertBefore(alertBlock, window.alerts.firstElementChild);
    } else {
        window.alerts.appendChild(alertBlock);
    }
    const alertMessage = alertBlock.querySelector('#alertMessage');

    if (msg instanceof Array) {
        const list = document.createElement('ul');
        msg.forEach(text => {
            const li = document.createElement('li');
            li.innerHTML = text;
            list.appendChild(li);
        });
        alertMessage.appendChild(list)
    } else {
        alertMessage.innerHTML = msg;
    }
    alertBlock.querySelector('.close').addEventListener('click', e => {
        e.preventDefault();
        closeAlert(alertBlock);
    });

    setTimeout(() => { alertBlock.classList.add('show'); }, 0);
    setTimeout(closeAlert.bind(null, alertBlock), duration);
}

function closeAlert(alertBlock) {
    alertBlock.classList.remove('show')
    setTimeout(() => {
        alertBlock.remove();
    }, 600);
}

function parseLayers(layers) {
    const parsedLayers = [];
    layers.forEach(layer => {
        parsedLayers.push(parseLayer(layer));
    });
    return parsedLayers
}

function parseLayer(layer) {
    const newLayer = new CanvasClasses.Layer(layer.name);
    layer.shapes.forEach(shape => {
        newLayer.shapes.push(parseShape(shape));
    });
    return newLayer;
}

function parseShape(shape) {
    const newShape = new CanvasClasses[shape.desc]();
    for (const prop in shape) newShape[prop] = shape[prop]

    if (CONST.PICTURE === newShape.desc) {
        const img = new Image()
        img.src = newShape.src;
        newShape.img = img;
    } else if (CONST.PROJECT_SHAPE === newShape.desc) {
        newShape.layers = parseLayers(newShape.layers);
    }
    return newShape;
}

export default { asyncRequest, showAlert, parseLayers, parseLayer, parseShape };
export { asyncRequest, showAlert, parseLayers, parseLayer, parseShape };
