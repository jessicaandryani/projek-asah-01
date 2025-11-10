import { subscribePushNotification, unsubscribePushNotification } from '../data/api';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const NotificationHelper = {
  VAPID_PUBLIC_KEY: 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk',

  async checkSubscription() {
    return navigator.serviceWorker.ready
      .then((swRegistration) => swRegistration.pushManager.getSubscription());
  },

  async subscribe() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Fitur Push Notification tidak didukung di browser ini.');
      return;
    }

    const swRegistration = await navigator.serviceWorker.ready;
    let subscription = await swRegistration.pushManager.getSubscription();

    if (subscription) {
      alert('Anda sudah berlangganan notifikasi.');
      return;
    }

    try {
      const permission = await window.Notification.requestPermission();
      if (permission !== 'granted') {
        alert('Anda harus mengizinkan notifikasi untuk fitur ini.');
        return;
      }

      subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(this.VAPID_PUBLIC_KEY),
      });

      const token = localStorage.getItem('token');
      if (!token) {
        alert('Anda harus login untuk subscribe.');
        return;
      }

      await subscribePushNotification({
        token,
        endpoint: subscription.endpoint,
        keys: subscription.toJSON().keys,
      });

      alert('Berhasil berlangganan notifikasi!');
    } catch (error) {
      console.error('Gagal subscribe:', error);
      alert(`Gagal berlangganan: ${error.message}`);
      if (subscription) {
        await subscription.unsubscribe();
      }
    }
  },

  async unsubscribe() {
    const swRegistration = await navigator.serviceWorker.ready;
    const subscription = await swRegistration.pushManager.getSubscription();

    if (!subscription) {
      alert('Anda belum berlangganan notifikasi.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Anda harus login untuk unsubscribe.');
        return;
      }

      await unsubscribePushNotification({
        token,
        endpoint: subscription.endpoint,
      });

      await subscription.unsubscribe();

      alert('Berhasil berhenti berlangganan notifikasi.');
    } catch (error) {
      console.error('Gagal unsubscribe:', error);
      alert(`Gagal berhenti berlangganan: ${error.message}`);
    }
  },
};

export default NotificationHelper;
