"use strict";
import { asyncRequest, showAlert } from "/js/utils/functions.js"

async function onRegisterSubmit(event) {
    event.preventDefault();
    const fd = document.getElementById('form-register');
    const form = {
        username: fd.querySelector('input#username').value,
        email: fd.querySelector('input#inputEmail').value,
        password: fd.querySelector('input#inputPassword').value,
        cpassword: fd.querySelector('input#inputRepeatPassword').value
    };
    const messages = [];
    if (!form.email || !form.password || !form.username || !form.cpassword) {
        messages.push('Please enter all required fields');
    }
    if (form.password !== form.cpassword) {
        messages.push('Passwords must be equal')
    }
    if (!form.password.match(/^(?!^ )(?!.* .*)(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}$/)) {
        messages.push('Password must contain at least a number an uppercase letter and a lowercase letter;')
    }

    if (messages.length) {
        return showAlert({ msg: messages, title: 'Some errors found:' });
    }
    try {
        const result = await asyncRequest({
            path: '/register',
            method: 'POST',
            data: form
        });
        if (result.success) {
            return location.href = '/login';
        }
    } catch (err) {

        try {
            showAlert({ msg: err.errors || err.response || err, title: 'Some errors happened:' });
        } catch {
            showAlert({ msg: err.response || err, title: 'Some errors happened:' });
        }
    }
}

document.getElementById('register').addEventListener('click', onRegisterSubmit);