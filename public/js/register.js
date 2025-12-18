"use strict";
import { asyncRequest, showAlert } from "/js/functions.js"

const initRegister = () => {
    document.getElementById('form-register').addEventListener('submit', onRegisterSubmit);
}

async function onRegisterSubmit(event) {
    event.preventDefault();
    const fd = new FormData(document.getElementById('form-register'));
    const form = {};
    fd.forEach(function (value, key) {
        form[key] = value;
    });
    const messages = [];

    if (form.password !== form.cpassword) {
        messages.push('Passwords must be equals')
    }
    if (!form.password.match(/^(?!^ )(?!.* .*)(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{5,}$/)) {
        messages.push('Password must contain at least a number an upercase letter and a lowercase letter;')
    }

    if (messages.length) {
        return showAlert({ msg: messages, title: 'Some errors found:' });
    }
    const result = await asyncRequest({
        url: '/register',
        method: 'POST',
        data: form
    });
    if (result.success) {
        return location.href = '/login';
    }
    try {
        showAlert({ msg: JSON.parse(result.response).errors, title: 'Some errors happened:' });
    } catch {
        showAlert({ msg: result.response || result, title: 'Some errors happened:' });
    }
}

export { initRegister };