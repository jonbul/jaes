import { showAlert, asyncRequest } from '/js/utils/functions.js';
document.getElementById('btnLogin').addEventListener('click', function (event) {
    event.preventDefault(); // Prevent the default form submission

    const email = document.getElementById('inputEmail').value;
    const password = document.getElementById('inputPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    asyncRequest({
        path: '/login',
        method: 'POST',
        data: { email, password, rememberMe }
    })
        .then(data => {
            if (data.success) {
                // Handle successful login (e.g., redirect to dashboard)
                localStorage.setItem('token', data.token); // Store the token in localStorage
                cookieStore.set("token", localStorage.getItem("token")); // Set the token as a cookie
                window.location.href = '/'; // Redirect to home
            } else {
                // Handle login failure (e.g., display error message)
                showAlert({ type: 'danger', title: 'Error', msg: data.error || 'Login failed' });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert({ type: 'danger', title: 'Error', msg: 'An error occurred during login' });
        });
});