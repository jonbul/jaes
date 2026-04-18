import { asyncRequest, refreshToken, setRefreshTokenTimeout } from '/js/utils/functions.js';
document.addEventListener('DOMContentLoaded', async function () {
    // Menu events
    const button = document.querySelector('.navbar-button');
    const menu = document.getElementById('navbarMenu');
    button.addEventListener('click', function () {
        menu.toggleAttribute('collapsed-expanded', menu.hasAttribute('collapsed-expanded') ? '' : 'true');
    });

    // User session handling
    let user = await asyncRequest({ path: '/userInfo', method: 'GET', silent: true });
    if (user) {
        localStorage.setItem('user', JSON.stringify(user));
    } else {
        localStorage.removeItem('user');
        localStorage.removeItem('sessionExpiration');
    }

    const logged = !!user;

    // Session expiration handling
    let sessionExpiration = localStorage.getItem('sessionExpiration');
    if (logged && !sessionExpiration) {
        refreshToken();
        sessionExpiration = localStorage.getItem('sessionExpiration');
    }

    if (sessionExpiration) {
        const expirationTime = parseInt(sessionExpiration, 10);
        if (Date.now() > expirationTime) {
            localStorage.removeItem('user');
            localStorage.removeItem('sessionExpiration');
            window.location.href = '/';
        }
        if (expirationTime > 0) {
            // Refresh token 5 minutes before expiration
            setRefreshTokenTimeout();
        }
    }

    let username = user?.username || 'Guest';
    const usernameElement = document.getElementById('username');
    if (usernameElement) {
        usernameElement.textContent = ` ${username}`;
    }

    document.getElementById('mainNavbar').querySelectorAll(".navbarMenu>.nav-item").forEach(item => {
        if (logged) {
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

    // Logout handling
    const logoutButton = document.getElementById('logoutLink');
    if (logoutButton) {
        logoutButton.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await asyncRequest({ path: '/logout', method: 'POST' });
            } catch (err) {
                console.error('Logout error:', err);
            }
            localStorage.removeItem('user');
            localStorage.removeItem('sessionExpiration');
            window.location.href = '/';
        });
    }
});