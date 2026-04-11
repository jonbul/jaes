import { asyncRequest } from '/js/utils/functions.js';
document.addEventListener('DOMContentLoaded', async function () {
    // Menu events
    const button = document.querySelector('.navbar-button');
    const menu = document.getElementById('navbarMenu');
    button.addEventListener('click', function () {
        menu.toggleAttribute('collapsed-expanded', menu.hasAttribute('collapsed-expanded') ? '' : 'true');
    });

    // User session handling
    const lsToken = localStorage.getItem('token');
    if (lsToken) {
        const ckTokenObj = await cookieStore.get('token');
        const ckToken = ckTokenObj ? ckTokenObj.value : null;
        if (lsToken !== ckToken) {
            cookieStore.delete('token');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }

        let user = localStorage.getItem('user');
        if (!user) {
            user = await asyncRequest({ path: '/userInfo', method: 'GET' });
            if (user) {
                localStorage.setItem('user', JSON.stringify(user));
            }
        }
    } else {
        cookieStore.delete('token');
        localStorage.removeItem('user');
    }


    const user = JSON.parse(localStorage.getItem('user'));
    const username = user ? user.username : null;
    const usernameElement = document.getElementById('username');
    if (username && usernameElement) {
        usernameElement.textContent = ` ${username}`;
    }

    document.getElementById('mainNavbar').querySelectorAll(".navbarMenu>.nav-item").forEach(item => {
        if (username) {
            if (item.classList.contains('nologged')) {
                item.style.display = 'none';
            }
            if (item.classList.contains('profile')) {
                item.querySelector('span[name="username"]').textContent = username;
            }
            if (item.classList.contains('admin') && !user.isAdmin) {
                item.style.display = 'none';
            }
        } else {
            if (item.classList.contains('logged')) {
                item.style.display = 'none';
            }
        }
    });

});