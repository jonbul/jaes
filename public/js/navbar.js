import { asyncRequest } from '/js/utils/functions.js';
document.addEventListener('DOMContentLoaded', async function () {
    // Menu events
    const button = document.querySelector('.navbar-button');
    const menu = document.getElementById('navbarMenu');
    button.addEventListener('click', function () {
        menu.toggleAttribute('collapsed-expanded', menu.hasAttribute('collapsed-expanded') ? '' : 'true');
    });

    // User session handling
    const ckToken = (await cookieStore.get('token'))?.value;
    let user = undefined;
    if (ckToken) {

        let lsUser = localStorage.getItem('user');
        if (!lsUser) {
            user = await asyncRequest({ path: '/userInfo', method: 'GET' });
            if (user) {
                localStorage.setItem('user', JSON.stringify(user));
            }
        } else {
            user = JSON.parse(lsUser);
        }
        let username = user?.username;
        const usernameElement = document.getElementById('username');
        if (username && usernameElement) {
            usernameElement.textContent = ` ${username}`;
        }
    }

    document.getElementById('mainNavbar').querySelectorAll(".navbarMenu>.nav-item").forEach(item => {
        if (user) {
            if (item.classList.contains('nologged')) {
                item.style.display = 'none';
            }
            if (item.classList.contains('profile')) {
                item.querySelector('span[name="username"]').textContent = user.username;
            }
            if (item.classList.contains('admin') && !user.admin) {
                item.style.display = 'none';
            }
        } else {
            if (item.classList.contains('logged')) {
                item.style.display = 'none';
            }
        }
    });

});