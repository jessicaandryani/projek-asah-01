import CONFIG from '../config';

const ENDPOINTS = {
  REGISTER: `${CONFIG.BASE_URL}/register`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
  GET_STORIES: `${CONFIG.BASE_URL}/stories`,
  ADD_STORY: `${CONFIG.BASE_URL}/stories`,
};

async function register({ name, email, password }) {
  const response = await fetch(ENDPOINTS.REGISTER, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, password }),
  });
  
  const responseJson = await response.json();
  if (responseJson.error) {
    throw new Error(responseJson.message);
  }
  
  return responseJson;
}

async function login({ email, password }) {
  const response = await fetch(ENDPOINTS.LOGIN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
  const responseJson = await response.json();
  if (responseJson.error) {
    throw new Error(responseJson.message);
  }
  
  return responseJson.loginResult;
}

async function getAllStories(token) {
  const response = await fetch(`${ENDPOINTS.GET_STORIES}?location=1`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const responseJson = await response.json();
  if (responseJson.error) {
    throw new Error(responseJson.message);
  }
  
  return responseJson.listStory;
}

async function addNewStory({ token, description, photo, lat, lon }) {
  const formData = new FormData();
  formData.append('description', description);
  formData.append('photo', photo);
  formData.append('lat', lat);
  formData.append('lon', lon);

  const response = await fetch(ENDPOINTS.ADD_STORY, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  const responseJson = await response.json();
  if (responseJson.error) {
    throw new Error(responseJson.message);
  }


  
  return responseJson;
}

async function subscribePushNotification({ token, endpoint, keys }) {
  const response = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      endpoint,
      keys: {
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    }),
  });

  const responseJson = await response.json();
  if (!response.ok) { 
    throw new Error(responseJson.message || 'Gagal subscribe ke server.');
  }
  return responseJson;
}

async function unsubscribePushNotification({ token, endpoint }) {
  const response = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ endpoint }),
  });

  const responseJson = await response.json();
  if (!response.ok) {
    throw new Error(responseJson.message || 'Gagal unsubscribe dari server.');
  }
  return responseJson;
}

export { register, login, getAllStories, addNewStory,subscribePushNotification,unsubscribePushNotification };

