import routes from '../routes/routes';
import { getActiveRoute } from '../routes/url-parser';
import NotificationHelper from '../utils/notification-helper';

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;
  #notificationButton = null;

  constructor({ navigationDrawer, drawerButton, content, notificationButton }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;
    this.#notificationButton = notificationButton;

    this.#setupDrawer();
    this._setupLogoutButton();
    this._setupNotificationButton();
    this._updateLoginStatusUI();
  }

  #setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      this.#navigationDrawer.classList.toggle('open');
    });
    document.body.addEventListener('click', (event) => {
      if (!this.#navigationDrawer.contains(event.target) && !this.#drawerButton.contains(event.target)) {
        this.#navigationDrawer.classList.remove('open');
      }
      this.#navigationDrawer.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove('open');
        }
      });
    });
  }

  _setupLogoutButton() {
    const logoutLink = document.querySelector('#logout-link');
    if (logoutLink) {
      logoutLink.addEventListener('click', (event) => {
        event.preventDefault();
        localStorage.removeItem('token');
        alert('Logout berhasil!');
        this._updateLoginStatusUI();
        window.location.hash = '#/login';
      });
    }
  }

  async _setupNotificationButton() {
    if (!this.#notificationButton) return;

    const subscription = await NotificationHelper.checkSubscription();
    
    this._updateNotificationButtonUI(!!subscription);

    this.#notificationButton.addEventListener('click', async () => {
      const currentSubscription = await NotificationHelper.checkSubscription();
      
      if (currentSubscription) {
        await NotificationHelper.unsubscribe();
      } else {
        await NotificationHelper.subscribe();
      }
      
      const finalSubscription = await NotificationHelper.checkSubscription();
      this._updateNotificationButtonUI(!!finalSubscription);
    });
  }

  _updateNotificationButtonUI(isSubscribed) {
    if (isSubscribed) {
      this.#notificationButton.innerHTML = '🔕';
      this.#notificationButton.setAttribute('aria-label', 'Nonaktifkan Notifikasi');
    } else {
      this.#notificationButton.innerHTML = '🔔';
      this.#notificationButton.setAttribute('aria-label', 'Aktifkan Notifikasi');
    }
  }

  _updateLoginStatusUI() {
    const token = localStorage.getItem('token');
    if (token) {
      document.body.classList.add('logged-in');
      this.#notificationButton.style.display = 'block';
    } else {
      document.body.classList.remove('logged-in');
      this.#notificationButton.style.display = 'none';
    }
  }

  async renderPage() {
    this._updateLoginStatusUI();
    
    if (localStorage.getItem('token')) {
      const subscription = await NotificationHelper.checkSubscription();
      this._updateNotificationButtonUI(!!subscription);
    }
    
    const url = getActiveRoute();
    const page = routes[url];
    const pageContent = await page.render();
    if (!document.startViewTransition) {
      this.#content.innerHTML = pageContent;
      await page.afterRender();
      return;
    }
    const transition = document.startViewTransition(() => {
      this.#content.innerHTML = pageContent;
    });
    try {
      await transition.finished;
      await page.afterRender();
    } catch (error) {
      console.error('View Transition failed:', error);
      await page.afterRender();
    }
  }
}

export default App;
