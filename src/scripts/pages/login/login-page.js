import { login } from '../../data/api';

export default class LoginPage {
  async render() {

    return `
      <section class="container">
        <h1>Login Page</h1>
        <form id="login-form">
          <div class="form-group">
            <label for="login-email">Email</label>
            <input type="email" id="login-email" class="form-control" required>
          </div>
          <div class="form-group">
            <label for="login-password">Password</label>
            <input type="password" id="login-password" class="form-control" required>
          </div>
          <button type="submit" class="btn">Login</button>
        </form>
        <p>Belum punya akun? <a href="#/register">Daftar di sini</a></p>
      </section>
    `;
  }

  async afterRender() {

    const loginForm = document.querySelector('#login-form');
    
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const email = document.querySelector('#login-email').value;
      const password = document.querySelector('#login-password').value;

      try {
        const loginResult = await login({ email, password });
        localStorage.setItem('token', loginResult.token); 
        alert('Login Berhasil!');
        window.location.hash = '#/';
      } catch (error) {
        console.error(error);
        alert(error.message);
      }
    });
  }
}
