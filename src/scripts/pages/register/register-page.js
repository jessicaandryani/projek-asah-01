import { register } from '../../data/api';

export default class RegisterPage {
  async render() {
    return `
      <section class="container">
        <h1>Register Page</h1>
        <form id="register-form">
          <div class="form-group">
            <label for="register-name">Name</label>
            <input type="text" id="register-name" class="form-control" required>
          </div>
          <div class="form-group">
            <label for="register-email">Email</label>
            <input type="email" id="register-email" class="form-control" required>
          </div>
          <div class="form-group">
            <label for="register-password">Password</label>
            <input type="password" id="register-password" class="form-control" minlength="8" required>
          </div>
          <button type="submit" class="btn">Register</button>
        </form>
        <p>Sudah punya akun? <a href="#/login">Login di sini</a></p>
      </section>
    `;
  }

  async afterRender() {
    const registerForm = document.querySelector('#register-form');
    
    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const name = document.querySelector('#register-name').value;
      const email = document.querySelector('#register-email').value;
      const password = document.querySelector('#register-password').value;

      try {
        await register({ name, email, password });
        alert('Registrasi Berhasil! Silakan login.');
        window.location.hash = '#/login';
      } catch (error) {
        console.error(error);
        alert(error.message);
      }
    });
  }
}
