import '../styles/styles.css';
import App from './pages/app.js';

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker API tidak didukung di browser ini.');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service worker berhasil terdaftar:', registration);
  } catch (error) {
    console.log('Gagal mendaftarkan service worker:', error);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
    notificationButton: document.querySelector('#notification-button'),
  });
  
  await app.renderPage();
  
  await registerServiceWorker(); 

  window.addEventListener('hashchange', async () => {
    await app.renderPage();
  });
});
