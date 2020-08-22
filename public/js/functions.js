"use strict";
function asyncRequest({url, method, data}) {
    return new Promise((resolve, reject) => {
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState === 4) {
                let response = this.responseText;
                try {
                    response = JSON.parse(this.responseText);
                } catch(e) {
                }
                resolve({
                    response,
                    success: this.status === 200
                });
            }
        };
        xhttp.open(method || 'GET', url);
        xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        if (data && typeof data === "object") data = JSON.stringify(data);
        xhttp.send(data);
    });
}

function showAlert({type = 'danger', msg, title}) {
    const validTypes = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'];
    if (validTypes.indexOf(type) === -1) {
        console.warn('Valid types are:', validTypes);
        console.warn('Message is ', msg);
        return;
    }
    if (!msg) return;
    
    const alertBlock = document.createElement('div');
    alertBlock.className = `alert alert-${type} alert-dismissible fade customAlert`;
    alertBlock.setAttribute('role', '');
    alertBlock.innerHTML = `
    <strong id="alertTitle">${title || '&nbsp;'}</strong>
    <span id="alertMessage"></span>
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
        <span aria-hidden="true">&times;</span>
    </button>`;
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
    alertBlock.classList.add('show');
}

export {asyncRequest, showAlert};
