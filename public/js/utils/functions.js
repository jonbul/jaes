"use strict";
import CanvasClasses from '/js/canvas/canvasClasses.js';
import CONST from '/constants.js';
import { ALERT_TYPES } from '/constants.js';
async function asyncRequest({ path, method, data, silent = false }) {
    const token = await cookieStore.get('token');
    return fetch(path, {
        method: method || 'GET',
        headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            'Authorization': `${token ? 'Bearer ' + token.value : ''}`
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
                    cookieStore.delete('token');
                    localStorage.removeItem('user');
                } else if (response.status === 403) {
                    err = 'Forbidden';
                } else if (response.status === 404) {
                    err = 'Not Found';
                } else if (response.status === 500) {
                    err = 'Internal Server Error';
                }
                err += `(${response.status})`;
                if (!silent) showAlert({ type: ALERT_TYPES.DANGER, msg: err, title: 'Error' });
                let errors = null;
                try {
                    const parsedText = JSON.parse(text);
                    err += ": " + parsedText.errors;
                    if (parsedText) {
                        errors = parsedText.errors;
                    }
                } catch { if (text) err += `: ${text}`; }
                console.error({ status: response.status, response: err, text, errors });
                return null;
            });
        }
        if (method && method.toUpperCase() !== 'GET') {
            //showAlert({ type: ALERT_TYPES.SUCCESS, msg: 'Operation successful', title: 'Success' });
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

async function refreshToken() {
    asyncRequest({path: '/refreshToken', method: 'POST'}).then(data => {
        if (data?.success) {
            if (data.expirationTime) {
                const expirationTime = new Date(data.expirationTime).getTime();
                localStorage.setItem('sessionExpiration', expirationTime);
                // Refresh token 5 minutes before expiration
                setRefreshTokenTimeout();
            }
        } else {
            console.error('Failed to refresh token:', data.error);
        }
    }).catch(err => {
        console.error('Error refreshing token:', err);
    });
}

async function setRefreshTokenTimeout () {
    const sessionExpiration = localStorage.getItem('sessionExpiration');
    if (sessionExpiration) {
        const expirationTime = parseInt(sessionExpiration, 10);
        if (expirationTime === -1) return; // Persistent session
        if (expirationTime > 0 && Date.now() < expirationTime) {
            // Refresh token 5 minutes before expiration
            let timeoutMs = expirationTime - Date.now() - 300000;
            if (timeoutMs > 10 * 24* 3600000) {
                timeoutMs = 10 * 24* 3600000;//a safe value to prevent overflow in setTimeout
            }
            setTimeout(refreshToken, timeoutMs);
        }
    } else {
        refreshToken();
    }
}

export default { asyncRequest, showAlert, parseLayers, parseLayer, parseShape, refreshToken, setRefreshTokenTimeout };
export { asyncRequest, showAlert, parseLayers, parseLayer, parseShape, refreshToken, setRefreshTokenTimeout };
